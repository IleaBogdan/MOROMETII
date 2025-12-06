using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
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
        public class CertificateResponse
        {
            public string Error { get; set; }
            public string Status {  get; set; }
        }

        [HttpPost]
        [Route("UploadeCertificate")]
        [ProducesResponseType(typeof(CertificateResponse), StatusCodes.Status200OK)]
        public IActionResult UploadeCertificate([FromBody]CertificateData req)
        {
            using var connection = new SqlConnection(__connectionString);
            connection.Open();

            string sql = "";

            using var command = new SqlCommand(sql, connection);

            using var reader = command.ExecuteReader();
        }
    }
}
