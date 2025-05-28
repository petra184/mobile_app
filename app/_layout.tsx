import { Stack, useRouter } from "expo-router";
import { NotificationProvider } from "@/context/notification-context";
import { useUserStore } from "@/hooks/userStore";
import { useEffect } from "react";


function RootLayoutNav() {
    const router = useRouter();
    const { userId, isUserLoggedIn, initializeUser } = useUserStore();
    
    useEffect(() => {
      if (userId && isUserLoggedIn()) {
        initializeUser(userId);
      }
    }, [userId]);

    return (
      <Stack>
            <Stack.Screen 
            name="(tabs)" 
            options={{ 
            headerShown: false,
            }} 
        />
        <Stack.Screen 
            name="(auth)" 
            options={{ 
            headerShown: false,
            }} 
        />
        <Stack.Screen 
          name = "index"
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
    )
}

export default function RootLayout() {
  return (
    <NotificationProvider>
      <RootLayoutNav />
    </NotificationProvider>
  );
}