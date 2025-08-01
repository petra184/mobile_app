"use client"

import { colors } from "@/constants/Colors"
import { useUserStore } from "@/hooks/userStore"
import {
  checkAdminStatusAction,
  loadAdminGamesAction,
  loadScanHistoryAction,
  processQRCodeScanAction,
  validateQRCodeFormatAction,
} from "@/lib/actions/qr_scanning"
import type { Game, ScanHistoryItem } from "@/types/updated_types"
import Ionicons from "@expo/vector-icons/Ionicons"
import { Camera, CameraView } from "expo-camera"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// Custom notification component
const ScanNotification = ({
  visible,
  message,
  type,
  onDismiss,
}: {
  visible: boolean
  message: string
  type: "success" | "error" | "warning"
  onDismiss: () => void
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#10B981"
      case "error":
        return "#EF4444"
      case "warning":
        return "#F59E0B"
      default:
        return "#6B7280"
    }
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return "checkmark-circle"
      case "error":
        return "close-circle"
      case "warning":
        return "warning"
      default:
        return "information-circle"
    }
  }

  if (!visible) return null

  return (
    <View style={styles.notificationOverlay}>
      <View style={[styles.notificationContainer, { backgroundColor: getBackgroundColor() }]}>
        <Ionicons name={getIcon()} size={24} color="white" />
        <Text style={styles.notificationText}>{message}</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.notificationCloseButton}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

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

  // Notification state
  const [notification, setNotification] = useState<{
    visible: boolean
    message: string
    type: "success" | "error" | "warning"
  }>({
    visible: false,
    message: "",
    type: "success",
  })

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
        showNotification(result.error || "An unknown error occurred", "error")
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

  // Show notification function
  const showNotification = (message: string, type: "success" | "error" | "warning") => {
    setNotification({
      visible: true,
      message,
      type,
    })

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }))
    }, 4000)
  }

  // Dismiss notification function
  const dismissNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }))
  }

  // Reset scanner state
  const resetScanner = () => {
    setScanned(false)
    setIsScanning(false)
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || !selectedGame || !userId || isScanning) return

    console.log("📱 QR Code scanned:", data)
    setScanned(true)
    setIsScanning(true)

    try {
      // Validate QR code format first
      if (!validateQRCodeFormatAction(data)) {
        console.log("❌ Invalid QR code format")
        showNotification("Invalid QR code format. Please scan a valid game QR code.", "error")
        resetScanner()
        return
      }

      // Process the QR code scan
      const result = await processQRCodeScanAction(data, selectedGame, userId)

      if (!result.success) {
        console.log("❌ Scan failed:", result.message)

        // Handle different types of scan failures with appropriate messages
        if (
          result.message.toLowerCase().includes("already scanned") ||
          result.message.toLowerCase().includes("duplicate")
        ) {
          showNotification("This QR code has already been scanned for this game.", "warning")
        } else if (
          result.message.toLowerCase().includes("not found") ||
          result.message.toLowerCase().includes("invalid")
        ) {
          showNotification("QR code not found or invalid for this game.", "error")
        } else if (result.message.toLowerCase().includes("expired")) {
          showNotification("This QR code has expired and is no longer valid.", "warning")
        } else {
          showNotification(result.message || "Scan failed. Please try again.", "error")
        }

        resetScanner()
        return
      }

      // Success case
      console.log("✅ Scan successful:", result.message)
      showNotification(result.message || "QR code scanned successfully!", "success")

      // Refresh scan history after successful scan
      await loadScanHistory()
      resetScanner()
    } catch (error) {
      console.error("❌ Error processing scan:", error)
      showNotification("Failed to process QR code scan. Please try again.", "error")
      resetScanner()
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

      {/* Custom Notification */}
      <ScanNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onDismiss={dismissNotification}
      />

      {/* Only show modal if there are games available */}
      {games.length > 0 && (
        <Modal
          visible={isGameModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsGameModalVisible(false)}
        >
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
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            {games.length > 0 ? "Scan user's QR codes to award them the game points. Select a game to continue." : ""}
          </Text>
        </View>

        {/* Show game selector only if games are available */}
        {games.length > 0 ? (
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
        ) : (
          /* No games available message */
          <View style={styles.noGamesContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.noGamesTitle}>No Upcoming Games</Text>
            <Text style={styles.noGamesSubtitle}>
              There are currently no games scheduled for QR code scanning. Check back later or contact your
              administrator.
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
              <Text style={styles.refreshButtonText}>Refresh Games</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scanner - only show if game is selected */}
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
                onPress={resetScanner}
                disabled={isScanning}
              >
                <Ionicons name={scanned ? "refresh" : "scan"} size={20} color="white" />
                <Text style={styles.scanButtonText}>{scanned ? "Scan Again" : "Ready to Scan"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent scans history */}
        {scanHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Scans</Text>
              <Text style={styles.historySubtitle}>Last 10 scans for this game</Text>
            </View>
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
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
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
  noGamesContainer: {
    alignItems: "center",
    margin: 16,
    padding: 32,
  },
  noGamesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noGamesSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 6,
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
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
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
    paddingBottom: 20,
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
  // Notification styles
  notificationOverlay: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationText: {
    flex: 1,
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
    marginRight: 8,
  },
  notificationCloseButton: {
    padding: 4,
  },
})
