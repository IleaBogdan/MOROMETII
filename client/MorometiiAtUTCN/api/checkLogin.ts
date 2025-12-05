const API_BASE = process.env.API_BASE;

export async function checkLogin(email: string, password: string) {
  try {
    const requestOptions = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };

    const response = await fetch(
      API_BASE +
        `/api/UserValidator/CheckLogin?Email=${email}&Password=${password}`,
      requestOptions
    );

    const data = await response.json();

    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
}
