using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthCRM.API.Data;
using HealthCRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using HealthCRM.API.Utilities;

namespace HealthCRM.API.Controllers
{
    [Route("api/appointment")] // Base route
    [ApiController]
    public class AppointmentController : ControllerBase
    {

        private readonly AppDbContext _context;

        public AppointmentController(AppDbContext context)
        {

            _context = context;
        }

        // Create a new appointment
        [HttpPost]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<IActionResult> CreateAppointment(Appointment appointment)
        {

            try
            {
                if (appointment == null)
                    return BadRequest("Appointment object cannot be null.");

                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                    return BadRequest(new { message = "Validation Failed", errors });
                }

                if (!Enum.IsDefined(typeof(ExamType), appointment.ExamType))
                {
                    return BadRequest("Invalid ExamType.");
                }

                if (!Enum.IsDefined(typeof(ExamStatus), appointment.Status))
                {
                    return BadRequest("Invalid Status.");
                }

                if (appointment.PatientId != null && !await _context.Patients.AnyAsync(p => p.Id == appointment.PatientId))
                {
                    return BadRequest("Patient with the provided ID does not exist.");
                }

                if (appointment.DoctorId != null && !await _context.Doctors.AnyAsync(d => d.Id == appointment.DoctorId))
                {
                    return BadRequest("Doctor with the provided ID does not exist.");
                }

                // Ensure unique ExaminationId constraint
                if (appointment.ExaminationId != null && await _context.Appointments.AnyAsync(a => a.ExaminationId == appointment.ExaminationId))
                    return Conflict(new { message = "This Examination ID is already linked to another appointment." });

                // Check if TotalPrice is valid
                if (appointment.TotalPrice.HasValue && appointment.TotalPrice < 0)
                {
                    return BadRequest("Total price must be a positive value.");
                }

                if (appointment.AppointmentDate < DateTime.UtcNow)
                {
                    return BadRequest("Appointment date cannot be in the past.");
                }

                // Round the AppointmentDate to the nearest 30 minutes
                appointment.AppointmentDate = DateTimeUtilities.RoundToNearest30Minutes(appointment.AppointmentDate);

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Appointment created successfully." });

            }
            catch (DbUpdateException ex) when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx && sqlEx.Message.Contains("IX_Appointments_ExaminationId"))
            {
                return Conflict(new { message = "This Examination ID is already assigned to another appointment." });
            }

