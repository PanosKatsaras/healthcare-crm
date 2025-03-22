using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace HealthCRM.API.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]  
        [MaxLength(50)] 
        public string FullName { get; set; } = string.Empty;

    }
}
