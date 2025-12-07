// this is not working.
// we should have had a webhook but it is broken

using Microsoft.AspNetCore.SignalR;
using server.Models;
using server.Controllers;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

namespace server.Hubs
{
    public class EmergencyHub : Hub
    {
        public static string __connectionString { get; private set; }
        public static void set_connection(string connectionString)
        {
            __connectionString = connectionString;
        }
        public async Task JoinEmergencyGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "emergency-updates");
        }

        public async Task LeaveEmergencyGroup()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "emergency-updates");
        }

        public async Task FindEmergency(string Location)
        {
            using var connection = new SqlConnection(Emergency.__connectionString);
            connection.Open();

            string sql = "SELECT * FROM Emergency";

            using var command = new SqlCommand(sql, connection);
            using var reader = command.ExecuteReader();

            var emergencies = new List<EmergencyObject>();
            while (reader.Read())
            {
                var emergency = new EmergencyObject
                {
                    Id = reader.GetInt32(reader.GetOrdinal("ID")),
                    Location_X = (float)reader.GetDouble(reader.GetOrdinal("Location_X")),
                    Location_Y = (float)reader.GetDouble(reader.GetOrdinal("Location_Y")),
                    Level = reader.GetInt32(reader.GetOrdinal("Lvl_Emergency")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? string.Empty : reader.GetString(reader.GetOrdinal("Description"))
                };
                emergencies.Add(emergency);
            }

            var sortedEmergencies = emergencies.OrderBy(e => e.Level).ToList();

            //using (var writer = new StreamWriter("log.txt", true))
            //{
            //    writer.WriteLine($"Login attempt: {sortedEmergencies.Count}");
            //}

            // Send to calling client
            await Clients.Caller.SendAsync("ReceiveEmergencyUpdate", new EmergencyResponse
            {
                Error = null,
                Ems = sortedEmergencies,
                Count = sortedEmergencies.Count
            });
        }
    }
}
