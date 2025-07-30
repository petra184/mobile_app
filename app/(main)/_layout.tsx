import { Stack, useRouter } from "expo-router";
import { NotificationProvider } from "@/context/notification-context";
import { useUserStore } from "@/hooks/userStore";
import { useEffect } from "react";
import { Pressable } from "react-native";
import Entypo from '@expo/vector-icons/Entypo';
import { colors } from "@/constants/colors";
import { Feather } from '@expo/vector-icons';
import { CartProvider } from "@/context/cart-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"

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
            name="user_profile/index" 
            options={{ 
            headerShown: false,
            }} 
        />
         <Stack.Screen 
            name="user_profile/documents" 
            options={{ 
            headerShown: true,
            headerTitle:"",
            headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
                <Entypo name="chevron-left" size={24} color="black" />
                </Pressable>
              ),
            }} 
        />
        <Stack.Screen 
            name="user_profile/scanning" 
            options={{ 
            headerShown: true,
            headerTitle:"QR Code Scanner",
            headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
                <Entypo name="chevron-left" size={24} color="black" />
                </Pressable>
              ),
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
          headerTitle: "",
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
        name="all_cards/all_games" 
        options={{ 
          headerShown:false,
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
      <Stack.Screen 
        name="all_cards/all_teams" 
        options={{ 
          title: "Teams",
          headerStyle: { 
            backgroundColor: colors.background,
            
          },
          headerShown:true,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Entypo name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
          headerBackTitle: "Back",
        }} 
      />
       <Stack.Screen 
        name="all_cards/game_details" 
        options={{ 
          title: "",
          headerStyle: { 
            backgroundColor: colors.primary,
          },
          headerBackTitle: "Back",
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Entypo name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="all_cards/points" 
        options={{ 
          title: "",
          headerStyle: { 
            backgroundColor: colors.primary,
          },
          headerBackTitle: "Back",
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Entypo name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="all_cards/news_details" 
        options={{ 
          title: "",
          headerBackTitle: "Back",
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color="black" />
            </Pressable>
          )
        }} 
      />
      <Stack.Screen 
        name="teams/InfoTab" 
        options={{ 
          title: "",
          headerShown: true,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
        }} 
      />
      <Stack.Screen 
        name="teams/index" 
        options={{ 
          title: "",
          headerShown: false,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
        }} 
      />
      <Stack.Screen 
        name="teams/RosterTab" 
        options={{ 
          title: "",
          headerShown: true,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
        }} 
      />
      <Stack.Screen 
        name="teams/ScheduleTab" 
        options={{ 
          title: "",
          headerShown: true,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
        }} 
      />
       <Stack.Screen 
        name="teams/Coaches" 
        options={{ 
          title: "",
          headerShown: true,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
        }} 
      />
      <Stack.Screen 
        name="teams/Players" 
        options={{ 
          title: "",
          headerShown: true,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
        }} 
      />
      <Stack.Screen 
        name="store/CelebrateBirthday" 
        options={{ 
          title: "",
          headerShown: false,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
        }} 
      />
      <Stack.Screen 
        name="store/Checkout" 
        options={{ 
          title: "Checkout",
          headerShown: true,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()} 
              style={{ marginRight: 16 }}>
              <Feather name="chevron-left" size={24} color="black" />
            </Pressable>
          ),
        }} 
      />
      </Stack>
    )
}

export default function RootLayout() {
  return (
    <NotificationProvider>
      <CartProvider>
        <RootLayoutNav />
      </CartProvider>
    </NotificationProvider>
  );
}