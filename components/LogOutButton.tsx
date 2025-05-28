import { TouchableOpacity, Text } from 'react-native';
import { useUserStore } from '@/hooks/userStore';
import { useNotifications } from '@/context/notification-context';
import { useRouter } from 'expo-router';

export function LogoutButton() {
  const { clearUserData } = useUserStore();
  const { showSuccess } = useNotifications();
  const router = useRouter();
  
  const handleLogout = () => {
    clearUserData();
    showSuccess("Logged Out", "You have been successfully logged out");
    router.push("/");
  };
  
  return (
    <TouchableOpacity onPress={handleLogout}>
      <Text>Logout</Text>
    </TouchableOpacity>
  );
}