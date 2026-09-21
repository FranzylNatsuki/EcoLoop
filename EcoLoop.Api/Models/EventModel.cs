using Postgrest.Attributes;
using Postgrest.Models;

namespace EcoLoop.Api.Models
{
    [Table("events")]
    public class EventModel : BaseModel
    {
        [PrimaryKey("id", false)]
        public Guid Id { get; set; }

        [Column("author_id")]
        public Guid AuthorId { get; set; }

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string Description { get; set; } = string.Empty;

        [Column("category")]
        public string Category { get; set; } = string.Empty;

        [Column("location")]
        public string Location { get; set; } = string.Empty;

        [Column("event_date")]
        public DateTime EventDate { get; set; }

        [Column("banner_url")]
        public string? BannerUrl { get; set; }

        // Stores json payload for MaterialsNeededCard.vue
        [Column("materials_needed")]
        public string MaterialsNeeded { get; set; } = "[]";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}
