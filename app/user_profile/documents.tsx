import { View, Text, ScrollView, StyleSheet, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import React, { useState, useEffect } from "react"
import { useLocalSearchParams } from "expo-router"
import Feather from "@expo/vector-icons/Feather"
import { colors } from "@/constants/colors"
import { getSchoolById } from "@/app/actions/school_info"
import type { SchoolInfo } from "@/constants/all"

export default function DocumentsScreen() {
  const { type } = useLocalSearchParams()
  const [school, setSchool] = useState<SchoolInfo | null>(null)

  useEffect(() => {
      const fetchSchool = async () => {
        const schoolId = "26c7ae3b-fc69-42ce-b4fe-0af35c02c413" // Replace with real value
        const result = await getSchoolById(schoolId)
        setSchool(result)
      }
  
      fetchSchool()
    }, [])


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
                  <Text style={styles.contactValue}>{school?.contactEmail}</Text>
                </View>
              </View>
              <View style={styles.contactItem}>
                <Feather name="phone" size={20} color={colors.primary} style={styles.contactIcon} />
                <View>
                  <Text style={styles.contactLabel}>Phone Support</Text>
                  <Text style={styles.contactValue}>{school?.contactPhone}</Text>
                  <Text style={styles.contactNote}>Available during regular working hours</Text>
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              <Text style={styles.bodyText}>
                Visit our comprehensive FAQ section for quick answers to common questions about account management,
                features, and troubleshooting.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Response Time</Text>
              <Text style={styles.bodyText}>
                We typically respond to support requests within 24 hours during business days. For urgent issues, please
                call our phone support line.
              </Text>
            </View>
          </View>
        )

      case "2":
        return (
          <View style={styles.documentContainer}>
            <View style={styles.headerSection}>
              <View style={styles.iconContainer}>
                <Feather name="file-text" size={48} color={colors.primary}  />
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
              <Text style={styles.sectionTitle}>5. Modifications</Text>
              <Text style={styles.bodyText}>
                We reserve the right to modify these terms at any time. Users will be notified of significant changes
                via email or in-app notification. Continued use of the service constitutes acceptance of modified terms.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Contact Information</Text>
              <Text style={styles.bodyText}>
                If you have any questions about these Terms of Service, please contact us at {school?.contactEmail}.
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
                <Text style={styles.bulletText}>Account information (name, email address)</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Usage data and app interactions</Text>
              </View>
              <View style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>Device information for optimization</Text>
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
                {school?.contactEmail}.
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
      <Image source={require("../../IMAGES/crowd.jpg")} style={styles.backgroundImage} />
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
  documentContainer: {
  },
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
    color: "#3B82F6",
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
})
