using System.Text;
using System.Threading.RateLimiting;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TripCore.Domain.Interfaces;
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
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrEmpty(jwtSecret))
    jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");

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
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (string.IsNullOrEmpty(context.Token) && context.Request.Cookies.TryGetValue("tripcore_jwt", out var cookieToken))
            {
                context.Token = cookieToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ── Firebase Admin SDK ───────────────────────────────────────
// Priority: 1) full JSON from config/env  2) file path  3) individual env vars
var firebaseServiceAccount = builder.Configuration["Firebase:ServiceAccountJson"];
if (string.IsNullOrEmpty(firebaseServiceAccount))
    firebaseServiceAccount = Environment.GetEnvironmentVariable("FIREBASE_SERVICE_ACCOUNT_JSON");

// If value points to a .json file on disk, read its contents
if (!string.IsNullOrEmpty(firebaseServiceAccount)
    && firebaseServiceAccount.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
    && File.Exists(firebaseServiceAccount))
{
    firebaseServiceAccount = File.ReadAllText(firebaseServiceAccount);
}

// Fallback: build the JSON from individual env vars (avoids Compose interpolation issues)
if (string.IsNullOrEmpty(firebaseServiceAccount))
{
    var projectId = Environment.GetEnvironmentVariable("FIREBASE_PROJECT_ID");
    var privateKey = Environment.GetEnvironmentVariable("FIREBASE_PRIVATE_KEY");
    var clientEmail = Environment.GetEnvironmentVariable("FIREBASE_CLIENT_EMAIL");

    if (!string.IsNullOrEmpty(projectId) && !string.IsNullOrEmpty(privateKey) && !string.IsNullOrEmpty(clientEmail))
    {
        var privateKeyId = Environment.GetEnvironmentVariable("FIREBASE_PRIVATE_KEY_ID") ?? "";
        var clientId = Environment.GetEnvironmentVariable("FIREBASE_CLIENT_ID") ?? "";
        var tokenUri = Environment.GetEnvironmentVariable("FIREBASE_TOKEN_URI") ?? "https://oauth2.googleapis.com/token";

        firebaseServiceAccount = System.Text.Json.JsonSerializer.Serialize(new
        {
            type = "service_account",
            project_id = projectId,
            private_key_id = privateKeyId,
            private_key = privateKey.Replace("\\n", "\n"),
            client_email = clientEmail,
            client_id = clientId,
            auth_uri = "https://accounts.google.com/o/oauth2/auth",
            token_uri = tokenUri,
            auth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url = $"https://www.googleapis.com/robot/v1/metadata/x509/{Uri.EscapeDataString(clientEmail)}"
        });
    }
}

if (string.IsNullOrEmpty(firebaseServiceAccount))
    throw new InvalidOperationException(
        "Firebase credentials not configured. Provide one of: " +
        "Firebase:ServiceAccountJson (config/env with full JSON), " +
        "FIREBASE_SERVICE_ACCOUNT_JSON (file path), " +
        "or FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL (individual env vars).");

FirebaseApp.Create(new AppOptions
{
    Credential = GoogleCredential.FromJson(firebaseServiceAccount)
});

// ── NDIS Claiming Services ────────────────────────────────────
builder.Services.AddScoped<TripCore.Infrastructure.Services.ClaimGenerationService>();
builder.Services.AddScoped<TripCore.Infrastructure.Services.BprCsvService>();
builder.Services.AddScoped<TripCore.Infrastructure.Services.InvoiceService>();
builder.Services.AddScoped<TripCore.Infrastructure.Services.CatalogueImportService>();

// ── Public Holiday Sync ───────────────────────────────────────
builder.Services.AddHttpClient<TripCore.Infrastructure.Services.NagerHolidayProvider>();
builder.Services.AddScoped<TripCore.Infrastructure.Services.IHolidayProvider, TripCore.Infrastructure.Services.NagerHolidayProvider>();
builder.Services.AddScoped<TripCore.Application.Interfaces.IPublicHolidaySyncService, TripCore.Infrastructure.Services.PublicHolidaySyncService>();
builder.Services.AddHostedService<TripCore.Infrastructure.BackgroundServices.HolidaySyncBackgroundService>();

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
              .WithHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With", "X-View-As-Tenant", "X-View-As-User")
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

    // Bootstrap: create the EF migrations history table if it doesn't exist yet.
    // This is needed for fresh deployments where the database was created outside
    // of EF Core (e.g. by a prior deployment or a DBA script).  Without this
    // table the pre-population INSERT below would fail, and MigrateAsync itself
    // would not be able to record which migrations it has already applied.
    await db.Database.ExecuteSqlRawAsync(
        """
        CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
            "MigrationId" character varying(150) NOT NULL,
            "ProductVersion" character varying(32) NOT NULL,
            CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
        );
        """);

    // Pre-populate migration history for databases that were created before EF
    // migration tracking was introduced.  Without this, MigrateAsync would
    // attempt to re-run these migrations and fail with "relation already exists".
    // The guard checks for an existing application table so this only fires on
    // legacy databases, not brand-new ones.
    await db.Database.ExecuteSqlRawAsync(
        """
        INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
        SELECT m."MigrationId", '8.0.11'
        FROM (VALUES
            ('20260320104626_AddIncidentReports'),
            ('20260320133223_AddScheduledActivityTrackingFields'),
            ('20260321093551_AddInsuranceTracking'),
            ('20260327084507_AddPaymentStatusToBooking')
        ) AS m("MigrationId")
        WHERE EXISTS (
            SELECT 1 FROM pg_catalog.pg_class c
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = 'AccommodationProperties'
        )
        ON CONFLICT DO NOTHING;
        """);

    // Repair: if AddNdisClaiming was falsely marked as applied by the
    // pre-population block but the tables don't actually exist, remove the
    // false history entry so MigrateAsync re-runs the migration properly.
    await db.Database.ExecuteSqlRawAsync(
        """
        DELETE FROM "__EFMigrationsHistory"
        WHERE "MigrationId" = '20260327121732_AddNdisClaiming'
        AND NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_class c
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = 'SupportActivityGroups'
        );
        """);

    // Apply pending EF Core migrations (includes ConsolidateSchemaFixes which
    // adds all previously-hacked-in columns via idempotent ALTER statements).
    await db.Database.MigrateAsync();

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
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; script-src 'self' 'wasm-unsafe-eval'; frame-ancestors 'none'";
    context.Response.Headers["Cache-Control"] = "no-store";
    context.Response.Headers["Pragma"] = "no-cache";
    await next();
});

app.UseMiddleware<TripCore.Api.Middleware.ExceptionHandlingMiddleware>();
app.UseRateLimiter();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TripCore.Api.Middleware.ReadOnlyMiddleware>();
app.MapControllers();

app.Run();
