"use client"

import { useState, useLayoutEffect, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Image } from "expo-image"
import { useNavigation } from "expo-router"
import { Feather } from "@expo/vector-icons"
import { getBirthdayPackages } from "@/app/actions/birthdays"
import { getFAQsForMobile, submitBirthdayContactMessage, type FAQ } from "@/app/actions/birthdays"
import PackageCard from "@/components/rewards/PackageCard"
import ReservationForm from "@/components/rewards/ReservationForm"
import { colors } from "@/constants/colors"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useUserStore } from "@/hooks/userStore"
import { useNotifications } from "@/context/notification-context"
import { getSchoolById } from "@/app/actions/school_info"
import type { SchoolInfo, BirthdayPackage } from "@/types/updated_types"

const { width, height } = Dimensions.get("window")
const HERO_HEIGHT = 260

const TABS = [
  { id: "packages", label: "Packages", iconName: "gift" },
  { id: "contact", label: "Contact", iconName: "mail" },
  { id: "faq", label: "FAQ", iconName: "help-circle" },
]

export default function BirthdaysScreen() {
  const router = useRouter()
  const { getUserName, userEmail, first_name, last_name, userId } = useUserStore()
  const { showSuccess, showError, showInfo } = useNotifications()
  const [school, setSchool] = useState<SchoolInfo | null>(null)

  useEffect(() => {
    const fetchSchool = async () => {
      const schoolId = "26c7ae3b-fc69-42ce-b4fe-0af35c02c413" // Replace with real value
      const result = await getSchoolById(schoolId)
      setSchool(result)
    }
    fetchSchool()
  }, [])

  // Supabase data state
  const [packages, setPackages] = useState<BirthdayPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [faqsLoading, setFaqsLoading] = useState(true)
  const [faqsError, setFaqsError] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  // Existing state
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("packages")
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)

  const navigation = useNavigation()
  const scrollViewRef = useRef<ScrollView>(null)

  // Animation values
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current
  const tabIndicatorWidth = width / TABS.length

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId)

  // Data fetching - now fetches from ALL teams with active packages only
  useEffect(() => {
    fetchPackages()
    fetchFAQs()
  }, [])

  // Add useEffect to prefill contact form with user data
  useEffect(() => {
    const userName = getUserName()
    const email = userEmail || ""
    if (userName !== "User" || email) {
      setContactForm((prev) => ({
        ...prev,
        name: userName !== "User" ? userName : prev.name,
        email: email || prev.email,
      }))
    }
  }, [getUserName, userEmail, first_name, last_name])

  const fetchPackages = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      // Fetch all active birthday packages from ALL teams
      const result = await getBirthdayPackages({ is_active: true })
      if (result.error) {
        console.error("❌ Error from getBirthdayPackages:", result.error)
        setError(result.error)
      } else {
        setPackages(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load packages"
      setError(errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchFAQs = async () => {
    setFaqsLoading(true)
    setFaqsError(null)
    try {
      const result = await getFAQsForMobile()
      if (result.error) {
        console.error("❌ Error from getFAQsForMobile:", result.error)
        setFaqsError(result.error)
      } else {
        setFaqs(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load FAQs"
      console.error("❌ Exception in fetchFAQs:", errorMessage)
      setFaqsError(errorMessage)
    } finally {
      setFaqsLoading(false)
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
  }

  const navigateToStore = () => {
    router.push("..")
  }

  const handleTabChange = (tab: string) => {
    // Find the index of the selected tab
    const tabIndex = TABS.findIndex((t) => t.id === tab)
    // Animate the indicator to the new position
    Animated.spring(tabIndicatorPosition, {
      toValue: tabIndex * tabIndicatorWidth,
      tension: 300,
      friction: 30,
      useNativeDriver: true,
    }).start()
    setActiveTab(tab)
    // Scroll to top when changing tabs
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true })
    }
  }

  const handleContactSubmit = async () => {
    // Validate form
    if (!contactForm.name.trim()) {
      showError("Validation Error", "Please enter your name.")
      return
    }

    if (!contactForm.email.trim()) {
      showError("Validation Error", "Please enter your email address.")
      return
    }

    if (!contactForm.message.trim()) {
      showError("Validation Error", "Please enter a message.")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactForm.email)) {
      showError("Validation Error", "Please enter a valid email address.")
      return
    }

    setIsSubmittingContact(true)

    try {
      const result = await submitBirthdayContactMessage({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim() || undefined,
        message: contactForm.message.trim(),
        user_id: userId || undefined,
      })

      if (result.success) {
        showSuccess("Message Sent!", "Thank you for your message! Our team will get back to you within 24 hours.")

        // Reset form but keep user info prefilled
        const userName = getUserName()
        const email = userEmail || ""
        setContactForm({
          name: userName !== "User" ? userName : "",
          email: email,
          phone: "",
          message: "",
        })
      } else {
        showError("Failed to Send", result.error || "Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting contact form:", error)
      showError("Network Error", "Unable to send message. Please check your connection and try again.")
    } finally {
      setIsSubmittingContact(false)
    }
  }

  const toggleFaqExpansion = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId)
  }

  const retryFetchFAQs = () => {
    fetchFAQs()
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} contentFit="cover" />
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
            }}
            style={styles.heroImage}
            contentFit="cover"
          />
          {/* White gradient overlay at the top */}
          <LinearGradient
            colors={[colors.background, "rgba(249, 250, 251, 0.68)", "rgba(249, 250, 251, 0)"]}
            style={styles.topGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Dark overlay at the bottom */}
          <View style={styles.heroOverlay} />
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={navigateToStore} activeOpacity={0.7}>
            <Feather name="chevron-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Celebrate your Birthday with us!</Text>
            <Text style={styles.heroSubtitle}>
              Make your special day unforgettable with our university sports-themed birthday packages from all teams!
            </Text>
          </View>
        </View>

        {/* New Professional Tab Navigation */}
        <View style={styles.newTabContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.newTab}
                onPress={() => handleTabChange(tab.id)}
                activeOpacity={0.7}
              >
                <Feather
                  name={tab.iconName as any}
                  size={20}
                  color={isActive ? colors.primary : colors.textSecondary}
                  style={styles.tabIcon}
                />
                <Text style={[styles.newTabText, isActive && styles.newTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            )
          })}
          {/* Animated indicator line */}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [{ translateX: tabIndicatorPosition }],
                width: tabIndicatorWidth,
              },
            ]}
          />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          {/* Tab Content */}
          {activeTab === "packages" && (
            <View>
              <View style={styles.tabContentContainer2}>
                <Text style={styles.sectionTitle}>Birthday Packages</Text>
                <Text style={styles.sectionSubtitle}>
                  {packages.length > 0 ? `${packages.length} packages available` : "Loading packages..."}
                </Text>
              </View>
              {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading packages from all teams...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorTitle}>Something went wrong</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => fetchPackages()}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : packages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No Packages Available</Text>
                  <Text style={styles.emptyText}>
                    There are currently no birthday packages available from any team.
                  </Text>
                </View>
              ) : (
                <View style={styles.packagesList}>
                  {packages.map((pkg) => (
                    <View key={pkg.id}>
                      <PackageCard package={pkg} onSelect={handlePackageSelect} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === "contact" && (
            <View style={styles.tabContentContainer}>
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <View style={styles.contactCard}>
                <Text style={styles.contactCardTitle}>Have questions or want to book a birthday package?</Text>
                <Text style={styles.contactCardSubtitle}>
                  Fill out the form below and our team will get back to you within 24 hours.
                </Text>
                <View style={styles.formGroup}>
                  <View style={styles.inputIcon}>
                    <Feather name="user" size={18} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor="grey"
                    value={contactForm.name}
                    onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                    editable={!isSubmittingContact}
                  />
                </View>
                <View style={styles.formGroup}>
                  <View style={styles.inputIcon}>
                    <Feather name="mail" size={18} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="grey"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={contactForm.email}
                    onChangeText={(text) => setContactForm({ ...contactForm, email: text })}
                    editable={!isSubmittingContact}
                  />
                </View>
                <View style={styles.formGroup}>
                  <View style={styles.inputIcon}>
                    <Feather name="phone" size={18} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number (Optional)"
                    placeholderTextColor="grey"
                    keyboardType="phone-pad"
                    value={contactForm.phone}
                    onChangeText={(text) => setContactForm({ ...contactForm, phone: text })}
                    editable={!isSubmittingContact}
                  />
                </View>
                <View style={styles.formGroup}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Your Message"
                    placeholderTextColor="grey"
                    multiline
                    numberOfLines={4}
                    value={contactForm.message}
                    onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
                    editable={!isSubmittingContact}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmittingContact && styles.submitButtonDisabled]}
                  onPress={handleContactSubmit}
                  activeOpacity={0.8}
                  disabled={isSubmittingContact}
                >
                  {isSubmittingContact ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>Sending...</Text>
                    </>
                  ) : (
                    <>
                      <Feather name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>Send Message</Text>
                    </>
                  )}
                </TouchableOpacity>
                <View style={styles.contactInfoContainer}>
                  <Text style={styles.contactInfoTitle}>Or reach us directly:</Text>
                  <View style={styles.contactInfoItem}>
                    <Feather name="phone" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.contactInfoText}>{school?.contactPhone || "Contact phone not available"}</Text>
                  </View>
                  <View style={styles.contactInfoItem}>
                    <Feather name="mail" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.contactInfoText}>{school?.contactEmail || "Contact email not available"}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "faq" && (
            <View style={styles.tabContentContainer}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              {faqsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading FAQs...</Text>
                </View>
              ) : faqsError ? (
                <View style={styles.errorContainer}>
                  <Feather
                    name="alert-circle"
                    size={48}
                    color={colors.error || "#EF4444"}
                    style={{ marginBottom: 16 }}
                  />
                  <Text style={styles.errorTitle}>Failed to Load FAQs</Text>
                  <Text style={styles.errorText}>{faqsError}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={retryFetchFAQs}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : faqs.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="help-circle" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyTitle}>No FAQs Available</Text>
                  <Text style={styles.emptyText}>
                    We're working on adding frequently asked questions. Please check back later or contact us directly.
                  </Text>
                </View>
              ) : (
                <View style={styles.faqContainer}>
                  {faqs.map((faq) => {
                    const isExpanded = expandedFaq === faq.id
                    return (
                      <TouchableOpacity
                        key={faq.id}
                        style={styles.faqItem}
                        onPress={() => toggleFaqExpansion(faq.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.faqHeader}>
                          <View style={styles.faqQuestionContainer}>
                            <Feather name="help-circle" size={20} color={colors.primary} style={styles.faqIcon} />
                            <Text style={styles.faqQuestion}>{faq.faq_title}</Text>
                          </View>
                          <Feather
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={colors.textSecondary}
                          />
                        </View>
                        {isExpanded && (
                          <View style={styles.faqAnswerContainer}>
                            <Text style={styles.faqAnswer}>{faq.faq_response}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}
            </View>
          )}

          {/* Add some padding at the bottom */}
          <View style={{ height: 40 }} />
        </KeyboardAvoidingView>

        {/* Reservation Modal */}
        {selectedPackage && (
          <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal} transparent={true}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <ReservationForm selectedPackage={selectedPackage} onClose={closeModal} />
              </View>
            </View>
          </Modal>
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
  scrollContent: {},
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    width: width,
    height: height / 2,
    opacity: 0.05,
    zIndex: -1,
  },
  ee: {
    padding: 16,
  },
  hero: {
    width: "100%",
    height: HERO_HEIGHT,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "110%",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 0 : 10,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 20,
  },
  // New professional tab styles
  newTabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    position: "relative",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 20,
  },
  newTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
  },
  tabIcon: {
    marginBottom: 4,
  },
  newTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  newTabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  // Tab content container
  tabContentContainer: {
    padding: 16,
  },
  tabContentContainer2: {
    padding: 16,
  },
  // Section header
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 14,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Loading, error, and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.error || "#EF4444",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  // Rest of the styles
  packagesList: {
    marginTop: 8,
  },
  testimonialCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testimonialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  testimonialInitials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  testimonialIconContainer: {
    marginLeft: "auto",
  },
  ratingContainer: {
    flexDirection: "row",
  },
  testimonialText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  // FAQ Styles
  faqContainer: {
    marginTop: 8,
  },
  faqItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  faqIcon: {
    marginRight: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  faqAnswerContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  faqTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    height: "70%",
    overflow: "hidden",
  },
  // Contact form styles
  contactCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  contactCardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: 12,
    zIndex: 1,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 38,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  contactInfoContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
  },
  contactInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  contactInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
})
