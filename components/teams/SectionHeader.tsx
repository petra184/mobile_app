import { colors } from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import AntDesign from '@expo/vector-icons/AntDesign';
import type React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SectionHeaderProps {
  title: string
  icon?: "user" | "award" | "info" | "chart" | "share"
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon }) => {
  const renderIcon = () => {
    switch (icon) {
      case "user":
        return <Feather name="user" size={18} color={colors.primary} />
      case "award":
        return <Feather name="award" size={18} color={colors.primary} />
      case "info":
        return <Feather name="info" size={18} color={colors.primary} />
      case "chart":
        return <AntDesign name="barschart" size={18} color={colors.primary} />
      case "share":
        return <Feather name="share-2" size={18} color={colors.primary} />
      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{renderIcon()}</View>}
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
})

export default SectionHeader
