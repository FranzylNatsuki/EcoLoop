using Microsoft.AspNetCore.Mvc;
using EcoLoop.Api.Services;

namespace EcoLoop.Api.Controllers;

[ApiController]
[Route("api/profiles")]
public class ProfilesController : ControllerBase
{
    private readonly HttpClient _http;

    public ProfilesController(IHttpClientFactory factory)
    {
        _http = factory.CreateClient("Supabase");
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProfile(Guid id)
    {
        var res = await _http.GetAsync($"/rest/v1/profiles?id=eq.{id}&select=*");
        var body = await res.Content.ReadAsStringAsync();

        if (!res.IsSuccessStatusCode)
            return BadRequest(new { error = body });

        return Content(body, "application/json");
    }
}
