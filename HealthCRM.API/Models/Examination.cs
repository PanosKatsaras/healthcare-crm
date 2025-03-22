using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using HealthCRM.API.Utilities;

namespace HealthCRM.API.Models
{
    public class Examination
    {
        // Parameterless constructor for EF Core
        public Examination() 
        { 
            CreatedAt = DateTime.UtcNow; 
        }

       
        public Examination(ExamType type, decimal price)
        {
            if (price < 0)
            {
                throw new ArgumentException("Price cannot be negative.", nameof(price));
            }
            Price = price;

            Type = Enum.IsDefined(typeof(ExamType), type) 
                    ? type 
                    : throw new ArgumentOutOfRangeException(nameof(Type), "Invalid exam type.");

            Status = ExamStatus.Pending;
            Description = string.Empty;
            CreatedAt = DateTime.UtcNow;
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public Guid? PatientId { get; set; }
        
        [ForeignKey("PatientId")]
        public Patient? Patient { get; set; }

        public Guid? DoctorId { get; set; }
        
        [ForeignKey("DoctorId")]
        public Doctor? Doctor { get; set; }

        [Required(ErrorMessage = "Exam type is required")]
        public ExamType Type { get; set; }

        public ExamStatus Status { get; set; } = ExamStatus.Pending;

        [Required(ErrorMessage = "Price is required")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public string Description { get; set; } = string.Empty;

        public byte[]? ResultPdf { get; set; }

        public DateTime CreatedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
    }
}