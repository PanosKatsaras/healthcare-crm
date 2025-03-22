using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HealthCRM.API.Utilities;

namespace HealthCRM.API.Models
{
    public class Appointment
    {

        protected Appointment()
        {
            // Parameterless constructor required by EF Core
            FullName = string.Empty;
            PhoneNumber = string.Empty;
            AppointmentDate = DateTime.MinValue;
            ExamType = ExamType.BloodTest;
            Status = ExamStatus.Pending;
            CreatedAt = DateTime.UtcNow;
        }

        public Appointment(string fullName, string phoneNumber, DateTime appointmentDate, ExamType examType)
        {
            FullName = fullName ?? throw new ArgumentNullException(nameof(fullName), "Full name is required.");
            PhoneNumber = phoneNumber ?? throw new ArgumentNullException(nameof(phoneNumber), "Phone number is required.");
            AppointmentDate = appointmentDate == DateTime.MinValue ? throw new ArgumentNullException(nameof(appointmentDate), "Appointment date is required.") : appointmentDate;
            ExamType = examType;
            Status = ExamStatus.Pending;
            CreatedAt = DateTime.UtcNow;

        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(50)]
        public string FullName { get; set; }

        [Required(ErrorMessage = "Phone number is required")]
        [RegularExpression(@"^\+?[0-9]{10,14}$", ErrorMessage = "Invalid phone number format.")] // +1234567890
        public string PhoneNumber { get; set; }

        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Appointment date is required")]
        public DateTime AppointmentDate { get; set; }

        [Required(ErrorMessage = "Exam type is required")]
        public ExamType ExamType { get; set; }

        public ExamStatus Status { get; set; } = ExamStatus.Pending; // Pending, Scheduled, Completed

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Optional relationships to be filled later by staff
        public Guid? PatientId { get; set; }

        [ForeignKey("PatientId")]
        public Patient? Patient { get; set; }

        public Guid? DoctorId { get; set; }

        [ForeignKey("DoctorId")]
        public Doctor? Doctor { get; set; }

        [ForeignKey("ExaminationId")]
        public int? ExaminationId { get; set; }

        public Examination? Examination { get; set; }

        public Guid? MedicalRecordId { get; set; }

        [ForeignKey("MedicalRecordId")]
        public MedicalRecord? MedicalRecord { get; set; }

        public string? PrescriptionCode { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? TotalPrice { get; set; }
    }
}