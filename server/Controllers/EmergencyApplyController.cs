using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using server.Models;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmergencyApplyController : ControllerBase
    {
        public static string __connectionString { get; private set; }
        public static void set_connection(string connectionString)
        {
            __connectionString = connectionString;
        }

        // GET api/EmergencyApply/FindAppliers?emergencyId=1
        [HttpGet]
        [Route("FindAppliers")]
        [ProducesResponseType(typeof(ApplierResponse), StatusCodes.Status200OK)]
        public IActionResult FindAppliers(int emergencyId)
        {
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string sql = "SELECT Id, Name, Email, Password, EmergencyId FROM Users WHERE EmergencyId = @EmergencyId";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@EmergencyId", emergencyId);

            using var reader = command.ExecuteReader();

            var appliers = new List<User>();
            while (reader.Read())
            {
                var applier = new User
                {
                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                    Name = reader.IsDBNull(reader.GetOrdinal("Name")) ? string.Empty : reader.GetString(reader.GetOrdinal("Name")),
                    Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? string.Empty : reader.GetString(reader.GetOrdinal("Email")),
                    Password = reader.IsDBNull(reader.GetOrdinal("Password")) ? string.Empty : reader.GetString(reader.GetOrdinal("Password")),
                    Image = null,
                    EmergencyId = reader.IsDBNull(reader.GetOrdinal("EmergencyId")) ? 0 : reader.GetInt32(reader.GetOrdinal("EmergencyId"))
                };
                appliers.Add(applier);
            }

            var sorted = appliers.OrderBy(a => a.Name).ToList();
            return Ok(new ApplierResponse { Error = null, Appliers = sorted, Count = sorted.Count });
        }

        // POST api/EmergencyApply/SetUserEmergency
        // Body: { "UserId": 123, "EmergencyId": 1 }
        [HttpPost]
        [Route("SetUserEmergency")]
        [ProducesResponseType(typeof(ApplierResponse), StatusCodes.Status200OK)]
        public IActionResult SetUserEmergency([FromBody] SetUserEmergencyRequest req)
        {
            if (req == null || req.UserId <= 0)
            {
                return BadRequest(new ApplierResponse { Error = "Invalid request", Appliers = null, Count = 0 });
            }

            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            // Optional: verify the emergency exists
            string checkEmergencySql = "SELECT COUNT(*) FROM Emergency WHERE ID = @EmergencyId";
            using (var checkCmd = new SqlCommand(checkEmergencySql, connection))
            {
                checkCmd.Parameters.AddWithValue("@EmergencyId", req.EmergencyId);
                int exist = Convert.ToInt32(checkCmd.ExecuteScalar());
                if (exist == 0)
                {
                    return Ok(new ApplierResponse { Error = "Emergency not found", Appliers = null, Count = 0 });
                }
            }

            string sql = "UPDATE Users SET EmergencyId = @EmergencyId WHERE Id = @UserId";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@EmergencyId", req.EmergencyId);
            command.Parameters.AddWithValue("@UserId", req.UserId);

            int rowsAffected = command.ExecuteNonQuery();

            if (rowsAffected == 0)
            {
                return Ok(new ApplierResponse { Error = "No user updated (user id may not exist)", Appliers = null, Count = 0 });
            }

            return Ok(new ApplierResponse { Error = null, Appliers = null, Count = rowsAffected });
        }

        public class SetUserEmergencyRequest
        {
            public int UserId { get; set; }
            public int EmergencyId { get; set; }
        }
    }
}
