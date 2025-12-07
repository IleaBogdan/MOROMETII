import { useAuth } from "./AuthContext";

export function useAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin;
}
