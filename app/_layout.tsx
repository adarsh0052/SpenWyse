import { Stack } from 'expo-router';
import { View } from 'react-native';
import { OnboardingProvider } from '../context/OnboardingContext'; 

export default function RootLayout() {
  return (
    // 1. WRAP EVERYTHING IN THE PROVIDER
    <OnboardingProvider>
      <View style={{ flex: 1, backgroundColor: '#0F1115' }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0F1115' },
            animation: 'slide_from_right',
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="login" />
          <Stack.Screen name="user-type" />
          <Stack.Screen name="income" />
          <Stack.Screen name="obligations" />
          <Stack.Screen name="transition" />
        </Stack>
      </View>
    </OnboardingProvider>
  );
}