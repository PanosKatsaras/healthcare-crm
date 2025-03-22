using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthCRM.API.Models
{
    public class MedicalRecord
    {
        protected MedicalRecord()
        {
            // Parameterless constructor required by EF Core
            AMKA = string.Empty;
            Disease = string.Empty;
            MedicalHistory = string.Empty;
            Medications = string.Empty;
            CreatedAt = DateTime.UtcNow;
        }

        public MedicalRecord(Guid patientId, Guid doctorId, string amka, string disease, string medications)
        {
            PatientId = patientId;
            DoctorId = doctorId;
            AMKA = amka ?? throw new ArgumentNullException(nameof(amka), "Identification number (AMKA) is required.");
            Disease = disease ?? throw new ArgumentNullException(nameof(disease), "Disease is required.");
            Medications = medications ?? throw new ArgumentNullException(nameof(medications), "Medications are required.");
            CreatedAt = DateTime.UtcNow;
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required(ErrorMessage = "Patient's Id is required.")]
        public Guid PatientId { get; set; }

        [ForeignKey("PatientId")]
        public Patient? Patient { get; set; }

        [Required(ErrorMessage = "Doctor's Id is required.")]
        public Guid DoctorId { get; set; }

        [ForeignKey("DoctorId")]
        public Doctor? Doctor { get; set; }

        [Required(ErrorMessage = "Identification number (AMKA) is required.")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "Identification number (AMKA) must be exactly 11 digits.")]
        public string AMKA { get; set; }

        [Required(ErrorMessage = "Disease is required.")]
        [MaxLength(100)]
        public string Disease { get; set; }

        [MaxLength(500)]
        public string? MedicalHistory { get; set; }

        [Required(ErrorMessage = "Medications are required.")]
        [MaxLength(200)]
        public string Medications { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}