using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using System.Data;
using System.Data.SqlClient;

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

            try
            {
                using var connection = new SqlConnection(__connectionString);
                await connection.OpenAsync();

                // Convert file to byte array
                using var memoryStream = new MemoryStream();
                await request.CertificateFile.CopyToAsync(memoryStream);
                var certificateData = memoryStream.ToArray();

                // SQL query to update user's certificate
                string sql = @"
            UPDATE Users 
            SET Certificate = @Certificate,
                CertificateContentType = @ContentType,
                CertificateFileName = @FileName,
                CertificateFileSize = @FileSize
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
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(500, new CertificateResponse
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }
    }
}
