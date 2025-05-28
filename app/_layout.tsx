import { Stack, useRouter } from "expo-router";
import { NotificationProvider } from "@/context/notification-context";
import { useUserStore } from "@/hooks/userStore";
import { useEffect } from "react";
import { Pressable } from "react-native";
import Entypo from '@expo/vector-icons/Entypo';
import { colors } from "@/constants/colors";

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
        <Stack.Screen 
            name="user_profile/index" 
            options={{ 
            headerShown: false,
            }} 
        />
        <Stack.Screen 
        name="user_profile/manage_fav_teams" 
        options={{ 
          headerShown: true,
          headerTitleAlign: "center",
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
                <Entypo name="chevron-left" size={24} color={colors.primary} />
            </Pressable>
          ),
          headerTitle: "Manage Favorite Teams",
          headerTitleStyle: {
            color: "#035e32",
          },
        }} 
      />
      <Stack.Screen 
        name="user_profile/change_password"  
        options={{ 
          headerShown: true,
          headerTitle: "Change Password",
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Entypo name="chevron-left" size={24} color={colors.primary} />
            </Pressable>
          ),
          headerTitleStyle: {
            color: "#035e32",
          },
        }} 
      />
      <Stack.Screen 
        name="user_profile/edit_profile"  
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="user_profile/account_settings" 
        options={{ 
          headerShown: true,
          headerTitleAlign: "center",
          headerTitle: "Account Settings",
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
               <Entypo name="chevron-left" size={24} color={colors.primary} />
            </Pressable>
          ),
          headerTitleStyle: {
            color: "#035e32",
          },
        }} 
      />
      <Stack.Screen 
        name="user_profile/activity_history" 
        options={{ 
          headerShown: true,
          headerTitleAlign: "center",
          headerTitle: "Activity History",
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
               <Entypo name="chevron-left" size={24} color={colors.primary} />
            </Pressable>
          ),
          headerTitleStyle: {
            color: "#035e32",
            fontWeight: '600',
          },
        }} 
      />
      <Stack.Screen 
        name="all_cards/all_games" 
        options={{ 
          title: "All Games",
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Entypo name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
          headerBackTitle: "Back",
          headerTitleAlign: "center",
          headerTitleStyle: {
            color: "black",
          },
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