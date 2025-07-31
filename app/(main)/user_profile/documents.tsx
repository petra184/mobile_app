"use client"

import { colors } from "@/constants/Colors"
import Feather from "@expo/vector-icons/Feather"
import { useLocalSearchParams } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

// FAQ data structure
const faqData = [
  {
    id: 1,
    question: "How do I earn points?",
    answer:
      "You can earn points by scanning QR codes at games, checking in at events, completing challenges, and participating in team activities. Each activity has different point values based on engagement level.",
  },
  {
    id: 2,
    question: "How do I redeem my points?",
    answer:
      "Visit the Rewards section in the app to browse available rewards. You can redeem points for merchandise, game tickets, exclusive experiences, and special offers from our partners.",
  },
  {
    id: 3,
    question: "Can I add multiple favorite teams?",
    answer:
      "Yes! You can select multiple favorite teams from different sports. Just click on the heart button in the Home page. You can also go to Profile → Manage Favorite Teams to add or remove teams.",
  },
  {
    id: 4,
    question: "How do notifications work?",
    answer:
      "You can customize your notification preferences in Account Settings. Choose from push notifications, email updates, game reminders, news updates, and special offers. You have full control over what you receive.",
  },
  {
    id: 5,
    question: "What if I can't scan a QR code?",
    answer:
      "Make sure your camera has permission and there's adequate lighting. If the QR code still won't scan, try cleaning your camera lens or ask event staff for assistance. Some codes may have time restrictions.",
  },
  {
    id: 6,
    question: "How do I change my profile information?",
    answer:
      "Go to your Profile screen and tap the edit button (pencil icon) in the top right. You can update your name, profile picture, and other personal information from there.",
  },
  {
    id: 7,
    question: "Are my points transferable?",
    answer:
      "Points are tied to your individual account and cannot be transferred to other users. However, you can use points to purchase gifts or experiences that you can share with others.",
  },
  {
    id: 8,
    question: "What happens if I delete the app?",
    answer:
      "Your account and points are safely stored on our servers. When you reinstall the app and log back in, all your data will be restored, including your points balance and favorite teams.",
  },
  {
    id: 9,
    question: "How do I report a problem?",
    answer:
      "You can contact our support team through the Help & Support section, email us directly at team@gamedayrewards.app, or use the in-app feedback feature. We typically respond within 24 hours.",
  },
  {
    id: 10,
    question: "Is my personal information secure?",
    answer:
      "Yes, we use industry-standard encryption and security measures to protect your data. We never sell your personal information to third parties. Read our Privacy Policy for complete details.",
  },
]

// FAQ Item Component - Fixed version
const FAQItem = ({ faq, isExpanded, onToggle }: { faq: any; isExpanded: boolean; onToggle: () => void }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current
  const [contentHeight, setContentHeight] = useState(0)
  const [hasBeenMeasured, setHasBeenMeasured] = useState(false)

  useEffect(() => {
    if (hasBeenMeasured) {
      Animated.timing(animatedHeight, {
        toValue: isExpanded ? contentHeight : 0,
        duration: 300,
        useNativeDriver: false,
      }).start()
    }
  }, [isExpanded, contentHeight, hasBeenMeasured])

  const handleContentLayout = (event: any) => {
    const height = event.nativeEvent.layout.height
    if (height > 0 && !hasBeenMeasured) {
      setContentHeight(height)
      setHasBeenMeasured(true)
      // If this FAQ should be expanded, animate to the measured height
      if (isExpanded) {
        animatedHeight.setValue(height)
      }
    }
  }

  return (
    <View style={styles.faqItem}>
      <Pressable style={styles.faqQuestion} onPress={onToggle}>
        <Text style={styles.faqQuestionText}>{faq.question}</Text>
        <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
      </Pressable>

      {/* Hidden content for measurement */}
      <View style={styles.hiddenContent} pointerEvents="none">
        <View onLayout={handleContentLayout} style={styles.faqAnswerContent}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      </View>

      {/* Animated visible content */}
      <Animated.View style={[styles.faqAnswerContainer, { height: animatedHeight }]}>
        <View style={styles.faqAnswerContent}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      </Animated.View>
    </View>
  )
}

