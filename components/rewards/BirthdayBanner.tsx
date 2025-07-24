import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function BirthdayBanner() {
  const router = useRouter();

  const navigateToBirthdays = () => {
    router.navigate("/(main)/store/CelebrateBirthday");
  };

  return (
    <View style={styles.shadowWrapper}>
    <TouchableOpacity 
      style={styles.container}
      onPress={navigateToBirthdays}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" }} 
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Birthday Packages</Text>
          <Text style={styles.subtitle}>Celebrate with your favorite team!</Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <Feather name="chevron-right" size={24} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    height: 145,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  shadowWrapper: {
    width: width - 32,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#fff", // Required for iOS shadows
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, // Android
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});