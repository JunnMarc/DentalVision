using System.Text;
using System.IO;
using DentalVision.API.Middleware;
using DentalVision.Application.Common;
using DentalVision.Application.Interfaces;
using DentalVision.Application.Interfaces.Security;
using DentalVision.Application.Services;
using DentalVision.Domain.Interfaces;
using DentalVision.Infrastructure.Persistence;
using DentalVision.Infrastructure.Repositories;
using DentalVision.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Database (Microsoft SQL Server strictly)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=(localdb)\\mssqllocaldb;Database=dentalvision_prototype;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;";

builder.Services.AddDbContext<DentalVisionDbContext>(options =>
    options.UseSqlServer(connectionString));

// 2. Register HttpContextAccessor and AutoMapper
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<DentalVision.Application.Interfaces.ITenantProvider, DentalVision.Infrastructure.Services.TenantProvider>();
builder.Services.AddAutoMapper(typeof(MappingProfile));

// 3. Register Core Services & Repositories
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IJwtProvider, JwtProvider>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPatientService, PatientService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IImageProcessingService, ImageProcessingService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// 4. Configure Authentication & JWT Bearer token validation
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "SUPER_SECRET_KEY_FOR_DENTALVISION_JWT_TOKEN_SIGNING_ALGORITHM_123456";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "DentalVisionAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "DentalVisionClient";

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
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 5. Configure CORS (Permit Vite local development host)
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// 6. Global Exception Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<MultiTenantMiddleware>();

// Create default folders for uploads
var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
var uploadsDir = Path.Combine(webRoot, "uploads");
if (!Directory.Exists(uploadsDir))
{
    Directory.CreateDirectory(uploadsDir);
}

// 7. Configure Static File serving (for dental image retrieval)
app.UseStaticFiles(); // Serve files from wwwroot/
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads"
});

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 8. Auto-migrate or auto-create and seed database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<DentalVisionDbContext>();
        DbInitializer.Initialize(context);
        Console.WriteLine("Database successfully initialized and seeded.");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database seeding.");
    }
}

app.Run();
