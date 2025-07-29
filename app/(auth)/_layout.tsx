import { Stack } from "expo-router";
import { colors } from "@/constants/colors";
import { NotificationProvider } from "@/context/notification-context";

export default function AuthLayout() {
  return (
    <NotificationProvider>
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Manhattan University",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: "Create Account",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot_password"
        options={{
          title: "Forgot Password",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reset_password"
        options={{
          title: "Reset Password",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="confirm_signup"
        options={{
          title: "Manhattan University",
          headerShown: false,
        }}
      />
    </Stack>
    </NotificationProvider>
  );
}