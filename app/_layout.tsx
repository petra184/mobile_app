import { Stack, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { NotificationProvider } from "@/context/notification-context"; // Adjust path as needed

function RootLayoutNav() {
    const router = useRouter();
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