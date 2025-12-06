import { Alert } from "react-native";

const API_BASE = "http://192.168.232.182:5024";

export async function handleSignIn(setLoading: any, email: string, password: string) {
  setLoading(true);
  try {
      const encodedEmail = email.trim();
      const encodedPassword = password.trim();
      const url = `${API_BASE}/api/UserValidator/CheckLogin?Email=${encodedEmail}&Password=${encodedPassword}`;
      console.log("🔵 Attempting connection to:", url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      console.log("✅ Response:", data);
      return { data, response };
      
  } catch (error: any) {
      if (error.name === 'AbortError') {
          Alert.alert(
              "Timeout",
              "Serverul nu răspunde. Verifică:\n• IP-ul serverului\n• Firewall-ul\n• Conexiunea la rețea"
          );
      } else {
          Alert.alert(
              "Eroare de Rețea",
              `Nu se poate conecta la server.\n\nIP Server: ${API_BASE}\n\nVerifică:\n• Ambele dispozitive sunt pe aceeași rețea WiFi\n• Serverul C# rulează\n• Firewall-ul permite conexiuni\n\nEroare: ${error.message}`
          );
      }
      return null;
  } finally {
      setLoading(false);
  }
}

export async function _handleSignUp(setLoading:any,name:string,email:string,password:string){
    setLoading(true);
    try {
      const url = `${API_BASE}/api/UserValidator/SignUp`;
      console.log("🔵 Attempting connection make an acount:", url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({Name:name,Email:email,Password:password})
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      console.log("✅ Response:", data);
      return { data, response };
      
  } catch (error: any) {
      if (error.name === 'AbortError') {
          Alert.alert(
              "Timeout",
              "Serverul nu răspunde. Verifică:\n• IP-ul serverului\n• Firewall-ul\n• Conexiunea la rețea"
          );
      } else {
          Alert.alert(
              "Eroare de Rețea",
              `Nu se poate conecta la server.\n\nIP Server: ${API_BASE}\n\nVerifică:\n• Ambele dispozitive sunt pe aceeași rețea WiFi\n• Serverul C# rulează\n• Firewall-ul permite conexiuni\n\nEroare: ${error.message}`
          );
      }
      return null;
  } finally {
      setLoading(false);
  }
}