using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Reflection.Metadata.Ecma335;
using server;
using server.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using System.IO;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserValidator : ControllerBase
    {
        public static string __connectionString { get; private set; }
        public static void set_connection(string connectionString)
        {
            __connectionString = connectionString;
        }

        public class LoginResponse
        {
            public string Error { get; set; }
            public bool IsValid { get; set; }
            public int Id { get; set; }
            public string Username { get; set; }
        }

        [HttpGet]
        [Route("CheckLogin")]
        [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
        public IActionResult CheckLogin(string Email, string Password)
        {
            using (var writer = new StreamWriter("log.txt", true))
            {
                writer.WriteLine($"Login attempt: {Email} and {Password} at {DateTime.Now}");
            }

            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            // Select only the columns we need: Id and Name (which is the username)
            string sql = "SELECT Id, Name FROM Users WHERE Email=@Email AND Password=@Password";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Email", Email);
            command.Parameters.AddWithValue("@Password", Password);

            using var reader = command.ExecuteReader();

            if (reader.HasRows)
            {
                reader.Read(); // Move to the first row

                // Get the Id and Name (username) from the database
                int userId = reader.GetInt32(reader.GetOrdinal("Id"));
                string username = reader.GetString(reader.GetOrdinal("Name"));

                return Ok(new LoginResponse
                {
                    Error = null,
                    IsValid = true,
                    Id = userId,
                    Username = username // This is the "Name" column from the database
                });
            }
            else
            {
                // No user found - invalid credentials
                return Ok(new LoginResponse
                {
                    Error = "Wrong Credentials",
                    IsValid = false,
                    Id = 0,
                    Username = null
                });
            }
        }

        [HttpPost]
        [Route("SignUp")]
        [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
        public IActionResult SignUp([FromBody] SignUpRequest req)
        {
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string checkSql = "SELECT COUNT(*) FROM Users WHERE Email = @Email";
            using var checkCommand = new SqlCommand(checkSql, connection);
            checkCommand.Parameters.AddWithValue("@Email", req.Email);

            int emailCount = (int)checkCommand.ExecuteScalar();

            if (emailCount > 0)
            {
                return Ok(new LoginResponse
                {
                    Error = "Email already registered",
                    IsValid = false,
                    Id = 0,
                    Username = null
                });
            }

            string sql = @"INSERT INTO Users (Name, Password, Email) 
                          OUTPUT INSERTED.Id, INSERTED.Name
                          VALUES (@Name, @Password, @Email);";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Name", req.Name);
            command.Parameters.AddWithValue("@Password", req.Password);
            command.Parameters.AddWithValue("@Email", req.Email);

            using var reader = command.ExecuteReader();

            if (reader.HasRows)
            {
                reader.Read();
                int newUserId = reader.GetInt32(reader.GetOrdinal("Id"));
                string newUsername = reader.GetString(reader.GetOrdinal("Name"));

                return Ok(new LoginResponse
                {
                    Error = null,
                    IsValid = true,
                    Id = newUserId,
                    Username = newUsername
                });
            }
            else
            {
                // Fallback in case OUTPUT clause doesn't work
                return Ok(new LoginResponse
                {
                    Error = null,
                    IsValid = true,
                    Id = 0, // Consider retrieving the last inserted ID if needed
                    Username = req.Name
                });
            }
        }
    }
}