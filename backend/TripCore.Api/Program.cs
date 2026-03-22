using Microsoft.EntityFrameworkCore;
using TripCore.Infrastructure.Data;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ── Database ─────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING")
    ?? "Host=localhost;Port=5432;Database=tripcore;Username=postgres;Password=postgres";

builder.Services.AddDbContext<TripCoreDbContext>(options =>
    options.UseNpgsql(connectionString));

// ── Swagger ──────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "TripCore API", Version = "v1", Description = "NDIS Trip Management Platform API" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Bearer token. Enter: Bearer {token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ── CORS ─────────────────────────────────────────────────────
var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(',') ?? new[] { "http://localhost:5173", "http://localhost:3000" };
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── Controllers ──────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

var app = builder.Build();

// ── Migrate + Seed ───────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TripCoreDbContext>();
    await db.Database.EnsureCreatedAsync();
    // Add new columns that EnsureCreated won't add to existing tables
    await db.Database.ExecuteSqlRawAsync(
        """ALTER TABLE "TripInstances" ADD COLUMN IF NOT EXISTS "CalculatedStaffRequired" numeric NOT NULL DEFAULT 0""");
    // ScheduledActivity tracking fields
    await db.Database.ExecuteSqlRawAsync(
        """
        ALTER TABLE "ScheduledActivities" ADD COLUMN IF NOT EXISTS "Status" integer NOT NULL DEFAULT 0;
        ALTER TABLE "ScheduledActivities" ADD COLUMN IF NOT EXISTS "BookingReference" character varying(200);
        ALTER TABLE "ScheduledActivities" ADD COLUMN IF NOT EXISTS "ProviderName" character varying(200);
        ALTER TABLE "ScheduledActivities" ADD COLUMN IF NOT EXISTS "ProviderPhone" character varying(50);
        ALTER TABLE "ScheduledActivities" ADD COLUMN IF NOT EXISTS "ProviderEmail" character varying(200);
        ALTER TABLE "ScheduledActivities" ADD COLUMN IF NOT EXISTS "ProviderWebsite" character varying(500);
        ALTER TABLE "ScheduledActivities" ADD COLUMN IF NOT EXISTS "EstimatedCost" numeric(18,2);
        CREATE INDEX IF NOT EXISTS "IX_ScheduledActivities_Status" ON "ScheduledActivities" ("Status");
        """);
    // Insurance tracking fields on ParticipantBookings
    await db.Database.ExecuteSqlRawAsync(
        """
        ALTER TABLE "ParticipantBookings" ADD COLUMN IF NOT EXISTS "InsuranceProvider" text;
        ALTER TABLE "ParticipantBookings" ADD COLUMN IF NOT EXISTS "InsurancePolicyNumber" text;
        ALTER TABLE "ParticipantBookings" ADD COLUMN IF NOT EXISTS "InsuranceCoverageStart" date;
        ALTER TABLE "ParticipantBookings" ADD COLUMN IF NOT EXISTS "InsuranceCoverageEnd" date;
        ALTER TABLE "ParticipantBookings" ADD COLUMN IF NOT EXISTS "InsuranceStatus" integer NOT NULL DEFAULT 0;
        CREATE INDEX IF NOT EXISTS "IX_ParticipantBookings_InsuranceStatus" ON "ParticipantBookings" ("InsuranceStatus");
        """);
    await DbSeeder.SeedAsync(db);
}

// ── Middleware pipeline ──────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TripCore API v1"));
}

app.UseMiddleware<TripCore.Api.Middleware.ExceptionHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
