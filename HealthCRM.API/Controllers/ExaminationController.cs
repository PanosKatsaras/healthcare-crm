using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HealthCRM.API.Data;
using HealthCRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System.IO;
using HealthCRM.API.Utilities;


namespace HealthCRM.API.Controllers
{
    [Route("api/examination")]
    [ApiController]
    public class ExaminationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ExaminationController> _logger;
        private const int MaxFileSizeInMB = 5;
        private const string AllowedFileType = "application/pdf";

        public ExaminationController(AppDbContext context, ILogger<ExaminationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Creates a new examination with optional PDF result
        [HttpPost]
        [Authorize(Roles = "Admin,Manager,Staff")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateExamination([FromForm] Examination examination, [FromForm] IFormFile? resultPdf)
        {
            try
            {
                if (examination == null)
                    return BadRequest("Examination object cannot be null.");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Validate DoctorId and PatientId
                if ((examination.DoctorId != null && !await _context.Doctors.AnyAsync(d => d.Id == examination.DoctorId)) ||
                    (examination.PatientId != null && !await _context.Patients.AnyAsync(p => p.Id == examination.PatientId)))
                {
                    return BadRequest("Invalid Doctor ID or Patient ID.");
                }

                // Validate and Convert IFormFile to byte[] before saving
                if (resultPdf != null)
                {
                    ValidateFile(resultPdf);
                    using var memoryStream = new MemoryStream();
                    await resultPdf.CopyToAsync(memoryStream);
                    examination.ResultPdf = memoryStream.ToArray();
                }

                _context.Examinations.Add(examination);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Examination created successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating the examination.");
                return StatusCode(500, new { message = "An error occurred while creating the examination.", error = ex.Message });
            }
        }

        // Gets all examinations
        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<ActionResult<IEnumerable<Examination>>> GetExaminations()
        {
            try
            {
                var examinations = await _context.Examinations.ToListAsync();
                return Ok(examinations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching the list of examinations.");
                return StatusCode(500, new { message = "An error occurred while fetching the examinations.", error = ex.Message });
            }
        }

        // Gets an examination by ID
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,Staff")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Examination>> GetExamination(int id)
        {
            try
            {
                var examination = await _context.Examinations.FindAsync(id);
                if (examination == null)
                {
                    return NotFound();
                }
                return examination;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while fetching the examination with ID {id}.");
                return StatusCode(500, new { message = "An error occurred while fetching the examination.", error = ex.Message });
            }
        }

        // Updates an existing examination
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager,Staff")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateExamination(int id, [FromForm] Examination examination, [FromForm] IFormFile? resultPdf)
        {
            try
            {
                if (examination == null)
                    return BadRequest("Examination object cannot be null.");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Find the existing examination by ID
                var existingExamination = await _context.Examinations.FindAsync(id);
                if (existingExamination == null)
                    return NotFound($"Examination with ID {id} not found.");

                // Validate DoctorId and PatientId
                if ((examination.DoctorId != null && !await _context.Doctors.AnyAsync(d => d.Id == examination.DoctorId)) ||
                    (examination.PatientId != null && !await _context.Patients.AnyAsync(p => p.Id == examination.PatientId)))
                {
                    return BadRequest("Invalid Doctor ID or Patient ID.");
                }

                // Update fields (not the ResultPdf, we will update it separately if provided)
                existingExamination.PatientId = examination.PatientId;
                existingExamination.DoctorId = examination.DoctorId;
                existingExamination.Type = examination.Type;
                existingExamination.Status = examination.Status;
                existingExamination.Price = examination.Price;
                existingExamination.Description = examination.Description;
                existingExamination.UpdatedAt = DateTime.UtcNow;

                // If a new ResultPdf is provided, replace the existing one
                if (resultPdf != null)
                {
                    using var memoryStream = new MemoryStream();
                    await resultPdf.CopyToAsync(memoryStream);
                    existingExamination.ResultPdf = memoryStream.ToArray();
                }

                // Save changes to the database
                _context.Examinations.Update(existingExamination);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Examination updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while updating the examination with ID {id}.");
                return StatusCode(500, new { message = "An error occurred while updating the examination.", error = ex.Message });
            }
        }

        // Deletes an examination
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeleteExamination(int id)
        {
            try
            {
                // Find the examination to delete
                var examination = await _context.Examinations.FindAsync(id);
                if (examination == null)
                    return NotFound($"Examination with ID {id} not found.");

                // Delete the examination
                _context.Examinations.Remove(examination);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Examination deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while deleting the examination with ID {id}.");
                return StatusCode(500, new { message = "An error occurred while deleting the examination.", error = ex.Message });
            }
        }

        #region Helper Methods

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

        [HttpGet("{id}/download-pdf")]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<IActionResult> DownloadPdf(int id)
        {
            // Find the examination with the specified ID
            var examination = await _context.Examinations
                .Where(e => e.Id == id)
                .Select(e => new { e.ResultPdf })
                .FirstOrDefaultAsync();

            // Check if the examination exists and contains a PDF
            if (examination == null || examination.ResultPdf == null || examination.ResultPdf.Length == 0)
            {
                return NotFound(new { message = "No PDF found for this examination." });
            }

            // Return the file content as a download
            return File(examination.ResultPdf, "application/pdf", $"Examination_{id}.pdf");
        }

        private static string? ValidateFile(IFormFile file)
        {
            // Validates file size and type
            if (file.Length > MaxFileSizeInMB * 1024 * 1024)
                return $"File size exceeds the {MaxFileSizeInMB}MB limit.";

            if (file.ContentType != AllowedFileType)
                return "Only PDF files are allowed.";

            return null;
        }

        #endregion
    }
}