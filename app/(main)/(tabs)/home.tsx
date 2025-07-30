import { View, Text, ActivityIndicator } from "react-native"
import { useVersionControl } from "@/version_control/hooks/useVS"
import SyncStatusBar from "@/version_control/statusBar"
import TeamsScreen from "@/version_control/components/teamsScreen"

export default function App() {
  const { isInitialized, initError, syncStatus } = useVersionControl()

  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red", textAlign: "center", margin: 20 }}>
          Failed to initialize offline data: {initError}
        </Text>
      </View>
    )
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 20 }}>Setting up offline data...</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBar syncStatus={syncStatus} />
      <TeamsScreen/>
    </View>
  )
}
