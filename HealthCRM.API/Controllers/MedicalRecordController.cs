using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthCRM.API.Data;
using HealthCRM.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace HealthCRM.API.Controllers
{
    [Route("api/medicalrecord")] // Base route
    [ApiController]
    public class MedicalRecordController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MedicalRecordController(AppDbContext context)
        {
            _context = context;
        }

        // Create a new medical record
        [HttpPost]
        [Authorize(Roles = "Admin,Doctor")]
        public async Task<IActionResult> CreateMedicalRecord(MedicalRecord medicalRecord)
        {
            try
            {
                if (medicalRecord == null)
                    return BadRequest("Medical record object cannot be null.");

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check if the patient exists
                if (!await _context.Patients.AnyAsync(p => p.Id == medicalRecord.PatientId))
                {
                    return BadRequest("Patient with the provided ID does not exist.");
                }

                // Check if the doctor exists
                if (!await _context.Doctors.AnyAsync(d => d.Id == medicalRecord.DoctorId))
                {
                    return BadRequest("Doctor with the provided ID does not exist.");
                }

                // Check if a medical record already exists for this patient (One-to-One relationship)
                var existingMedicalRecord = await _context.MedicalRecords
                    .FirstOrDefaultAsync(mr => mr.PatientId == medicalRecord.PatientId);

                if (existingMedicalRecord != null)
                {
                    return BadRequest("A medical record for this patient already exists.");
                }

                _context.MedicalRecords.Add(medicalRecord);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Medical record created successfully." });
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while creating the medical record.", error = ex.Message });
            }
        }

        // Get a specific medical record by ID
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,Doctor,Staff")]
        public async Task<IActionResult> GetMedicalRecordById(Guid id)
        {
            try
            {
                var medicalRecord = await _context.MedicalRecords.FindAsync(id);

                if (medicalRecord == null)
                    return NotFound();

                return Ok(medicalRecord);
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while getting the medical record.", error = ex.Message });
            }
        }

        // Get all medical records
        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Doctor,Staff")]
        public async Task<IActionResult> GetAllMedicalRecords()
        {
            try
            {
                if (!await _context.MedicalRecords.AnyAsync())
                {
                    return NotFound();
                }

                var medicalRecords = await _context.MedicalRecords.ToListAsync();
                return Ok(medicalRecords);
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while getting all the medical records.", error = ex.Message });
            }
        }

        // Update an existing medical record
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Doctor")]
        public async Task<IActionResult> UpdateMedicalRecord(Guid id, MedicalRecord medicalRecord)
        {
            try
            {
                if (medicalRecord == null)
                {
                    return BadRequest("Medical record object cannot be null.");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (id != medicalRecord.Id)
                {
                    return BadRequest("Medical record ID mismatch.");
                }

                if (!await _context.Patients.AnyAsync(p => p.Id == medicalRecord.PatientId))
                {
                    return BadRequest("Patient with the provided ID does not exist.");
                }

                if (!await _context.Doctors.AnyAsync(d => d.Id == medicalRecord.DoctorId))
                {
                    return BadRequest("Doctor with the provided ID does not exist.");
                }

                var existingMedicalRecord = await _context.MedicalRecords.FindAsync(id);

                if (existingMedicalRecord == null)
                {
                    return NotFound();
                }

                existingMedicalRecord.AMKA = medicalRecord.AMKA;
                existingMedicalRecord.Disease = medicalRecord.Disease;
                existingMedicalRecord.MedicalHistory = medicalRecord.MedicalHistory;
                existingMedicalRecord.Medications = medicalRecord.Medications;
                existingMedicalRecord.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Medical record updated successfully." });
            }
            catch (DbUpdateConcurrencyException)
            {
                // Handle concurrency issues
                if (!await _context.MedicalRecords.AnyAsync(m => m.Id == medicalRecord.Id))
                    return NotFound();  // If medical record doesn't exist anymore, return NotFound response

                throw;  // If it's a real concurrency issue, re-throw the exception
            }
            catch (Exception ex)
            {
                // Handle general exceptions 
                return StatusCode(500, new { message = "An error occurred while updating the medical record.", error = ex.Message });
            }
        }

        // Delete a medical record by ID
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMedicalRecord(Guid id)
        {
            try
            {
                var medicalRecord = await _context.MedicalRecords.FindAsync(id);
                if (medicalRecord == null)
                    return NotFound();

                _context.MedicalRecords.Remove(medicalRecord);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Medical record deleted successfully." });
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while deleting the medical record.", error = ex.Message });
            }
        }
    }
}