export default function DocumentsScreen() {
  const { type } = useLocalSearchParams()
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  const renderContent = () => {
    switch (type) {
      case "1":
        return (
          <View style={styles.documentContainer}>
            <View style={styles.headerSection}>
              <View style={styles.iconContainer}>
                <Feather name="help-circle" size={48} color={colors.primary} />
              </View>
              <Text style={styles.title}>Help & Support</Text>
              <Text style={styles.subtitle}>We're here to help you get the most out of our app</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.contactItem}>
                <Feather name="mail" size={20} color={colors.primary} style={styles.contactIcon} />
                <View>
                  <Text style={styles.contactLabel}>Email Support</Text>
                  <Text style={styles.contactValue}>team@gamedayrewards.app</Text>
                </View>
              </View>
              <View style={styles.contactItem}>
                <Feather name="message-circle" size={20} color={colors.primary} style={styles.contactIcon} />
                <View>
                  <Text style={styles.contactLabel}>In-App Support</Text>
                  <Text style={styles.contactValue}>Settings → Help & Support</Text>
                </View>
              </View>
            </View>

            {/* FAQ Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              <Text style={styles.bodyText}>
                Find quick answers to common questions below. Tap any question to expand the answer.
              </Text>

              <View style={styles.faqContainer}>
                {faqData.map((faq) => (
                  <FAQItem
                    key={faq.id}
                    faq={faq}
                    isExpanded={expandedFAQ === faq.id}
                    onToggle={() => toggleFAQ(faq.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Response Time</Text>
              <Text style={styles.bodyText}>
                We typically respond to support requests within 24 hours during business days. For urgent issues, please
                email us directly at team@gamedayrewards.app.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Still Need Help?</Text>
              <Text style={styles.bodyText}>
                If you can't find the answer you're looking for in our FAQ, don't hesitate to reach out to our support
                team. We're always happy to help and improve our service based on your feedback.
              </Text>
            </View>
          </View>
        )

      case "2":
        return (
          <View style={styles.documentContainer}>
            <View style={styles.headerSection}>
              <View style={styles.iconContainer}>
                <Feather name="file-text" size={48} color={colors.primary} />
              </View>
              <Text style={styles.title}>Terms of Service</Text>
              <Text style={styles.subtitle}>Last updated: January 1, 2024</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.bodyText}>
                By accessing and using this application, you accept and agree to be bound by the terms and provision of
                this agreement. If you do not agree to abide by the above, please do not use this service.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Age Requirement</Text>
              <Text style={styles.bodyText}>
                You must be at least 13 years of age to use this service. Users under 18 must have parental consent to
                use this application.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
              <Text style={styles.bodyText}>
                Users are responsible for maintaining the confidentiality of their account information and for all
                activities that occur under their account. You agree to notify us immediately of any unauthorized use of
                your account.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Prohibited Activities</Text>
              <Text style={styles.bodyText}>
                Users may not use this service for any unlawful purpose or to solicit others to perform unlawful acts.
                Users may not transmit any content that is offensive, harmful, or violates any laws or regulations.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Points and Rewards</Text>
              <Text style={styles.bodyText}>
                Points earned through the app have no cash value and cannot be transferred between accounts. We reserve
                the right to modify point values, rewards, or terminate accounts that violate our terms. Points may
                expire after periods of inactivity as specified in the app.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Modifications</Text>
              <Text style={styles.bodyText}>
                We reserve the right to modify these terms at any time. Users will be notified of significant changes
                via email or in-app notification. Continued use of the service constitutes acceptance of modified terms.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Contact Information</Text>
              <Text style={styles.bodyText}>
                If you have any questions about these Terms of Service, please contact us at team@gamedayrewards.app.
              </Text>
            </View>
          </View>
        )

      case "3":
        return (
          <View style={styles.documentContainer}>
            <View style={styles.headerSection}>
              <View style={styles.iconContainer}>
                <Feather name="shield" size={48} color={colors.primary} />
              </View>
              <Text style={styles.title}>Privacy Policy</Text>
              <Text style={styles.subtitle}>Last updated: January 1, 2024</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Our Commitment to Privacy</Text>
              <Text style={styles.bodyText}>
                We are committed to protecting your privacy and ensuring the security of your personal information. This
                Privacy Policy explains how we collect, use, and safeguard your data.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Information We Collect</Text>
              <Text style={styles.bodyText}>
                We collect only the information necessary to provide and improve our services:
              </Text>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Account information (name, email address, profile picture)</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Usage data and app interactions</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Device information for optimization</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Location data when scanning QR codes at events</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How We Use Your Information</Text>
              <Text style={styles.bodyText}>
                Your information is used to provide, maintain, and improve our services. We never sell your personal
                data to third parties. We may use aggregated, anonymized data for analytics and service improvement.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Security</Text>
              <Text style={styles.bodyText}>
                We implement industry-standard security measures to protect your data, including encryption, secure
                servers, and regular security audits. While no system is 100% secure, we continuously work to enhance
                our security practices.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Rights</Text>
              <Text style={styles.bodyText}>
                You have the right to access, update, or delete your personal information at any time. You can also opt
                out of certain data collection practices through your account settings.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <Text style={styles.bodyText}>
                If you have questions about this Privacy Policy or our data practices, please contact us at
                team@gamedayrewards.app
              </Text>
            </View>
          </View>
        )

      default:
        return (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Document Not Found</Text>
            <Text style={styles.errorText}>The requested document could not be found.</Text>
          </View>
        )
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <Image source={require("../../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    resizeMode: "cover",
    opacity: 0.05,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  documentContainer: {},
  headerSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    lineHeight: 28,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
    fontWeight: "400",
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    paddingVertical: 8,
  },
  contactIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
    marginBottom: 2,
  },
  contactNote: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "bold",
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  // FAQ Styles - Fixed
  faqContainer: {
    marginTop: 16,
  },
  faqItem: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  // Hidden content for measurement
  hiddenContent: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
  faqAnswerContainer: {
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  faqAnswerContent: {
    padding: 16,
    paddingTop: 8,
  },
  faqAnswerText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
  },
})