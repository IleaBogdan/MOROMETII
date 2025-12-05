import { useDynamicTheme } from '@/theme/theme';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  const theme = useDynamicTheme();

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.secondary },
          headerTintColor: theme.colors.onSecondary,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />

        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
