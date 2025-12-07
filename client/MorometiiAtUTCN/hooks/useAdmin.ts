import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      const flag = await AsyncStorage.getItem("isAdmin");
      setIsAdmin(flag === "true");
    };
    load();
  }, []);

  return isAdmin;
};
