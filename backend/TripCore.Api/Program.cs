using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TripCore.Application.Services;
using TripCore.Infrastructure.Data;
using TripCore.Infrastructure.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ── Database ─────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING")
    ?? "Host=localhost;Port=5432;Database=tripcore;Username=postgres;Password=postgres";

builder.Services.AddDbContext<TripCoreDbContext>(options =>
    options.UseNpgsql(connectionString));

// ── JWT Authentication ───────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET");

if (string.IsNullOrEmpty(jwtSecret) || jwtSecret == "TripCore-Dev-Only-Secret-Min32Characters!!")
    throw new InvalidOperationException(
        "Jwt:Secret must be set to a strong secret in configuration or JWT_SECRET environment variable.");

if (jwtSecret.Length < 32)
    throw new InvalidOperationException("JWT secret must be at least 32 characters long.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = "TripCore",
        ValidateAudience = true,
        ValidAudience = "TripCore",
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});

builder.Services.AddAuthorization();

// ── NDIS Claiming Services ────────────────────────────────────
builder.Services.AddScoped<TripCore.Infrastructure.Services.ClaimGenerationService>();
builder.Services.AddScoped<TripCore.Infrastructure.Services.BprCsvService>();
builder.Services.AddScoped<TripCore.Infrastructure.Services.InvoiceService>();
builder.Services.AddScoped<TripCore.Infrastructure.Services.CatalogueImportService>();

// ── Rate Limiting ────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Strict rate limit for login endpoint to prevent brute force
    options.AddPolicy("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0
            }));

    // General API rate limit
    options.AddPolicy("api", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

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
              .WithHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With")
              .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
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

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentTenant, CurrentTenant>();

var app = builder.Build();

// ── Migrate + Seed ───────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TripCoreDbContext>();

    // Ensure the migrations history table exists before we try to use it.
    await db.Database.ExecuteSqlRawAsync(
        """
        CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
            "MigrationId" character varying(150) NOT NULL,
            "ProductVersion" character varying(32) NOT NULL,
            CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
        );
        """);

    // If the DB tables already exist (e.g. from a prior deployment that didn't track
    // migration history), mark all known migrations as applied so MigrateAsync doesn't
    // try to re-run them and crash with "relation already exists".
    await db.Database.ExecuteSqlRawAsync(
        """
        INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
        SELECT m."MigrationId", '8.0.11'
        FROM (VALUES
            ('20260320104626_AddIncidentReports'),
            ('20260320133223_AddScheduledActivityTrackingFields'),
            ('20260321093551_AddInsuranceTracking'),
            ('20260327084507_AddPaymentStatusToBooking'),
            ('20260327121732_AddNdisClaiming')
        ) AS m("MigrationId")
        WHERE EXISTS (
            SELECT 1 FROM pg_catalog.pg_class c
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = 'AccommodationProperties'
        )
        ON CONFLICT DO NOTHING;
        """);

    // Apply pending EF Core migrations automatically on startup
    await db.Database.MigrateAsync();
    // Add new columns that migrations won't add to existing tables
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
    await db.Database.ExecuteSqlRawAsync(
        """
        ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "FirstAidExpiryDate" date;
        ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "DriverLicenceExpiryDate" date;
        ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "ManualHandlingExpiryDate" date;
        ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "MedicationCompetencyExpiryDate" date;
        """);
    await DbSeeder.SeedAsync(db);
    await DbSeeder.SeedNdisDataAsync(db);
}

// ── Middleware pipeline ──────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "TripCore API v1"));
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Security headers middleware
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "0";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'";
    context.Response.Headers["Cache-Control"] = "no-store";
    context.Response.Headers["Pragma"] = "no-cache";
    await next();
});

app.UseMiddleware<TripCore.Api.Middleware.ExceptionHandlingMiddleware>();
app.UseRateLimiter();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
