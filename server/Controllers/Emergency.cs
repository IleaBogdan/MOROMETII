using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using server.Models;
using System;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using System.Collections.Generic;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Emergency : ControllerBase
    {
        public static string __connectionString { get; private set; }
        public static void set_connection(string connectionString)
        {
            __connectionString = connectionString;
        }

        [HttpGet]
        [Route("FindEmergency")]
        [ProducesResponseType(typeof(EmergencyResponse), StatusCodes.Status200OK)]
        public IActionResult FindEmergency(float Location_X,float Location_Y)
        {
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string sql = @"SELECT * FROM Emergency WHERE
                            Location_X BETWEEN @Location_X-30 AND @Location_X+30
                            OR
                            Location_Y BETWEEN @Location_Y-30 AND @Location_Y+30";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Location_X", Location_X);
            command.Parameters.AddWithValue("@Location_Y", Location_Y);

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
            return Ok(new EmergencyResponse { Error = null, Ems = sortedEmergencies, Count = sortedEmergencies.Count });
        }

        [HttpPost]
        [Route("MakeEmergency")]
        [ProducesResponseType(typeof(EmergencyResponse), StatusCodes.Status200OK)]
        public IActionResult MakeEmergency([FromBody] EmergencyObject req)
        {
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string sql = "INSERT INTO Emergency ([Name],[Location_X],[Location_Y],[Lvl_Emergency],[Description]) VALUES (@Name,@Location_X,@Location_Y,@Level,@Description)";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Name", req.Name);
            command.Parameters.AddWithValue("@Location_X", req.Location_X);
            command.Parameters.AddWithValue("@Location_Y", req.Location_Y);
            command.Parameters.AddWithValue("@Level", req.Level);
            command.Parameters.AddWithValue("@Description", req.Description);

            command.ExecuteNonQuery();

            return Ok(new EmergencyResponse { Error = null, Ems = null, Count = 1 });
        }

        [HttpDelete]
        [Route("DeleteEmergency")]
        [ProducesResponseType(typeof(EmergencyResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public IActionResult DeleteEmergency([FromBody] EmergencyObject req)
        {
            if (req == null || req.Id <= 0)
            {
                return BadRequest(new EmergencyResponse
                {
                    Error = "Invalid emergency ID",
                    Ems = null,
                    Count = 0
                });
            }

            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string sql = @"
                UPDATE Users
                SET Reputation = ISNULL(Reputation, 0) + @Level,
                    EmergenciesCompleted = ISNULL(EmergenciesCompleted, 0) + 1
                WHERE EmergencyId = @EmergencyId";

            using var commandUpdate = new SqlCommand(sql, connection);
            commandUpdate.Parameters.AddWithValue("@Level", req.Level);
            commandUpdate.Parameters.AddWithValue("@EmergencyId", req.Id);

            commandUpdate.ExecuteNonQuery();

            sql = "DELETE FROM Emergency WHERE ID = @Id";

            using var commandDelete = new SqlCommand(sql, connection);
            commandDelete.Parameters.AddWithValue("@Id", req.Id);

            int rowsAffected = commandDelete.ExecuteNonQuery();

            if (rowsAffected == 0)
            {
                return Ok(new EmergencyResponse
                {
                    Error = "No emergency deleted (id may not exist)",
                    Ems = null,
                    Count = 0
                });
            }

            return Ok(new EmergencyResponse
            {
                Error = null,
                Ems = null,
                Count = rowsAffected
            });
        }

        // previous DeleteEmergency placeholder removed and replaced with working implementation
    }
}
