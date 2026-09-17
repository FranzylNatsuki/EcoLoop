using EcoLoop.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddHttpClient("Supabase", client =>
{
    var config = builder.Configuration;
    client.BaseAddress = new Uri(config["Supabase:Url"]!);
    client.DefaultRequestHeaders.Add("apikey", config["Supabase:SecretKey"]);
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config["Supabase:SecretKey"]}");
    client.DefaultRequestHeaders.Add("Prefer", "return=representation"); // <-- add this line
});

builder.Services.AddScoped<SupabaseAuthService>();
builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVueDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowVueDev");
app.UseAuthorization();
app.MapControllers();

app.MapGet("/test-db", async (IHttpClientFactory factory) =>
{
    var client = factory.CreateClient("Supabase");
    var res = await client.GetAsync("/rest/v1/your_table_name?select=*");
    var body = await res.Content.ReadAsStringAsync();
    return Results.Content(body, "application/json");
});


app.Run();
