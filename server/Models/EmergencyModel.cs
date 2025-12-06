namespace server.Models
{
    public class EmergencyObject
    {
        public int Id { get; set; }
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
}
