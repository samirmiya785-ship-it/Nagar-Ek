import { AuthStoreInterface, useAuthStore } from "@/stores/authStore";
import { startAlertNotificationService, stopAlertNotificationService } from "../services/alertNotificationService";
import { router, Stack, SplashScreen } from "expo-router";
import { useEffect } from "react";
import GlobalLoader from "../components/GlobalLoader";

// Keep the splash screen visible while we fetch auth state and determine initial route
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isInitialized, isLoggedIn, fetchMe } = useAuthStore() as AuthStoreInterface;

  useEffect(() => {
    if (!isInitialized) return;

    if (isLoggedIn) {
      router.replace("/tabs");
      fetchMe(); // Fetch the latest user data (points, etc) right after login/app open
      // Start listening for nearby alerts and firing notifications
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
      startAlertNotificationService(apiUrl);
    } else {
      router.replace("/");
      // Stop the socket connection when logged out
      stopAlertNotificationService();
    }

    // Hide the splash screen a tiny bit after the router navigation is triggered 
    // to ensure the new screen has mounted.
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);

    return () => {
      stopAlertNotificationService();
    };
  }, [isInitialized, isLoggedIn]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalLoader />
    </>
  );
}