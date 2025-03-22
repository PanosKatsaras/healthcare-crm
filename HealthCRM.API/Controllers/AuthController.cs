using HealthCRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace HealthCRM.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<AuthController> _logger;
        private readonly string _jwtSecretKey;
        private readonly string _jwtIssuer;
        private readonly string _jwtAudience;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;

            // Load values from .env
            _jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
                            ?? throw new InvalidOperationException("JWT_SECRET_KEY is missing from the environment variables.");
            _jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
                         ?? throw new InvalidOperationException("JWT_ISSUER is missing from the environment variables.");
            _jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                           ?? throw new InvalidOperationException("JWT_AUDIENCE is missing from the environment variables.");
        }

        // REGISTER A NEW USER
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state: {ModelState}", ModelState);
                return BadRequest(ModelState);
            }

            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return BadRequest(new { Message = "User already exists." });

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(new { Message = "User creation failed.", Errors = result.Errors });

            var defaultRole = "Staff";
            if (!await _roleManager.RoleExistsAsync(defaultRole))
                await _roleManager.CreateAsync(new IdentityRole(defaultRole));

            await _userManager.AddToRoleAsync(user, defaultRole);
            _logger.LogInformation($"Assigning role {defaultRole} to user {user.Email}");

            return Ok(new { message = "User registered successfully." });
        }

        // LOGIN (Stores JWT in HttpOnly Cookie)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state: {ModelState}", ModelState);
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized(new { Message = "Invalid credentials." });

            var authClaims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id),
                new(ClaimTypes.Name, user.UserName ?? ""),
                new(ClaimTypes.Email, user.Email ?? "")
            };

            var roles = await _userManager.GetRolesAsync(user);
            authClaims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

            var token = GenerateJwtToken(authClaims);
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

            Response.Cookies.Append("HealthAuth", tokenString, new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDevelopment,
                SameSite = SameSiteMode.Lax,
                Expires = token.ValidTo
            });

            return Ok(new { message = "Login successful", expiration = token.ValidTo });
        }


        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Remove the authentication cookie
            Response.Cookies.Delete("HealthAuth");
            return Ok(new { message = "Logout successful" });
        }

        // CHECK AUTH STATUS (For Frontend)
        [HttpGet("check-auth")]
        public IActionResult CheckAuth()
        {
            var token = Request.Cookies["HealthAuth"];
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogError("Token is missing or empty.");
                return Unauthorized(new { message = "Not authenticated" });
            }

            _logger.LogInformation($"Received token: {token}");

            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var secretKey = _jwtSecretKey;
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _jwtIssuer,
                    ValidAudience = _jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
                    ClockSkew = TimeSpan.Zero
                };

                // Validate the token and extract the principal (which contains claims)
                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

                // Extract roles from the claims
                var roles = principal.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

                _logger.LogInformation($"Roles from token: {string.Join(", ", roles)}");

                return Ok(new { message = "Authenticated", roles });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Token validation failed: {ex.Message}");
                return Unauthorized(new { message = "Invalid or expired token" });
            }
        }

        // GET LOGGED-IN USER INFO
        [HttpGet("user")]
        [Authorize(Roles = "Admin,Manager,Doctor,Staff")]
        public IActionResult GetUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var roles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();

            return Ok(new { id = userId, email, roles });
        }

        // CHANGE USER ROLE (Admin Only)
        [HttpPost("change-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ChangeRole([FromBody] ChangeRoleModel model)
        {
            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
                return NotFound(new { Message = "User not found." });

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, model.NewRole);

            return Ok(new { Message = $"User role updated to {model.NewRole} successfully." });
        }

        // GET ALL USERS (Admin Only)
        [HttpGet("all-users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();

            var userList = users.Select(user => new
            {
                Id = user.Id,
                Email = user.Email,
                Roles = _userManager.GetRolesAsync(user).Result // Get user roles
            });
            _logger.LogInformation($"All users: {string.Join(", ", users)}");
            _logger.LogInformation($"Users list: {string.Join(", ", userList)}");
            return Ok(userList);
        }

        // DELETE USER (Admin Only)
        [HttpDelete("delete-user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { Message = "User not found." });

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { Message = "User deletion failed.", Errors = result.Errors });

            return Ok(new { Message = "User deleted successfully." });
        }

        private JwtSecurityToken GenerateJwtToken(List<Claim> authClaims)
        {
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecretKey));

            return new JwtSecurityToken(
                issuer: _jwtIssuer,
                audience: _jwtAudience,
                expires: DateTime.UtcNow.AddHours(1),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );
        }

        // Change Password
        [HttpPost("change-password")]
        [Authorize(Roles = "Admin,Manager,Doctor,Staff")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state: {ModelState}", ModelState);
                return BadRequest(ModelState);
            }

            // Extract the UserId from the JWT token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized(new { message = "User not authorized." });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Verify the old password
            var validOldPassword = await _userManager.CheckPasswordAsync(user, model.OldPassword);
            if (!validOldPassword)
            {
                return BadRequest(new { message = "Old password is incorrect." });
            }

            // Change password
            var result = await _userManager.ChangePasswordAsync(user, model.OldPassword, model.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to change password." });
            }

            return Ok(new { message = "Password changed successfully." });
        }
    }
}
