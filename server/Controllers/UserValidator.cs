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
            public bool isVerified { get; set; }
            public int EmCount { get; set; }
            public int Reputation {  get; set; }
            public bool IsImage {  get; set; }
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

            // Updated SQL to include isVerified and calculate email count
            string sql = @"SELECT 
                            Id, 
                            Name, 
                            Email, 
                            Password, 
                            isVerified,
                            EmCount,
                            IsImage,
                            Reputation
                        FROM Users 
                        WHERE Email=@Email AND Password=@Password";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Email", Email);
            command.Parameters.AddWithValue("@Password", Password);

            using var reader = command.ExecuteReader();

            if (reader.HasRows)
            {
                reader.Read(); // Move to the first row

                // Get the data from the database
                int userId = reader.GetInt32(reader.GetOrdinal("Id"));
                string username = reader.GetString(reader.GetOrdinal("Name"));

                // Handle isVerified - it might be nullable in the database
                bool isVerified = false;
                int isVerifiedOrdinal = reader.GetOrdinal("isVerified");
                if (!reader.IsDBNull(isVerifiedOrdinal))
                {
                    isVerified = reader.GetBoolean(isVerifiedOrdinal);
                }

                // Safe reading with null checks
                int emCount = reader.IsDBNull(reader.GetOrdinal("EmCount"))
                    ? 0  // or whatever default makes sense for your app
                    : reader.GetInt32(reader.GetOrdinal("EmCount"));

                bool isImage = reader.IsDBNull(reader.GetOrdinal("IsImage"))
                    ? false  // default to false if null
                    : reader.GetBoolean(reader.GetOrdinal("IsImage"));

                int reputation = reader.IsDBNull(reader.GetOrdinal("Reputation"))
                    ? 0  // default to 0 if null
                    : reader.GetInt32(reader.GetOrdinal("Reputation"));

                return Ok(new LoginResponse
                {
                    Error = null,
                    IsValid = true,
                    Id = userId,
                    Username = username,
                    isVerified = isVerified,
                    EmCount = emCount,
                    IsImage= isImage,
                    Reputation = reputation
                });
            }
            else
            {
                // Check if email exists but password is wrong
                string emailCheckSql = "SELECT COUNT(*) FROM Users WHERE Email = @Email";
                using var emailCheckCommand = new SqlCommand(emailCheckSql, connection);
                emailCheckCommand.Parameters.AddWithValue("@Email", Email);
                int emailExists = (int)emailCheckCommand.ExecuteScalar();

                return Ok(new LoginResponse
                {
                    Error = "Wrong Credentials",
                    IsValid = false
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

            // First check if email exists
            string checkSql = "SELECT COUNT(*) as EmailCount FROM Users WHERE Email = @Email";
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
                    Username = null,
                    isVerified = false,
                    EmCount = emailCount
                });
            }

            // Insert new user with isVerified defaulting to false
            string sql = @"INSERT INTO Users (Name, Password, Email, isVerified) 
                          OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.isVerified
                          VALUES (@Name, @Password, @Email, 0);"; // Default isVerified to false

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

                // Handle isVerified - it might be nullable
                bool isVerified = false;
                int isVerifiedOrdinal = reader.GetOrdinal("isVerified");
                if (!reader.IsDBNull(isVerifiedOrdinal))
                {
                    isVerified = reader.GetBoolean(isVerifiedOrdinal);
                }

                return Ok(new LoginResponse
                {
                    Error = null,
                    IsValid = true,
                    Id = newUserId,
                    Username = newUsername,
                    isVerified = isVerified,
                    EmCount = 1 // Since we just created a new user with this email
                });
            }
            else
            {
                // Fallback in case OUTPUT clause doesn't work
                return Ok(new LoginResponse
                {
                    Error = null,
                    IsValid = true,
                    Id = 0,
                    Username = req.Name,
                    isVerified = false, // Default to false for new signups
                    EmCount = 1
                });
            }
        }

        // Optional: Add a method to update verification status
        [HttpPost]
        [Route("VerifyUser")]
        [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
        public IActionResult VerifyUser(int userId)
        {
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string sql = @"UPDATE Users SET isVerified = 1 
                          OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.isVerified
                          WHERE Id = @UserId";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@UserId", userId);

            using var reader = command.ExecuteReader();

            if (reader.HasRows)
            {
                reader.Read();
                int updatedUserId = reader.GetInt32(reader.GetOrdinal("Id"));
                string username = reader.GetString(reader.GetOrdinal("Name"));
                bool isVerified = reader.GetBoolean(reader.GetOrdinal("isVerified"));

                // Get email count for this user's email
                string emailSql = "SELECT Email FROM Users WHERE Id = @UserId";
                using var emailCommand = new SqlCommand(emailSql, connection);
                emailCommand.Parameters.AddWithValue("@UserId", userId);
                string userEmail = emailCommand.ExecuteScalar()?.ToString();

                string countSql = "SELECT COUNT(*) FROM Users WHERE Email = @Email";
                using var countCommand = new SqlCommand(countSql, connection);
                countCommand.Parameters.AddWithValue("@Email", userEmail);
                int emCount = (int)countCommand.ExecuteScalar();

                return Ok(new LoginResponse
                {
                    Error = null,
                    IsValid = true,
                    Id = updatedUserId,
                    Username = username,
                    isVerified = isVerified,
                    EmCount = emCount
                });
            }
            else
            {
                return Ok(new LoginResponse
                {
                    Error = "User not found",
                    IsValid = false,
                    Id = 0,
                    Username = null,
                    isVerified = false,
                    EmCount = 0
                });
            }
        }
    }
}