            catch (Exception ex)
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while creating the appoinment.", error = ex.Message });

            }
        }

        // Get a specific appointment by ID
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<IActionResult> GetAppointmentById(int id)
        {
            try
            {
                var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                    return NotFound();

                return Ok(appointment);
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while getting the appoinment.", error = ex.Message });
            }
        }

        // Get all appointments
        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<IActionResult> GetAllAppointments()
        {
            try
            {
                if (!await _context.Appointments.AnyAsync())
                {
                    return NotFound();
                }

                var appointments = await _context.Appointments
                .Include(a => a.Examination)
                .ToListAsync();

                if (appointments == null || appointments.Count == 0)
                {
                    return NotFound(new { message = "No appointments found." });
                }

                return Ok(new { message = "All appointments.", appointments });
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while getting all the appoinments.", error = ex.Message });
            }

        }

        // Update an existing appointment
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager,Staff")]

        public async Task<IActionResult> UpdateAppointment(int id, Appointment appointment)
        {
            try
            {
                if (appointment == null)
                {
                    return BadRequest("Appointment object cannot be null.");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (id != appointment.Id)
                {
                    return BadRequest("Appointment ID mismatch.");
                }

                if (!Enum.IsDefined(typeof(ExamType), appointment.ExamType))
                {
                    return BadRequest("Invalid ExamType.");
                }

                if (!Enum.IsDefined(typeof(ExamStatus), appointment.Status))
                {
                    return BadRequest("Invalid Status.");
                }

                if (appointment.PatientId != null && !await _context.Patients.AnyAsync(p => p.Id == appointment.PatientId))
                {
                    return BadRequest("Patient with the provided ID does not exist.");
                }

                if (appointment.DoctorId != null && !await _context.Doctors.AnyAsync(d => d.Id == appointment.DoctorId))
                {
                    return BadRequest("Doctor with the provided ID does not exist.");
                }

                // Check if TotalPrice is valid
                if (appointment.TotalPrice.HasValue && appointment.TotalPrice < 0)
                {
                    return BadRequest("Total price must be a positive value.");
                }

                if (appointment.AppointmentDate < DateTime.UtcNow)
                {
                    return BadRequest("Appointment date cannot be in the past.");
                }

                // Round the AppointmentDate to the nearest 30 minutes
                appointment.AppointmentDate = DateTimeUtilities.RoundToNearest30Minutes(appointment.AppointmentDate);

                var existingAppointment = await _context.Appointments.FindAsync(id);

                if (existingAppointment == null)
                {
                    return NotFound();
                }

                // Prevent updating to an already used ExaminationId
                if (appointment.ExaminationId != null && existingAppointment.ExaminationId != appointment.ExaminationId)
                {
                    bool examinationExists = await _context.Appointments.AnyAsync(a => a.ExaminationId == appointment.ExaminationId);
                    if (examinationExists)
                        return Conflict(new { message = "This Examination ID is already linked to another appointment." });
                }

                existingAppointment.FullName = appointment.FullName;
                existingAppointment.PhoneNumber = appointment.PhoneNumber;
                existingAppointment.Email = appointment.Email;
                existingAppointment.AppointmentDate = appointment.AppointmentDate;
                existingAppointment.ExamType = appointment.ExamType;
                existingAppointment.Status = appointment.Status;
                existingAppointment.Notes = appointment.Notes;
                existingAppointment.PatientId = appointment.PatientId;
                existingAppointment.DoctorId = appointment.DoctorId;
                existingAppointment.MedicalRecordId = appointment.MedicalRecordId;
                existingAppointment.PrescriptionCode = appointment.PrescriptionCode;
                existingAppointment.TotalPrice = appointment.TotalPrice;
                existingAppointment.UpdatedAt = DateTime.UtcNow;

                // Handle examination separately
                if (appointment.ExaminationId.HasValue)
                {
                    // If there's a new examination ID
                    if (!await _context.Examinations.AnyAsync(e => e.Id == appointment.ExaminationId))
                        return BadRequest("Invalid Examination ID.");

                    existingAppointment.ExaminationId = appointment.ExaminationId;
                }
                else
                {
                    // If examination is being removed
                    existingAppointment.ExaminationId = null;
                    existingAppointment.Examination = null;
                }
                await _context.SaveChangesAsync();

                return Ok(new { message = "Appointment updated successfully." }); // 200 OK with success message

            }
            catch (DbUpdateConcurrencyException)
            {
                // Handle concurrency issues
                if (!await _context.Appointments.AnyAsync(a => a.Id == appointment.Id))
                    return NotFound();  // If appointment doesn't exist anymore, return NotFound response
                throw;  // If it's a real concurrency issue, re-throw the exception
            }
            catch (Exception ex)
            {
                // Handle general exceptions 
                return StatusCode(500, new { message = "An error occurred while updating the appointment.", error = ex.Message });
            }

        }

        // New endpoints to return enum values
        [HttpGet("exam-types")]
        public IActionResult GetExamTypes()
        {
            var examTypes = Enum.GetValues(typeof(ExamType))
                .Cast<ExamType>()
                .ToDictionary(e => (int)e, e => e.ToString());

            return Ok(examTypes);
        }

        [HttpGet("exam-statuses")]
        public IActionResult GetExamStatuses()
        {
            var examStatuses = Enum.GetValues(typeof(ExamStatus))
                .Cast<ExamStatus>()
                .ToDictionary(e => (int)e, e => e.ToString());

            return Ok(examStatuses);
        }

        // Delete an appointment by ID
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(id);
                if (appointment == null)
                    return NotFound();

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Appointment deleted successfully." }); // 200 OK with success message
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                return StatusCode(500, new { message = "An error occurred while deleting the appointment.", error = ex.Message });
            }

        }
    }
}