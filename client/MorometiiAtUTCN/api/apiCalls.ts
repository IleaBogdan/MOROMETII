import { Alert } from "react-native";

const API_BASE = "http://192.168.232.182:5024";

interface LoginResponse {
  Error: string | null;
  IsValid: boolean;
  Id: number;
  Username: string | null;
  isVerified: boolean;
  EmCount: number;
  certification_img: string | null;
  reputation: number | null;
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

export async function _handleSignUp(
  setLoading: any,
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  router: any
) {
  // Validate inputs
  if (
    !name.trim() ||
    !email.trim() ||
    !password.trim() ||
    !confirmPassword.trim()
  ) {
    Alert.alert("Eroare", "Te rugăm să completezi toate câmpurile");
    return null;
  }

  if (password !== confirmPassword) {
    Alert.alert("Eroare", "Parolele nu se potrivesc");
    return null;
  }

  if (password.length < 6) {
    Alert.alert("Eroare", "Parola trebuie să aibă cel puțin 6 caractere");
    return null;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Alert.alert("Eroare", "Email invalid");
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
        Password: password,
      }),
    });

    clearTimeout(timeoutId);
    const data: LoginResponse = await response.json();

    console.log("✅ Response:", data);

    if (!data.IsValid) {
      Alert.alert("Eroare", data.Error || "Înregistrare eșuată");
      return null;
    }
    if (data.IsValid && data.Id > 0) {
      Alert.alert(
        "Succes!",
        "Contul a fost creat cu succes! Te poți autentifica acum.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/signin"),
          },
        ]
      );
    }

    return { data, response };
  } catch (error: any) {
    if (error.name === "AbortError") {
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
// export async function checkLogin(email: string, password: string) {
//   try {
//     const encodedEmail = email.trim();
//     const encodedPassword = password.trim();
//     const url = `${API_BASE}/api/UserValidator/CheckLogin?Email=${encodedEmail}&Password=${encodedPassword}`;
//     console.log("🔵 Checking login credentials:", url);

//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 8000);

//     const response = await fetch(url, {
//       method: "GET",
//       signal: controller.signal,
//     });

//     clearTimeout(timeoutId);

//     if (!response.ok) {
//       console.log("❌ Response not OK:", response.status);
//       return null;
//     }

//     const data: LoginResponse = await response.json();
//     console.log("✅ Login check response:", data);

//     // Return data that matches your index.tsx expectations
//     if (data.IsValid) {
//       // Store user data in AsyncStorage for the app to use
//       await AsyncStorage.setItem("id", data.Id.toString());
//       await AsyncStorage.setItem("username", data.Username || "");
//       await AsyncStorage.setItem("email", email);
//       await AsyncStorage.setItem("password", password);
//       await AsyncStorage.setItem("isVerified", data.isVerified.toString());

//       if (data.certification_img) {
//         await AsyncStorage.setItem("certification_img", data.certification_img);
//       }
//       if (data.reputation !== undefined && data.reputation !== null) {
//         await AsyncStorage.setItem("reputation", data.reputation.toString());
//       }
//       if (data.EmCount !== undefined && data.EmCount !== null) {
//         await AsyncStorage.setItem("events", data.EmCount.toString());
//       }

//       return {
//         isValid: true,
//         exists: true,
//         ...data,
//       };
//     }

//     return {
//       isValid: false,
//       exists: false,
//       error: data.Error || "Invalid credentials",
//     };
//   } catch (error: any) {
//     console.error("❌ checkLogin error:", error.message);
//     return null;
//   }
// }
