"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  FlatList,
  Image,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { CameraView, Camera } from "expo-camera"
import { colors } from "@/constants/colors"
import { useUserStore } from "@/hooks/userStore"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import {
  checkAdminStatusAction,
  loadAdminGamesAction,
  loadScanHistoryAction,
  processQRCodeScanAction,
  validateQRCodeFormatAction,
  type ScanHistoryItem,
} from "@/app/actions/qr_scanning"
import type { Game } from "@/types/game"

export default function AdminQRScanner() {
  const { userId, isLoading: userLoading } = useUserStore()
  const router = useRouter()

  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [isGameModalVisible, setIsGameModalVisible] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      const adminStatus = await checkAdminStatusAction()
      setIsAdmin(adminStatus)

      if (adminStatus) {
        const { status } = await Camera.requestCameraPermissionsAsync()
        setHasPermission(status === "granted")
        await loadGames()
      }

      setLoading(false)
    }

    if (userId) initialize()
  }, [userId])

  const loadGames = useCallback(async () => {
    const result = await loadAdminGamesAction()
    if (!result.success) {
      Alert.alert("Error", result.error)
      return
    }
    setGames(result.data)
    if (result.data.length > 0 && !selectedGame) {
      setSelectedGame(result.data[0])
    }
  }, [selectedGame])

  const loadScanHistory = useCallback(async () => {
    if (!selectedGame) return
    const result = await loadScanHistoryAction(selectedGame.id)
    if (result.success) setScanHistory(result.data)
    else console.error("Error loading scan history:", result.error)
  }, [selectedGame])

  useEffect(() => {
    if (selectedGame) loadScanHistory()
  }, [selectedGame, loadScanHistory])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadGames(), loadScanHistory()])
    setRefreshing(false)
  }, [loadGames, loadScanHistory])

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || !selectedGame || !userId) return
    setScanned(true)
    setIsScanning(true)

    try {
      if (!validateQRCodeFormatAction(data)) {
        Alert.alert("Invalid QR Code", "The scanned QR code format is not valid.")
        setScanned(false)
        setIsScanning(false)
        return
      }

      const result = await processQRCodeScanAction(data, selectedGame, userId)

      if (!result.success) {
        Alert.alert("Scan Failed", result.message)
        setScanned(false)
        setIsScanning(false)
        return
      }

      Alert.alert("Success!", result.message, [
        {
          text: "OK",
          onPress: () => {
            setScanned(false)
            loadScanHistory()
          },
        },
      ])
    } catch (error) {
      console.error("Error processing scan:", error)
      Alert.alert("Error", "Failed to process QR code scan.")
      setScanned(false)
    } finally {
      setIsScanning(false)
    }
  }

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return "TBD"
    try {
      const [hours, minutes] = timeString.split(":")
      const date = new Date()
      date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    } catch {
      return timeString
    }
  }

  if (loading || userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="shield-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You don't have admin privileges to access this feature.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.errorText}>Camera Access Required</Text>
          <Text style={styles.errorSubtext}>Please enable camera access to scan QR codes.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />

      <Modal visible={isGameModalVisible} transparent animationType="slide" onRequestClose={() => setIsGameModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Game</Text>
              <TouchableOpacity onPress={() => setIsGameModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={games}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.gameItem, selectedGame?.id === item.id && styles.selectedGameItem]}
                  onPress={() => {
                    setSelectedGame(item)
                    setIsGameModalVisible(false)
                  }}
                >
                  <Text style={styles.gameItemTitle}>
                    {item.homeTeam?.name || "Home"} vs {item.awayTeam?.name || "Away"}
                  </Text>
                  <Text style={styles.gameItemSubtitle}>
                    {formatDate(item.date)} at {formatTime(item.time)}
                  </Text>
                  <Text style={styles.gameItemPoints}>Points: {item.points || 10}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Scan user's QR codes to award them the game points. Select a game to continue
          </Text>
        </View>
        <TouchableOpacity style={styles.gameSelector} onPress={() => setIsGameModalVisible(true)}>
          <View style={styles.gameSelectorContent}>
            <Text style={styles.gameSelectorLabel}>Selected Game</Text>
            {selectedGame ? (
              <>
                <Text style={styles.gameSelectorTitle}>
                  {selectedGame.homeTeam?.name || "Home"} vs {selectedGame.awayTeam?.name || "Away"}
                </Text>
                <Text style={styles.gameSelectorSubtitle}>
                  {formatDate(selectedGame.date)} • Points: {selectedGame.points || 10}
                </Text>
              </>
            ) : (
              <Text style={styles.gameSelectorTitle}>No game selected</Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={24} color={colors.primary} />
        </TouchableOpacity>

        {selectedGame && (
          <View style={styles.scannerContainer}>
            <LinearGradient colors={[colors.primary, colors.accent]} style={styles.scannerGradient}>
              <View style={styles.scannerWrapper}>
                <CameraView
                  style={styles.scanner}
                  facing="back"
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />
                {isScanning && (
                  <View style={styles.scanningOverlay}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.scanningText}>Processing...</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            <View style={styles.scannerControls}>
              <TouchableOpacity
                style={[styles.scanButton, scanned && styles.scanButtonActive]}
                onPress={() => setScanned(false)}
                disabled={isScanning}
              >
                <Ionicons name={scanned ? "refresh" : "scan"} size={20} color="white" />
                <Text style={styles.scanButtonText}>{scanned ? "Scan Again" : "Ready to Scan"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Scans</Text>
            {scanHistory.slice(0, 10).map((scan, index) => (
              <View key={scan.id + index} style={styles.historyItem}>
                <View style={styles.historyItemContent}>
                  <Text style={styles.historyItemName}>
                    {scan.users?.first_name} {scan.users?.last_name || ""}
                  </Text>
                  <Text style={styles.historyItemDetails}>
                    {scan.points_awarded} points • {new Date(scan.scanned_at).toLocaleTimeString()}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 3
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.1,
    zIndex: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  gameSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameSelectorContent: {
    flex: 1,
  },
  gameSelectorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  gameSelectorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  gameSelectorSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scannerContainer: {
    margin: 16,
  },
  scannerGradient: {
    borderRadius: 16,
    padding: 4,
  },
  scannerWrapper: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  scanner: {
    flex: 1,
  },
  scanningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanningText: {
    color: "white",
    fontSize: 16,
    marginTop: 12,
  },
  scannerControls: {
    marginTop: 16,
    alignItems: "center",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 28,
  },
  scanButtonActive: {
    backgroundColor: colors.success,
  },
  scanButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  historyContainer: {
    margin: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  historyItemDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom:20
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  gameItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedGameItem: {
    backgroundColor: colors.primary + "10",
  },
  gameItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  gameItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  gameItemPoints: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
})
