import React from 'react'
import { 
  StyleSheet, 
  View, 
  Text,
  TouchableOpacity, 
  Image,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'


const { width, height } = Dimensions.get('window')

export default function IndexScreen() {
  const router = useRouter();
  
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container} edges={["left"]}>
        {/* Background image with overlay gradient */}
        <Image source={require('../IMAGES/crowd.jpg')} style={styles.backgroundImage}/>
        <LinearGradient
          colors={['rgba(255,255,255,0.97)', 'rgba(255,255,255,0.85)']}
          style={styles.gradient}
        />
        
        <View style={styles.contentContainer}>
          <Image
            source={require('../IMAGES/jaspers.png')}
            style={styles.logo}
          />
            
          <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome to JasperGreen!</Text>

            <Text style={styles.subtitle}>
              Cheer loud, earn points, and unlock rewards — all for supporting your teams!
            </Text>

          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('./(auth)/login')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Log In</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('./(auth)/signup')}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        <Text style={styles.footerText}>
          Scan QR codes at games. Stack points. Get exclusive Jasper gear.
        </Text>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    resizeMode: 'cover',
    opacity: 0.6,
  },
  gradient: {
    position: 'absolute',
    width: width,
    height: height,
    zIndex: 0,
  },
  logo: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain',
    marginTop: -height * 0.05,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: -height * 0.04,
    marginBottom: height * 0.04,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 1,
    ...Platform.select({
      ios: {
        fontFamily: 'AvenirNext-Bold', // or custom like 'Poppins-Bold'
      },
      android: {
        fontFamily: 'sans-serif-condensed',
      },
    }),
  },
  
  subtitle: {
    fontSize: 19,
    fontWeight: '500',
    color: '#1e5132',
    textAlign: 'center',
    maxWidth: width * 0.9,
    lineHeight: 26,
    opacity: 0.95,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        fontFamily: 'AvenirNext-Medium',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  
  footerText: {
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 24,
    marginHorizontal: 24,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    opacity: 0.9,
    ...Platform.select({
      ios: {
        fontFamily: 'AvenirNext-Regular',
      },
      android: {
        fontFamily: 'sans-serif-light',
      },
    }),
  },
  buttonContainer: {
    width: '100%',
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
  },
  button: {
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    ...Platform.select({
      ios: {
        fontFamily: 'Avenir-Medium',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    paddingVertical: 16,
    textAlign: 'center',
  },
  skipLink: {
    marginTop: 8,
    padding: 10,
  },
  skipLinkText: {
    color: colors.primary,
    fontSize: 16,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
})