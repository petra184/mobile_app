"use client"

import { useState, useEffect } from "react"
import { ActivityIndicator, View, StyleSheet } from "react-native"
import Feather from "@expo/vector-icons/Feather"
import { colors } from "@/constants/colors"
import {Image} from "expo-image"

interface ProfileImageWithFallbackProps {
  imageUrl: string | null
  size?: number
  isLoading?: boolean
  onError?: (error: any) => void
  onLoad?: () => void
}

export default function ProfileImageWithFallback({
  imageUrl,
  size = 80,
  isLoading = false,
  onError,
  onLoad,
}: ProfileImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(false)

  // Reset error state when imageUrl changes
  useEffect(() => {
    setHasError(false)
    if (imageUrl) {
      setIsImageLoading(true)
    }
  }, [imageUrl])

  const handleImageError = (error: any) => {
    console.error("Profile image error:", error.nativeEvent?.error || "Unknown error")
    setHasError(true)
    setIsImageLoading(false)
    onError?.(error)
  }

  const handleImageLoad = () => {
    setIsImageLoading(false)
    setHasError(false)
    onLoad?.()
  }

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  }

  const imageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  }

  if (isLoading) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  if (!imageUrl || hasError) {
    return (
      <View style={containerStyle}>
        <Feather name="user" size={size * 0.75} color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={containerStyle}>
      {isImageLoading && (
        <View style={[StyleSheet.absoluteFill, containerStyle]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
     <Image
        source={{ uri: imageUrl }}
        style={imageStyle}
        onError={handleImageError}
        onLoad={handleImageLoad}
        onLoadStart={() => setIsImageLoading(true)}
        cachePolicy="none"
        />
    </View>
  )
}
