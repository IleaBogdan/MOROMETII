const signalR = require("@microsoft/signalr");

const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5024/emergencyhub")
  .withAutomaticReconnect()
  .build();

connection.on("ReceiveEmergencyUpdate", (response) => {
  console.log("📡 Received Emergency Update:");
  console.log(JSON.stringify(response, null, 2));
});

connection.start()
  .then(() => {
    console.log("✅ Connected to SignalR hub");
    console.log("Joining emergency group...");
    return connection.invoke("JoinEmergencyGroup");
  })
  .then(() => {
    console.log("Finding emergencies at Building A...");
    return connection.invoke("FindEmergency", "Building A");
  })
  .catch(err => console.error("❌ Error:", err));

setTimeout(() => {
  connection.stop();
  process.exit(0);
}, 3000);
