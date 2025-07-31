import { colors } from "@/constants/Colors";
import { StyleSheet, Text, View } from "react-native";

type InfoItemProps = {
  label: string;
  value: string | number;
};

export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "gray",
  },
  label: {
    fontSize: 14,
    color: colors.primary,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "gray",
  },
});