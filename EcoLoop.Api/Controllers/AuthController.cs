using Microsoft.AspNetCore.Mvc;
using EcoLoop.Api.Services;

namespace EcoLoop.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly SupabaseAuthService _authService;

    public AuthController(SupabaseAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        Guid userId;
        try
        {
            userId = await _authService.CreateAuthUserAsync(req.Email, req.Password);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        try
        {
            Guid? orgId = null;

            if (req.IsOrg)
            {
                orgId = await _authService.CreateOrganizationAsync();
            }

            await _authService.CreateProfileAsync(
                userId, req.FullName, req.Location, req.ContactNumber, req.Email, req.IsOrg, orgId);
        }
        catch (Exception ex)
        {
            return Problem($"Profile creation failed: {ex.Message}");
        }

        var (accessToken, refreshToken) = await _authService.SignInAsync(req.Email, req.Password);

        return Ok(new
        {
            accessToken,
            refreshToken,
            userId,
            isOrg = req.IsOrg
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        try
        {
            var (accessToken, refreshToken) = await _authService.SignInAsync(req.Email, req.Password);

            // Return tokens
            return Ok(new { accessToken, refreshToken });
        }
        catch (Exception ex)
        {
            // Bad credentials or Supabase error response
            return Unauthorized(new { error = "Invalid email or password." });
        }
    }
}

public class RegisterRequest
{
    public string FullName { get; set; } = default!;
    public string? Location { get; set; }
    public string? ContactNumber { get; set; }
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
    public bool IsOrg { get; set; }
}
