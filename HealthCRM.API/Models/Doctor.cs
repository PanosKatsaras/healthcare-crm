using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace HealthCRM.API.Models
{
    public class Doctor
    {
        protected Doctor()
        {
            // Parameterless constructor required by EF Core
            AMKA = string.Empty;
            FullName = string.Empty;
            Email = string.Empty;
            PhoneNumber = string.Empty;
            Address = string.Empty;
            City = string.Empty;
            Specialization = string.Empty;
            CreatedAt = DateTime.UtcNow;
       
        }

        public Doctor(string amka, string fullName, string email, string phoneNumber, string address, string city, string specialization)
        {
            AMKA = amka ?? throw new ArgumentNullException(nameof(amka), "Identification number (AMKA) is required.");
            FullName = fullName ?? throw new ArgumentNullException(nameof(fullName), "Full name is required.");
            Email = email ?? throw new ArgumentNullException(nameof(email), "Email is required.");
            PhoneNumber = phoneNumber ?? throw new ArgumentNullException(nameof(phoneNumber), "Phone number is required.");
            Address = address ?? throw new ArgumentNullException(nameof(address), "Address is required.");
            City = city ?? throw new ArgumentNullException(nameof(city), "City is required.");
            Specialization = specialization ?? throw new ArgumentNullException(nameof(city), "City is required.");
            CreatedAt = DateTime.UtcNow;
  
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required(ErrorMessage = "Identification number (AMKA) is required.")]
        [RegularExpression(@"^\d{11}$", ErrorMessage = "Identification number (AMKA) must be exactly 11 digits.")]
        public string AMKA { get; set; }

        [Required(ErrorMessage = "Full name is required.")]
        [MaxLength(50, ErrorMessage = "Full name cannot exceed 50 characters.")]
        public string FullName { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [RegularExpression(@"^\+?[0-9]{10,14}$", ErrorMessage = "Invalid phone number format.")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Address is required.")]
        [MaxLength(100, ErrorMessage = "Address cannot exceed 100 characters.")]
        public string Address { get; set; }

        [Required(ErrorMessage = "City is required.")]
        [MaxLength(50, ErrorMessage = "City cannot exceed 50 characters.")]
        public string City { get; set; }

        [Required(ErrorMessage = "Specialization is required.")]
        [MaxLength(50, ErrorMessage = "Specialization cannot exceed 50 characters.")]
        public string Specialization { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Mark navigation properties as virtual for lazy loading
        [JsonIgnore] // Prevents serialization issues
        public virtual ICollection<Patient> Patients { get; set; } = []; // Initialize here

        [JsonIgnore] // Prevents serialization issues
        public virtual ICollection<MedicalRecord> MedicalRecords { get; set; } = []; // Initialize here

    }
}