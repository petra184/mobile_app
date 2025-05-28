import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { 
  Home, 
  QrCode, 
  Newspaper, 
  Calendar, 
  Award,
  User,
  Store
} from 'lucide-react-native';
import { NotificationProvider } from "@/context/notification-context"

export default function TabLayout() {
  const router = useRouter();
  
  const navigateToProfile = () => {
    router.push('../user_profile');
  };
  
  return (
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
              height: 85,
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
            <User size={24} color={colors.primary} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="qr-scanner"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ color, size }) => <QrCode size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => <Newspaper size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Team Store',
          tabBarIcon: ({ color, size }) => <Store size={size} color={color} />,
        }}
      />
    </Tabs>
    </NotificationProvider>
  );
}