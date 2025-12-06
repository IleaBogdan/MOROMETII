import { Platform, useColorScheme } from "react-native";
import {
  MD3LightTheme as DefaultLightTheme,
  MD3DarkTheme as DefaultDarkTheme,
  MD3Theme,
} from "react-native-paper";

import lightColors from "./colors_light.json";
import darkColors from "./colors_dark.json";

/* ------------ FONT SELECTOR ------------ */
const getFontFamily = (weight: "100" | "300" | "400" | "500") => {
  if (Platform.OS === "ios") return "Montserrat Alternates";

  switch (weight) {
    case "100":
      return "MontserratAlternates-Thin";
    case "300":
      return "MontserratAlternates-Light";
    case "400":
      return "MontserratAlternates-Regular";
    case "500":
      return "MontserratAlternates-Medium";
    default:
      return "MontserratAlternates-Regular";
  }
};

const getFonts = () => {
  const mk = (
    weight: "100" | "300" | "400" | "500",
    fontSize: number,
    lineHeight: number
  ) => ({
    fontFamily: getFontFamily(weight),
    fontSize,
    lineHeight,
    letterSpacing: 0,
    fontWeight: weight as any,
  });

  return {
    displayLarge: mk("400", 57, 64),
    displayMedium: mk("400", 45, 52),
    displaySmall: mk("400", 36, 44),
    headlineLarge: mk("400", 32, 40),
    headlineMedium: mk("400", 28, 36),
    headlineSmall: mk("400", 24, 32),
    titleLarge: mk("500", 22, 28),
    titleMedium: mk("500", 16, 24),
    titleSmall: mk("500", 14, 20),
    labelLarge: mk("500", 14, 20),
    labelMedium: mk("500", 12, 16),
    labelSmall: mk("500", 11, 16),
    bodyLarge: mk("400", 16, 24),
    bodyMedium: mk("400", 14, 20),
    bodySmall: mk("400", 12, 16),
  };
};

/* ------------ DYNAMIC THEME ------------ */
export const useDynamicTheme = (): MD3Theme => {
  const scheme = useColorScheme(); // "light" | "dark" | null
  const isDark = scheme === "dark";

  const base = isDark
    ? {
        ...DefaultDarkTheme,
        colors: { ...DefaultDarkTheme.colors, ...darkColors.colors },
      }
    : {
        ...DefaultLightTheme,
        colors: { ...DefaultLightTheme.colors, ...lightColors.colors },
      };

  return {
    ...base,
    dark: isDark, // ✔ required
    isV3: true, // ✔ required for MD3
    fonts: {
      ...base.fonts,

      ...getFonts(),
    },
  };
};
// eslint-disable-next-line react-hooks/rules-of-hooks
export const theme = useDynamicTheme();
