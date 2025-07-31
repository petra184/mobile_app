"use client"

import { TeamSelector } from "@/components/teams/TEAMSELECTOR2"
import { colors } from "@/constants/Colors"
import type { Team } from "@/types/updated_types"
import { useRouter } from "expo-router"
import type React from "react"
import { useState } from "react"
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

type GenderFilter = "all" | "men" | "women"

const TeamsPage: React.FC = () => {
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<GenderFilter>("all")
  const router = useRouter()

  const handleTeamPress = (team: Team) => {
    router.push({
      pathname: "../teams",
      params: { id: team.id },
    })
  }

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>

        {/* Professional Gender Filter */}
        <View style={styles.tabContainer}>
        <TouchableOpacity
            style={[styles.tab, selectedGenderFilter === 'all' && styles.activeTab]}
            onPress={() => setSelectedGenderFilter('all')}
        >
            <Text
            style={[
                styles.tabText,
                selectedGenderFilter === 'all' && styles.activeTabText,
            ]}
            >
            All Teams
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.tab, selectedGenderFilter === 'women' && styles.activeTab]}
            onPress={() => setSelectedGenderFilter('women')}
        >
            <Text
            style={[
                styles.tabText,
                selectedGenderFilter === 'women' && styles.activeTabText,
            ]}
            >
            Women's
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.tab, selectedGenderFilter === 'men' && styles.activeTab]}
            onPress={() => setSelectedGenderFilter('men')}
        >
            <Text
            style={[
                styles.tabText,
                selectedGenderFilter === 'men' && styles.activeTabText,
            ]}
            >
            Men's
            </Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* Teams List */}
     
      <View style={styles.content}>
      <Image source={require("@/IMAGES/crowd.jpg")} style={styles.backgroundImage} />
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={{ flex: 1 }}>
        <TeamSelector
          key={selectedGenderFilter} // Force re-render when filter changes
          onTeamPress={handleTeamPress}
          showFavorites={true}
          horizontal={false}
          allowMultiSelect={false}
          filterByGender={selectedGenderFilter}
          layoutStyle="grid" // Use grid layout for all teams page
        />
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    position: "absolute",
    bottom:0,
    resizeMode: "cover",
    opacity: 0.06,
    zIndex: 0,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text + '80',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

export default TeamsPage
