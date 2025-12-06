using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public Image_Photo Image { get; set; }        
    }
    public class Image_Photo
    {
        [Column(TypeName = "varbinary(max)")]
        public byte[] Certificate { get; set; }
        public string CertificateContentType { get; set; }
        public string CertificateFileName { get; set; }
        public long? CertificateFileSize { get; set; }
    }
}
