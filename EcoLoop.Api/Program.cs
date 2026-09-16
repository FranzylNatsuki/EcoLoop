var builder = WebApplication.CreateBuilder(args);


// Add services to the container.

builder.Services.AddHttpClient("Supabase", client =>
{
    var config = builder.Configuration;
    client.BaseAddress = new Uri(config["Supabase:Url"]!);
    client.DefaultRequestHeaders.Add("apikey", config["Supabase:SecretKey"]);
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {config["Supabase:SecretKey"]}");
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
