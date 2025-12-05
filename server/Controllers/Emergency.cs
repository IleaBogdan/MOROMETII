using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading.Tasks;
using System.Xml.Linq;
using static server.Controllers.UserValidator;

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
        public class EmergencyObject
        {
            public string Name { get; set; }
            public string Description { get; set; }
            public int Level { get; set; }
            public string Location { get; set; }
        }
        public class EmergencyResponse
        {
            public string Error { get; set; }
            public List<EmergencyObject> Ems { get; set; }
            public int Count { get; set; }
        }
        [HttpGet]
        [Route("FindEmergency")]
        [ProducesResponseType(typeof(EmergencyResponse), StatusCodes.Status200OK)]
        public IActionResult FindEmergency(string Location)
        {
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string sql = "SELECT * FROM Emergency";

            using var command = new SqlCommand(sql, connection);

            using var reader = command.ExecuteReader();

            var emergencies = new List<EmergencyObject>();
            while (reader.Read())
            {
                var emergency = new EmergencyObject
                {
                    Location = reader.GetString(reader.GetOrdinal("Location")),
                    Level = reader.GetInt32(reader.GetOrdinal("Lvl_Emergency")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? string.Empty : reader.GetString(reader.GetOrdinal("Description"))
                };
                emergencies.Add(emergency);
            }

            return Ok(new EmergencyResponse { Error=null, Ems=emergencies, Count=emergencies.Count});
        }
        [HttpPost]
        [Route("MakeEmergency")]
        [ProducesResponseType(typeof(EmergencyResponse), StatusCodes.Status200OK)]
        public IActionResult MakeEmergency([FromBody] EmergencyObject req)
        {
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string sql = "INSERT INTO Emergency ([Name],[Location],[Lvl_Emergency],[Description]) VALUES (@Name,@Location,@Level,@Description)";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Name", req.Name);
            command.Parameters.AddWithValue("@Location", req.Location);
            command.Parameters.AddWithValue("@Level", req.Level);
            command.Parameters.AddWithValue("@Description", req.Description);

            using var reader = command.ExecuteReader();

            return Ok(new EmergencyResponse { Error = null, Ems = null, Count = 0 });
        }


    }
}
