using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using System.Data;
using System.Data.SqlClient;
using System.Reflection.PortableExecutable;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserManager : ControllerBase
    {
        public static string __connectionString { get; private set; }
        public static void set_connection(string connectionString)
        {
            __connectionString = connectionString;
        }
        public class CertificateUploadRequest
        {
            public int UserId { get; set; }
            public IFormFile CertificateFile { get; set; }
        }

        public class CertificateResponse
        {
            public bool Success { get; set; }
            public string Message { get; set; }
            public string FileName { get; set; }
            public long? FileSize { get; set; }
            public string ContentType { get; set; }
        }

        [HttpPost]
        [Route("UploadCertificate")]
        [ProducesResponseType(typeof(CertificateResponse), StatusCodes.Status200OK)]
        [Consumes("multipart/form-data")] // Important for file uploads
        public async Task<IActionResult> UploadCertificate([FromForm] CertificateUploadRequest request)
        {
            if (request.UserId <= 0)
                return BadRequest(new CertificateResponse { Success = false, Message = "Invalid user ID" });

            if (request.CertificateFile == null || request.CertificateFile.Length == 0)
                return BadRequest(new CertificateResponse { Success = false, Message = "No certificate file provided" });

            // Validate file size (example: max 10MB)
            if (request.CertificateFile.Length > 10 * 1024 * 1024)
                return BadRequest(new CertificateResponse { Success = false, Message = "File size exceeds 10MB limit" });

            // Validate file type
            var allowedExtensions = new[] { ".png", ".jpg", ".jpeg", ".pdf", ".gif" };
            var extension = Path.GetExtension(request.CertificateFile.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new CertificateResponse
                {
                    Success = false,
                    Message = $"Invalid file type. Allowed types: {string.Join(", ", allowedExtensions)}"
                });

            using var connection = new SqlConnection(__connectionString);
            await connection.OpenAsync();

            // Convert file to byte array
            using var memoryStream = new MemoryStream();
            await request.CertificateFile.CopyToAsync(memoryStream);
            var certificateData = memoryStream.ToArray();

            // SQL query to update user's certificate
            string sql = @"UPDATE Users SET Certificate = @Certificate,
                            CertificateContentType = @ContentType,
                            CertificateFileName = @FileName,
                            CertificateFileSize = @FileSize,
                            IsImage = 1
                            WHERE Id = @UserId";

            using var command = new SqlCommand(sql, connection);

            // Add parameters
            command.Parameters.AddWithValue("@UserId", request.UserId);
            command.Parameters.Add("@Certificate", SqlDbType.VarBinary, -1).Value = certificateData; // -1 = max
            command.Parameters.AddWithValue("@ContentType", request.CertificateFile.ContentType);
            command.Parameters.AddWithValue("@FileName", request.CertificateFile.FileName);
            command.Parameters.AddWithValue("@FileSize", request.CertificateFile.Length);

            int rowsAffected = await command.ExecuteNonQueryAsync();

            if (rowsAffected == 0)
                return NotFound(new CertificateResponse
                {
                    Success = false,
                    Message = "User not found"
                });

            return Ok(new CertificateResponse
            {
                Success = true,
                Message = "Certificate uploaded successfully",
                FileName = request.CertificateFile.FileName,
                FileSize = request.CertificateFile.Length,
                ContentType = request.CertificateFile.ContentType
            });
        }
        public class ApplyResponse
        {
            public string Error { get; set; }
            public string Names { get; set; } // they are splited via a ,
        }

        [HttpPost]
        [Route("ApplyFor")]
        [ProducesResponseType(typeof(ApplyResponse), StatusCodes.Status200OK)]
        public IActionResult ApplyFor(int EmergencyId, int UserId)
        {
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            // 1. Get username
            string sql = @"SELECT Name FROM Users WHERE ID = @Id";
            using var command1 = new SqlCommand(sql, connection);
            command1.Parameters.AddWithValue("@Id", UserId);

            using var reader1 = command1.ExecuteReader();

            if (!reader1.Read())
            {
                return Ok(new ApplyResponse
                {
                    Error = "User not found.",
                    Names = null
                });
            }

            string username = reader1.GetString(reader1.GetOrdinal("Name"));
            reader1.Close();

            // 2. Get current applyers usernames and ActiveApplyers count
            sql = @"SELECT ApplyersUsernames, ActiveApplyers FROM Emergency WHERE ID = @Id";
            using var command2 = new SqlCommand(sql, connection);
            command2.Parameters.AddWithValue("@Id", EmergencyId);

            using var reader2 = command2.ExecuteReader();

            if (!reader2.Read())
            {
                return Ok(new ApplyResponse
                {
                    Error = "Emergency not found.",
                    Names = null
                });
            }

            // Handle NULL values properly
            int applyersIndex = reader2.GetOrdinal("ApplyersUsernames");
            string currentUsernames = reader2.IsDBNull(applyersIndex) ? "" : reader2.GetString(applyersIndex);

            // Get ActiveApplyers, handle NULL as 0
            int activeApplyersIndex = reader2.GetOrdinal("ActiveApplyers");
            int currentActiveApplyers = reader2.IsDBNull(activeApplyersIndex) ? 0 : reader2.GetInt32(activeApplyersIndex);

            reader2.Close();

            // 3. Append new username (avoid duplicate comma)
            string newUsernames = string.IsNullOrEmpty(currentUsernames)
                ? username + ","
                : currentUsernames + username + ",";

            // Increment ActiveApplyers
            int newActiveApplyers = currentActiveApplyers + 1;

            // 4. UPDATE the existing record with both fields
            sql = @"UPDATE Emergency 
            SET ApplyersUsernames = @Usernames, 
                ActiveApplyers = @ActiveApplyers 
            WHERE ID = @EmergencyId";

            using var command3 = new SqlCommand(sql, connection);
            command3.Parameters.AddWithValue("@Usernames", newUsernames);
            command3.Parameters.AddWithValue("@ActiveApplyers", newActiveApplyers);
            command3.Parameters.AddWithValue("@EmergencyId", EmergencyId);

            int rowsAffected = command3.ExecuteNonQuery();

            if (rowsAffected > 0)
            {
                return Ok(new ApplyResponse
                {
                    Error = null,
                    Names = newUsernames
                });
            }

            return Ok(new ApplyResponse
            {
                Error = "Failed to update emergency record.",
                Names = null
            });
        }
    }
}
