import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Alert, BackHandler, Platform } from 'react-native';
import * as Location from 'expo-location';
import { startPeriodicSync } from '@/lib/sync';
import { startRealtimeUpdates } from '@/lib/realtime';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [permissionChecked, setPermissionChecked] = useState<boolean>(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const ensureLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location permission required',
            'For safety and proper execution, Civic Reporter needs your location. The app will close if permission is not granted.',
            [
              {
                text: 'Close App',
                onPress: () => {
                  // Exit on Android; on iOS keep splash (cannot programmatically exit)
                  if (Platform.OS === 'android') {
                    BackHandler.exitApp();
                  }
                },
                style: 'destructive',
              },
            ],
            { cancelable: false }
          );
          setPermissionGranted(false);
        } else {
          setPermissionGranted(true);
        }
      } catch (e) {
        setPermissionGranted(false);
      } finally {
        setPermissionChecked(true);
      }
    };
    if (loaded && !permissionChecked) {
      ensureLocationPermission();
    }
  }, [loaded, permissionChecked]);

  useEffect(() => {
    if (loaded && permissionGranted) {
      SplashScreen.hideAsync();
      // Start background sync once app is usable
      startPeriodicSync(30000);
      
  // Initialize real-time updates
      initializeApp();
    }
  }, [loaded, permissionGranted]);

  const initializeApp = async () => {
    try {
  // ...existing code...
      
      // Start real-time updates
      startRealtimeUpdates();
      
      // Handle notification responses
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  if (!loaded || !permissionChecked || !permissionGranted) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const systemScheme = useColorScheme();

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
