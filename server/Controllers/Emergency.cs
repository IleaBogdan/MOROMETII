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

            string sql = @"SELECT * FROM Emergency";

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
            var sortedEmergencies = emergencies.OrderBy(e => -e.Level).ToList();
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

            try
            {
                using var connection = new SqlConnection(__connectionString);
                connection.Open();

                // First, get the emergency details including ApplyersUsernames
                string getEmergencySql = @"
            SELECT ApplyersUsernames, Lvl_Emergency 
            FROM Emergency 
            WHERE ID = @Id";

                using var getEmergencyCommand = new SqlCommand(getEmergencySql, connection);
                getEmergencyCommand.Parameters.AddWithValue("@Id", req.Id);

                using var reader = getEmergencyCommand.ExecuteReader();
                string applyersUsernames = null;
                int emergencyLevel = 0;

                if (reader.Read())
                {
                    applyersUsernames = reader["ApplyersUsernames"] as string;
                    emergencyLevel = Convert.ToInt32(reader["Lvl_Emergency"]);
                }
                reader.Close();

                // If there are applyers usernames, process them
                if (!string.IsNullOrWhiteSpace(applyersUsernames))
                {
                    // Split the usernames by comma
                    var usernames = applyersUsernames
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(u => u.Trim())
                        .Where(u => !string.IsNullOrWhiteSpace(u))
                        .ToList();

                    if (usernames.Any())
                    {
                        // Update users' reputation and emergency count based on usernames
                        string updateUsersSql = @"
                    UPDATE Users 
                    SET Reputation = ISNULL(Reputation, 0) + @EmergencyLevel,
                        EmCount = ISNULL(EmCount, 0) + 1
                    WHERE Name IN (";

                        // Create parameterized query for usernames
                        for (int i = 0; i < usernames.Count; i++)
                        {
                            updateUsersSql += $"@Username{i}";
                            if (i < usernames.Count - 1)
                                updateUsersSql += ",";
                        }
                        updateUsersSql += ")";

                        using var updateUsersCommand = new SqlCommand(updateUsersSql, connection);
                        updateUsersCommand.Parameters.AddWithValue("@EmergencyLevel", emergencyLevel);

                        for (int i = 0; i < usernames.Count; i++)
                        {
                            updateUsersCommand.Parameters.AddWithValue($"@Username{i}", usernames[i]);
                        }

                        updateUsersCommand.ExecuteNonQuery();
                    }
                }

                // Delete the emergency
                string deleteEmergencySql = "DELETE FROM Emergency WHERE ID = @Id";

                using var deleteEmergencyCommand = new SqlCommand(deleteEmergencySql, connection);
                deleteEmergencyCommand.Parameters.AddWithValue("@Id", req.Id);

                int rowsAffected = deleteEmergencyCommand.ExecuteNonQuery();

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
            catch (SqlException ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new EmergencyResponse
                {
                    Error = $"Database error: {ex.Message}",
                    Ems = null,
                    Count = 0
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new EmergencyResponse
                {
                    Error = $"Unexpected error: {ex.Message}",
                    Ems = null,
                    Count = 0
                });
            }
        }

        // previous DeleteEmergency placeholder removed and replaced with working implementation
    }
}
