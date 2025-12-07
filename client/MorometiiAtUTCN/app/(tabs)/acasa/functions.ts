import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";

export const parseCoord = (value: string | number) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parts = value.trim().split(" ");
  if (parts.length === 1) {
    return parseFloat(parts[0]);
  }
  const [num, dir] = parts;
  let n = parseFloat(num);
  if (dir === "S" || dir === "W") n = -n;
  return n;
};

export const isUserIntervening = (
  interveningEmergencies: { [key: number]: string[] },
  emergencyId: number,
  userName: string
) => {
  const interveners = interveningEmergencies[emergencyId] || [];
  return interveners.includes(userName);
};
const toRad = (v: number) => (v * Math.PI) / 180;
export const distanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
export const openInMaps = (lat: number, lon: number) => {
  const latStr = lat.toString();
  const lonStr = lon.toString();
  // Corrected Google Maps URL format
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${latStr},${lonStr}`;
  const wazeUrl = `https://waze.com/ul?ll=${latStr},${lonStr}&navigate=yes`;

  Linking.openURL(googleUrl).catch(() => {
    Linking.openURL(wazeUrl).catch((err) =>
      console.warn("Could not open maps:", err)
    );
  });
};
