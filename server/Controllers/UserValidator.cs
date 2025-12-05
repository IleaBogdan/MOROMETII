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
using System;
using System.IO;
using System.Threading.Tasks;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserValidator : ControllerBase
    {
        public static string __connectionString {get; private set; }
        public static void set_connection(string connectionString)
        {
            __connectionString = connectionString;
        }
        public class LoginResponse
        {
            public string Error { get; set; }
            public bool IsValid { get; set; }
        }

        [HttpGet]
        [Route("CheckLogin")]
        [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
        public IActionResult CheckLogin(string Email,string Password)
        {
            using (var writer = new StreamWriter("log.txt", true))
            {
                writer.WriteLine($"Login attempt: {Email} and {Password} at {DateTime.Now}");
            }
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string sql = "SELECT * FROM Users WHERE Email=@Email AND Password=@Password";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Email", Email);
            command.Parameters.AddWithValue("@Password", Password);

            using var reader = command.ExecuteReader();

            if (reader.HasRows)
            {
                // User found - credentials are valid
                reader.Read(); // Move to the first row

                return Ok(new LoginResponse
                {
                    Error = null,
                    IsValid = true
                });
            }
            else
            {
                // No user found - invalid credentials
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
        public IActionResult SignUp([FromBody]SignUpRequest req)
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
                    IsValid = false
                });
            }

            string sql = @"INSERT INTO Users (Name, Password, Email) VALUES (@Name, @Password, @Email);";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Name", req.Name);
            command.Parameters.AddWithValue("@Password", req.Password);
            command.Parameters.AddWithValue("@Email", req.Email);

            using var reader = command.ExecuteReader();

            return Ok(new LoginResponse
            {
                Error=null,
                IsValid = true
            });
        }
    }
}
