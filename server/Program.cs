using server;
using server.Hubs;
using System.Data.SqlTypes;
using System.Net;
using System.Net.Sockets;

var builder = WebApplication.CreateBuilder(args);
/*
var ip = Dns.GetHostAddresses(Dns.GetHostName())
    .FirstOrDefault(a => a.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(a));
*/
var ip = IPAddress.Parse("192.168.232.182");
/*
if (ip != null)
{
    Console.WriteLine($"Listening on {ip}:5024");
    builder.WebHost.ConfigureKestrel(serverOptions =>
    {
        serverOptions.Listen(ip, 5024);
    });
}
else
{
    // Fallback: listen on all interfaces
    Console.WriteLine("No suitable IPv4 address found, listening on all interfaces.");
    builder.WebHost.ConfigureKestrel(serverOptions =>
    {
        serverOptions.ListenAnyIP(5024);
    });
}
*/

string sql_connect = null;
sql_connect = string.Format("Server={0}\\SQLEXPRESS;Database=MOROMETII;Trusted_Connection=True;", ip);
server.Controllers.UserValidator.set_connection(sql_connect);
server.Controllers.Emergency.set_connection(sql_connect);
server.Controllers.EmergencyApplyController.set_connection(sql_connect);
server.Hubs.EmergencyHub.set_connection(sql_connect);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Add SignalR services
builder.Services.AddSignalR();

// Configure CORS for React Native app
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactNativeApp",
        builder =>
        {
            builder.AllowAnyHeader()
                   .AllowAnyMethod()
                   .SetIsOriginAllowed((host) => true) // For development
                   .AllowCredentials();
        });
});


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(options => {
    //options.AllowAnyMethod().AllowAnyHeader().WithOrigins("http://localhost:3000");
    //options.AllowAnyMethod().AllowAnyHeader().WithOrigins("http://localhost:8081");
    options.AllowAnyMethod()
           .AllowAnyHeader()
           .WithOrigins("http://localhost:3000", "http://localhost:8081", "http://localhost:8081/Game",
                        "http://192.168.3.113");
});

app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
app.MapHub<EmergencyHub>("/emergencyhub");

app.Run();