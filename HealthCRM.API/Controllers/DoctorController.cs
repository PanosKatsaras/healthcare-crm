using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthCRM.API.Data;
using HealthCRM.API.Models;

namespace HealthCRM.API.Controllers
{
    [Route("api/doctor")] // Base route
    [ApiController]
    public class DoctorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DoctorController(AppDbContext context)
        {
            _context = context;
        }

        // Create a new doctor
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateDoctor(Doctor doctor)
        {
            if (doctor == null)
                return BadRequest("Doctor object cannot be null.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if the AMKA already exists
            if (await _context.Doctors.AnyAsync(d => d.AMKA == doctor.AMKA))
                return BadRequest("A doctor with this ΑΜΚΑ already exists.");

            // Check if the Email already exists
            if (await _context.Doctors.AnyAsync(d => d.Email == doctor.Email))
                return BadRequest("A doctor with this email already exists.");

            // Save the new doctor to the database
            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Doctor created successfully." }); // 200 OK with success message 

        }

        // Get a specific doctor by ID
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,Doctor,Staff")]
        public async Task<IActionResult> GetDoctorById(Guid id)
        {
            var doctor = await _context.Doctors.FindAsync(id);

            if (doctor == null)
                return NotFound();

            return Ok(doctor); // 200 OK with doctor details
        }

        // Get all doctors
        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<IActionResult> GetAllDoctors()
        {
            try
            {
                if (!await _context.Doctors.AnyAsync())
                {
                    return NotFound();
                }

                var doctors = await _context.Doctors.ToListAsync();
                return Ok(new { message = "All doctors.", doctors });
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while getting all the doctors.", error = ex.Message });
            }
        }

        // Update an existing doctor
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateDoctor(Guid id, Doctor doctor)
        {
            if (doctor == null)
                return BadRequest("Doctor object cannot be null.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != doctor.Id)
                return BadRequest("Doctor ID mismatch.");

            var existingDoctor = await _context.Doctors.FindAsync(id);
            if (existingDoctor == null)
                return NotFound();

            // Check AMKA uniqueness
            if (existingDoctor.AMKA != doctor.AMKA &&
                await _context.Doctors.AnyAsync(d => d.AMKA == doctor.AMKA))
                return BadRequest("A doctor with this ΑΜΚΑ already exists.");

            // Check Email uniqueness
            if (existingDoctor.Email != doctor.Email &&
                await _context.Doctors.AnyAsync(d => d.Email == doctor.Email))
                return BadRequest("A doctor with this email already exists.");

            try
            {
                // Update the doctor details
                existingDoctor.FullName = doctor.FullName;
                existingDoctor.Specialization = doctor.Specialization;
                existingDoctor.AMKA = doctor.AMKA;
                existingDoctor.Email = doctor.Email;
                existingDoctor.PhoneNumber = doctor.PhoneNumber;
                existingDoctor.Address = doctor.Address;
                existingDoctor.City = doctor.City;
                existingDoctor.UpdatedAt = DateTime.UtcNow;

                // Save the changes
                await _context.SaveChangesAsync();

                // Return success message
                return Ok(new { message = "Doctor updated successfully." }); // 200 OK with success message
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Doctors.AnyAsync(d => d.Id == id))
                    return NotFound();

                throw; // Re-throw exception if it's a real concurrency issue
            }
        }

        // Delete a doctor by ID
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteDoctor(Guid id)
        {
            var doctor = await _context.Doctors
           .Include(d => d.Patients)
           .Include(d => d.MedicalRecords)
           .FirstOrDefaultAsync(d => d.Id == id);

            if (doctor == null)
                return NotFound();

            if (doctor.Patients.Count > 0)
                return BadRequest("Cannot delete a doctor with associated patients.");

            if (doctor.MedicalRecords.Count > 0)
                return BadRequest("Cannot delete a doctor with associated medical records.");

            // Delete the specific doctor
            _context.Doctors.Remove(doctor);
            await _context.SaveChangesAsync();

            // Return success message
            return Ok(new { message = "Doctor deleted successfully." }); // 200 OK with success message
        }
    }
}
