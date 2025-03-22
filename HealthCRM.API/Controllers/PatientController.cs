using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthCRM.API.Data;
using HealthCRM.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace HealthCRM.API.Controllers
{
    [Route("api/patient")] // Base route
    [ApiController]
    public class PatientController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PatientController(AppDbContext context)
        {
            _context = context;
        }

        // Create a new patient
        [HttpPost]
        [Authorize(Roles = "Admin,Manager,Doctor")]
        public async Task<IActionResult> CreatePatient(Patient patient)
        {
            if (patient == null)
                return BadRequest("Patient object cannot be null.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Ensure the Doctor exists
            var doctorExists = await _context.Doctors.AnyAsync(d => d.Id == patient.DoctorId);
            if (!doctorExists)
                return BadRequest("Doctor with the provided ID does not exist.");

            // Ensure AMKA uniqueness
            if (await _context.Patients.AnyAsync(p => p.ΑΜΚΑ == patient.ΑΜΚΑ))
                return BadRequest("A patient with this ΑΜΚΑ already exists.");

            // Save the new patient
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Patient created successfully." }); // 200 OK with success message    

        }

        // Get a specific patient by ID
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,Doctor,Staff")]
        public async Task<IActionResult> GetPatientById(Guid id)
        {
            var patient = await _context.Patients
                .Include(p => p.Doctor)
                .Include(p => p.MedicalRecord)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (patient == null)
                return NotFound();

            return Ok(patient); // 200 OK with patient details
        }

        // Get all patients
        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Doctor,Staff")]
        public async Task<IActionResult> GetAllPatients()
        {
            try 
            {
                if (!await _context.Patients.AnyAsync())
                {
                    return NotFound();
                }

                var patients = await _context.Patients.ToListAsync();
                return Ok(new { message = "All doctors.", patients });
            }
            catch (Exception ex) 
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while getting all the patients.", error = ex.Message });
            }

        }

        // Update an existing patient
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager,Doctor")]
        public async Task<IActionResult> UpdatePatient(Guid id, Patient patient)
        {
            if (patient == null)
                return BadRequest("Patient object cannot be null.");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != patient.Id)
                return BadRequest("Patient ID mismatch.");

            var existingPatient = await _context.Patients.FindAsync(id);
            if (existingPatient == null)
                return NotFound();

            // Ensure the Doctor exists
            var doctorExists = await _context.Doctors.AnyAsync(d => d.Id == patient.DoctorId);
            if (!doctorExists)
                return BadRequest("Doctor with the provided ID does not exist.");

            // Check if the AMKA has unique value 
            if (await _context.Patients.AnyAsync(p => p.ΑΜΚΑ == patient.ΑΜΚΑ && p.Id != id))
                return BadRequest("A patient with this ΑΜΚΑ already exists.");

            try
            {
                // Update the patient's details
                existingPatient.FullName = patient.FullName;
                existingPatient.ΑΜΚΑ = patient.ΑΜΚΑ;
                existingPatient.Email = patient.Email;
                existingPatient.PhoneNumber = patient.PhoneNumber;
                existingPatient.Address = patient.Address;
                existingPatient.City = patient.City;
                existingPatient.DoctorId = patient.DoctorId;
                existingPatient.MedicalRecordId = patient.MedicalRecordId;
                existingPatient.UpdatedAt = DateTime.UtcNow;

                // Save changes to the database
                await _context.SaveChangesAsync();

                // Return success message
                return Ok(new { message = "Patient updated successfully." }); // 200 OK with success message
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Patients.AnyAsync(p => p.Id == id))
                    return NotFound();

                throw; // Re-throw exception if it's a real concurrency issue
            }
        }

        // Delete a patient by ID
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeletePatient(Guid id)
        {
            var patient = await _context.Patients.FindAsync(id);
            if (patient == null)
                return NotFound();

            // Delete the specific patient
            _context.Patients.Remove(patient);
            await _context.SaveChangesAsync();

            // Return success message
            return Ok(new { message = "Patient deleted successfully." }); // 200 OK with success message
        }
    }
}
