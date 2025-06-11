import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'; 
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NotificationProvider } from "@/context/notification-context"
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function TabLayout() {
  const router = useRouter();
  
  const navigateToProfile = () => {
    router.push('../user_profile');
  };
  
  return (
    <GestureHandlerRootView>
    <NotificationProvider>
    <Tabs
      screenOptions={{
        headerTransparent: true,
        headerTitleAlign: "center",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          ...Platform.select({
            ios: {
              height: 80,
            },
            android: {
              height: 65,
            },
            }),
        },
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 3,
          shadowColor: "black",
          shadowOffset: { width: 0, height: 2 },
          ...Platform.select({
            ios: {
              shadowOpacity: 0.1,
              shadowRadius: 4,
              height: 100,
            },
            android: {
              elevation: 3,
            },
          }),
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          paddingTop: 3,
           ...Platform.select({
              ios: {
              marginTop: 4,
              }
              }),
        },
        headerRight: () => (
          <Pressable 
            onPress={navigateToProfile}
            style={{ marginRight: 16 }}
          >
            <Feather name="user" size={24} color={colors.primary} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <AntDesign name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="qr_code"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="qrcode-scan" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <AntDesign name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Team Store',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="storefront" size={24} color={color} />,
        }}
      />
    </Tabs>
    </NotificationProvider>
    </GestureHandlerRootView>
  );
}