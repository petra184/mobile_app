import React, { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/constants/colors';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long.');
      return;

    // Simulate password update (replace this with actual API call)
    Alert.alert('Success', 'Password updated successfully!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };
}
  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../IMAGES/crowd.jpg')} // Replace with your actual background image
        style={styles.backgroundImage}
      />
      <Text style={styles.title}>Change Password</Text>

      {/* Old Password */}
      <Text style={styles.label}>Old Password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter old password"
          placeholderTextColor="#888"
          secureTextEntry={!showOldPassword}
          value={oldPassword}
          onChangeText={setOldPassword}
        />
        <Pressable onPress={() => setShowOldPassword(!showOldPassword)} style={styles.icon}>
          {showOldPassword ? <Ionicons name="eye-outline" size={20} color="#666" /> : <Ionicons name="eye-off-outline" size={20} color="#666" />}
        </Pressable>
      </View>

      {/* New Password */}
      <Text style={styles.label}>New Password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor="#888"
          secureTextEntry={!showNewPassword}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.icon}>
          {showNewPassword ? <Ionicons name="eye-off-outline" size={20} color="#666" /> : <Ionicons name="eye-outline" size={20} color="#666" />}
        </Pressable>
      </View>

      {/* Save Button */}
      <Pressable style={styles.saveButton} onPress={handleChangePassword}>
        <Text style={styles.saveButtonText}>Save Password</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    resizeMode: 'cover',
    opacity: 0.1,
    zIndex: 0,
  },
  title: {
    textAlign: 'center',
    marginBottom: "20%",
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#000',
  },
  icon: {
    padding: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 14,
    borderRadius: 50,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
