// import { useState, useEffect } from "react"
// import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image, ScrollView, Platform } from "react-native"
// import { useRouter } from "expo-router"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { colors } from "@/constants/colors"
// import { User, ArrowLeft, Pencil } from "lucide-react-native"
// import * as ImagePicker from "expo-image-picker"
// function capitalize(name: string) {
//   return name
//     .toLowerCase() // Ensure the rest of the letters are lowercase
//     .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
// }

// export default function EditProfileScreen() {
//   const router = useRouter()
//   const [first_name, setFirstName] = useState("")
//   const [last_name, setLastName] = useState("")
//   const [username, setUsername] = useState("")
//   const [profileImage, setProfileImage] = useState<string | null>(null)
//   const [phone, setPhone] = useState("")
//   const [birthday, setBirthday] = useState("")

//   useEffect(() => {
//     async function fetchData() {
//       const data = await getCurrentUser()
//       if (!data) return

//       setFirstName(capitalize(data.first_name) || "")
//       setLastName(capitalize(data.last_name) || "")
//       setUsername(data.username || "")
//       setPhone(data.phone_number || "")
//       setBirthday(data.birthday || "")
//     }

//     fetchData()
//   }, [])

//   // Function to handle image selection
//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.All, // Correct way to use mediaTypes
//       allowsEditing: true,
//       quality: 1,
//       aspect: [1, 1], // Square crop
//     })

//     if (!result.canceled) {
//       setProfileImage(result.assets[0].uri) // Update profile image state
//     }
//   }

//   const handleSave = () => {
//     // Validate inputs
//     if (!first_name.trim() || !last_name.trim()) {
//       Alert.alert("Error", "First and Last name cannot be empty")
//       return
//     }

//     if (!username.trim()) {
//       Alert.alert("Error", "Username cannot be empty")
//       return
//     }

//     Alert.alert("Success", "Profile updated successfully", [{ text: "OK", onPress: () => router.back() }])
//   }

//   return (
//     <>
//       <SafeAreaView style={styles.container} edges={["bottom"]}>
//         {/* Back Button */}
//         <Pressable onPress={() => router.back()} style={styles.backButton}>
//           <ArrowLeft size={24} color="#035e32" />
//         </Pressable>

//         <Image source={require("../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />

//         <ScrollView showsVerticalScrollIndicator={false}>
//           {/* Profile Image Section */}
//           <View style={styles.profileImageSection}>
//             <View style={styles.profileImageContainer}>
//               {profileImage ? (
//                 <Image source={{ uri: profileImage }} style={styles.profileImage} />
//               ) : (
//                 <User size={60} color={colors.primary} />
//               )}

//               {/* Circular Edit (Pencil) Button */}
//               <Pressable style={styles.editPhotoButton} onPress={pickImage}>
//                 <Pencil size={16} color="white" />
//               </Pressable>
//             </View>
//           </View>

//           {/* Form */}
//           <View style={styles.formContainer}>
//             {/* First & Last Name in One Row */}
//             <View style={styles.row}>
//               <View style={[styles.inputGroup, styles.halfWidth]}>
//                 <Text style={styles.label}>First Name</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={first_name}
//                   onChangeText={(text) => setFirstName(capitalize(text))}
//                   placeholder="Enter first name"
//                   placeholderTextColor={colors.textSecondary}
//                 />
//               </View>

//               <View style={[styles.inputGroup, styles.halfWidth]}>
//                 <Text style={styles.label}>Last Name</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={last_name}
//                   onChangeText={(text) => setLastName(capitalize(text))}
//                   placeholder="Enter last name"
//                   placeholderTextColor={colors.textSecondary}
//                 />
//               </View>
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Username</Text>
//               <TextInput
//                 style={styles.input}
//                 value={username}
//                 onChangeText={(text) => setUsername(text)}
//                 placeholder={username}
//                 placeholderTextColor={colors.textSecondary}
//                 keyboardType="numeric"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Phone Number</Text>
//               <TextInput
//                 style={styles.input}
//                 value={phone}
//                 onChangeText={(text) => setPhone(text)}
//                 placeholder="Enter phone number"
//                 placeholderTextColor={colors.textSecondary}
//                 keyboardType="phone-pad"
//               />
//             </View>

//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Birthday</Text>
//               <TextInput
//                 style={styles.input}
//                 value={birthday}
//                 onChangeText={(text) => setBirthday(text)}
//                 placeholder="MM/DD/YYYY"
//                 placeholderTextColor={colors.textSecondary}
//                 keyboardType="numeric"
//               />
//             </View>
//           </View>

//           {/* Save Button */}
//           <Pressable style={styles.saveButton} onPress={handleSave}>
//             <Text style={styles.saveButtonText}>Save Changes</Text>
//           </Pressable>
//         </ScrollView>
//       </SafeAreaView>
//     </>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//     top: 0,
//   },
//   backButton: {
//     position: "absolute",
//     left: 16,
//     ...Platform.select({
//       ios: {
//         marginTop: 18,
//       },
//     }),
//     top: "5%",
//     transform: [{ translateY: -12 }], // Center the button
//     zIndex: 10, // Ensure it's above other elements
//   },
//   backgroundImage: {
//     position: "absolute",
//     bottom: 0,
//     resizeMode: "cover",
//     opacity: 0.1,
//     zIndex: 0,
//   },
//   profileImageSection: {
//     alignItems: "center",
//     padding: 24,
//     ...Platform.select({
//       ios: {
//         paddingTop: 75,
//       },
//       android: {
//         paddingTop: 55,
//       },
//     }),
//     backgroundColor: colors.card,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   profileImageContainer: {
//     width: 110,
//     height: 110,
//     borderRadius: 60,
//     backgroundColor: "rgba(59, 130, 246, 0.1)",
//     alignItems: "center",
//     justifyContent: "center",
//     position: "relative",
//   },
//   profileImage: {
//     width: "100%",
//     height: "100%",
//     borderRadius: 50,
//   },
//   editPhotoButton: {
//     position: "absolute",
//     bottom: 0,
//     right: 0,
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: colors.primary,
//     alignItems: "center",
//     justifyContent: "center",
//     elevation: 3, // Android shadow
//     shadowColor: "#000", // iOS shadow
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   formContainer: {
//     padding: 16,
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   halfWidth: {
//     width: "48%", // Keeps some space between the two fields
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: colors.text,
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: colors.card,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: colors.text,
//   },
//   saveButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: colors.primary,
//     marginHorizontal: 16,
//     marginVertical: 24,
//     paddingVertical: 14,
//     borderRadius: 50,
//   },
//   saveButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#FFFFFF",
//   },
// })

