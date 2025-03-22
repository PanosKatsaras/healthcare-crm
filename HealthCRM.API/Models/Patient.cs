using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthCRM.API.Models
{
    public class Patient
    {

        public Patient()
        {
            // Parameterless constructor required by EF Core
            ΑΜΚΑ = string.Empty;
            FullName = string.Empty;
            PhoneNumber = string.Empty;
            City = string.Empty;
            Address = string.Empty;
            CreatedAt = DateTime.UtcNow;
        }

        public Patient(Guid doctorId, string amka, string fullName, string phoneNumber, string city, string address)
        {
            ΑΜΚΑ = amka ?? throw new ArgumentNullException(nameof(amka), "Ιdentification number (ΑΜΚΑ) is required.");
            FullName = fullName ?? throw new ArgumentNullException(nameof(fullName), "Full name is required.");
            PhoneNumber = phoneNumber ?? throw new ArgumentNullException(nameof(phoneNumber), "Phone number is required.");
            City = city ?? throw new ArgumentNullException(nameof(city), "City is required.");
            Address = address ?? throw new ArgumentNullException(nameof(address), "Address is required.");
            DoctorId = doctorId;
            CreatedAt = DateTime.UtcNow;
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required(ErrorMessage = "Doctor's ID is required.")]
        public Guid DoctorId { get; set; }

        [ForeignKey("DoctorId")]
        public Doctor? Doctor { get; set; }

        public Guid? MedicalRecordId { get; set; }

        public MedicalRecord? MedicalRecord { get; set; }
        // [JsonPropertyName("amka")]
        [Required(ErrorMessage = "Ιdentification number (ΑΜΚΑ) is required.")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "Identification number (ΑΜΚΑ) must be exactly 11 digits.")]
        public string ΑΜΚΑ { get; set; }

        [Required(ErrorMessage = "Full name is required.")]
        [MaxLength(50, ErrorMessage = "Full name cannot exceed 50 characters.")]
        public string FullName { get; set; }

        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(@"^\+?[0-9]{10,14}$", ErrorMessage = "Invalid phone number format.")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Address is required.")]
        [MaxLength(100, ErrorMessage = "Address cannot exceed 100 characters.")]
        public string Address { get; set; }

        [Required(ErrorMessage = "City is required.")]
        [MaxLength(50, ErrorMessage = "City cannot exceed 50 characters.")]
        public string City { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}