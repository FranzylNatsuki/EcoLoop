using System.Net.Http.Json;
using System.Text.Json;

namespace EcoLoop.Api.Services;

public class SupabaseAuthService
{
    private readonly HttpClient _http;

    public SupabaseAuthService(IHttpClientFactory factory)
    {
        _http = factory.CreateClient("Supabase"); // reuses base URL + apikey + auth header
    }

    public async Task<Guid> CreateAuthUserAsync(string email, string password)
    {
        var res = await _http.PostAsJsonAsync("/auth/v1/admin/users", new
        {
            email,
            password,
            email_confirm = true
        });

        var body = await res.Content.ReadAsStringAsync();

        if (!res.IsSuccessStatusCode)
            throw new Exception($"Supabase admin create user failed: {body}");

        var json = JsonDocument.Parse(body);
        return Guid.Parse(json.RootElement.GetProperty("id").GetString()!);
    }

    public async Task<(string AccessToken, string RefreshToken)> SignInAsync(string email, string password)
    {
        var res = await _http.PostAsJsonAsync("/auth/v1/token?grant_type=password", new { email, password });
        var body = await res.Content.ReadAsStringAsync();

        if (!res.IsSuccessStatusCode)
            throw new Exception($"Supabase sign-in failed: {body}");

        var json = JsonDocument.Parse(body);
        return (
            json.RootElement.GetProperty("access_token").GetString()!,
            json.RootElement.GetProperty("refresh_token").GetString()!
        );
    }

    // SupabaseAuthService.cs — add these methods
    public async Task CreateProfileAsync(Guid id, string fullName, string? location, string? contactNumber, string email, bool isOrg)
    {
        var payload = new
        {
            id,
            full_name = fullName,
            location,
            contact_number = contactNumber,
            email,
            is_org = isOrg,
        };

        var res = await _http.PostAsJsonAsync("/rest/v1/profiles", payload);
        var body = await res.Content.ReadAsStringAsync();

        if (!res.IsSuccessStatusCode)
            throw new Exception($"Profile insert failed: {body}");
    }

    public async Task<Guid> CreateOrganizationAsync()
    {
        var res = await _http.PostAsJsonAsync("/rest/v1/organizations", new { });
        var body = await res.Content.ReadAsStringAsync();

        if (!res.IsSuccessStatusCode)
            throw new Exception($"Organization insert failed: {body}");

        // PostgREST needs "Prefer: return=representation" to get the inserted row back
        var json = JsonDocument.Parse(body);
        return Guid.Parse(json.RootElement[0].GetProperty("id").GetString()!);
    }
}
