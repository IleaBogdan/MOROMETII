import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const API_BASE = "http://192.168.35.203:5024";

interface LoginResponse {
  EmCount: number;
  Error: string | null;
  Id: number;
  IsValid: boolean;
  isVerified: boolean;
  Username: string | null;
  isImage: boolean;
  reputation: number | null;
  isAdmin: boolean;
}

export async function handleSignIn(
  setLoading: any,
  email: string,
  password: string
) {
  setLoading(true);
  try {
    const encodedEmail = email.trim();
    const encodedPassword = password.trim();
    const url = `${API_BASE}/api/UserValidator/CheckLogin?Email=${encodedEmail}&Password=${encodedPassword}`;
    console.log("🔵 Attempting connection to:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    console.log("✅ Response:", data);
    return { data, response };
  } catch (error: any) {
    if (error.name === "AbortError") {
      Alert.alert("Timeout", "Serverul nu răspunde.");
    } else {
      //   Alert.alert(
      //     "Eroare de Rețea",
      //     `Nu se poate conecta la server.\n\nIP Server: ${API_BASE}\n\nVerifică:\n• Ambele dispozitive sunt pe aceeași rețea WiFi\n• Serverul C# rulează\n• Firewall-ul permite conexiuni\n\nEroare: ${error.message}`
      //   );
    }
    return null;
  } finally {
    setLoading(false);
  }
}

export async function _handleSignUp(
  setLoading: any,
  name: string,
  email: string,
  password: string,
  router: any
) {
  if (!name.trim() || !email.trim() || !password.trim()) {
    Alert.alert("Eroare", "Te rugăm să completezi toate câmpurile");
    return null;
  }
  setLoading(true);
  try {
    const url = `${API_BASE}/api/UserValidator/SignUp`;
    console.log("🔵 Attempting to create an account:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Name: name.trim(),
        Email: email.trim(),
        Password: password.trim(),
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      Alert.alert("Eroare", `Server error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log("✅ Response:", data);

    if (!data.isValid) {
      Alert.alert("Eroare", data.error || "Înregistrare eșuată");
      return null;
    }
    return {
      data: {
        IsValid: data.isValid,
        Id: data.id,
        Username: data.username,
        Error: data.error,
        isVerified: data.isVerified,
        isImage: data.isImage,
        reputation: data.reputation,
        EmCount: data.emCount,
        isAdmin: data.isAdmin,
      },
      response,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      Alert.alert(
        "Timeout",
        "Serverul nu răspunde. Verifică:\n• IP-ul serverului\n• Firewall-ul\n• Conexiunea la rețea"
      );
    } else {
      Alert.alert(
        "Eroare de Rețea",
        `Nu se poate conecta la server.\n\nEroare: ${error.message}`
      );
    }
    return null;
  } finally {
    setLoading(false);
  }
}

export async function checkLogin(email: string, password: string) {
  try {
    const encodedEmail = email.trim();
    const encodedPassword = password.trim();
    const url = `${API_BASE}/api/UserValidator/CheckLogin?Email=${encodedEmail}&Password=${encodedPassword}`;
    console.log("🔵 Checking login credentials:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(" Response not OK:", response.status);
      return null;
    }

    const data: LoginResponse = await response.json();
    console.log("✅ Login check response:", data);

    if (data.IsValid) {
      await AsyncStorage.setItem("id", data.Id.toString());
      await AsyncStorage.setItem("username", data.Username || "");
      await AsyncStorage.setItem("email", email);
      await AsyncStorage.setItem("password", password);
      await AsyncStorage.setItem("isVerified", data.isVerified.toString());
      await AsyncStorage.setItem("isAdmin", data.isAdmin ? "true" : "false");
      if (data.isImage) {
        await AsyncStorage.setItem(
          "certification_img",
          data.isImage === true ? "true" : "false"
        );
      }
      if (data.reputation !== undefined && data.reputation !== null) {
        await AsyncStorage.setItem("reputation", data.reputation.toString());
      }
      if (data.EmCount !== undefined && data.EmCount !== null) {
        await AsyncStorage.setItem("events", data.EmCount.toString());
      }

      return {
        isValid: true,
        exists: true,
        ...data,
      };
    }

    return {
      isValid: false,
      exists: false,
      error: data.Error || "Invalid credentials",
    };
  } catch (error: any) {
    console.error("checkLogin error:", error.message);
    return null;
  }
}
