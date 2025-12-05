import { useDynamicTheme } from '@/theme/theme';
// import {
//   MontserratAlternates_100Thin,
//   MontserratAlternates_300Light,
//   MontserratAlternates_400Regular,
//   MontserratAlternates_500Medium,
//   useFonts,
// } from '@expo-google-fonts/montserrat-alternates';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  // const [fontsLoaded] = useFonts({
  //   'MontserratAlternates-Thin': MontserratAlternates_100Thin,
  //   'MontserratAlternates-Light': MontserratAlternates_300Light,
  //   'MontserratAlternates-Regular': MontserratAlternates_400Regular,
  //   'MontserratAlternates-Medium': MontserratAlternates_500Medium,
  //   'Montserrat Alternates': MontserratAlternates_400Regular,
  // });

  // if (!fontsLoaded) {
  //   return null;
  // }
  const theme = useDynamicTheme();

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
