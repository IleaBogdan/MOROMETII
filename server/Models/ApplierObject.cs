namespace server.Models
{
    public class ApplierResponse
    {
        public string Error { get; set; }
        public List<User> Appliers { get; set; }
        public int Count { get; set; }
    }
}