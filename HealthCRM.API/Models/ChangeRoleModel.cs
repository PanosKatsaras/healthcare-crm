using System.ComponentModel.DataAnnotations;

namespace HealthCRM.API.Models
{
    public class ChangeRoleModel
    {
        [Required(ErrorMessage = "User ID is required.")]
        public required string UserId { get; set; }

        [Required(ErrorMessage = "New role is required.")]
        public required string NewRole { get; set; }
    }
}