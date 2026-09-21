using Microsoft.AspNetCore.Mvc;
using EcoLoop.Api.Models;

namespace EcoLoop.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly Supabase.Client _supabaseClient;

        public EventsController(Supabase.Client supabaseClient)
        {
            _supabaseClient = supabaseClient;
        }

        // GET: api/events (Feed list)
        [HttpGet]
        public async Task<IActionResult> GetEvents()
        {
            var response = await _supabaseClient
                .From<EventModel>()
                .Order("created_at", Postgrest.Constants.Ordering.Descending)
                .Get();

            return Ok(response.Models);
        }

        // GET: api/events/{id} (Expanded Event View)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEventById(Guid id)
        {
            var response = await _supabaseClient
                .From<EventModel>()
                .Where(e => e.Id == id)
                .Single();

            if (response == null) return NotFound();
            return Ok(response);
        }

        // POST: api/events (Create Event)
        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] EventModel newEvent)
        {
            var response = await _supabaseClient
                .From<EventModel>()
                .Insert(newEvent);

            return Ok(response.Models.FirstOrDefault());
        }
    }
}
