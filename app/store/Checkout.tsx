"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { Feather } from "@expo/vector-icons"
import { colors } from "@/constants/colors"
import { useCart } from "@/context/cart-context"
import { useNotifications } from "@/context/notification-context"
import { LinearGradient } from "expo-linear-gradient"


// Card type icons
const CARD_TYPES = {
  visa: require("@/IMAGES/visa.jpeg"),
  mastercard: require("@/IMAGES/mastercard.jpg"),
  amex: require("@/IMAGES/amex.png"),
  discover: require("@/IMAGES/amex.png"),
}

interface Address {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

interface CreditCardInfo {
  cardNumber: string
  nameOnCard: string
  expiryDate: string
  cvv: string
  cardType: string | null
}

const CheckoutScreen: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart()
  const { showNotification } = useNotifications()
  const router = useRouter()

  // State for form sections
  const [promoCode, setPromoCode] = useState("")
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("creditCard")
  const [sameAsBilling, setSameAsBilling] = useState(true)

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    cart: true,
    shipping: false,
    payment: false,
    summary: true,
  })

  // State for addresses
  const [billingAddress, setBillingAddress] = useState<Address>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
  })

  const [shippingAddress, setShippingAddress] = useState<Address>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
  })

  // State for credit card
  const [creditCard, setCreditCard] = useState<CreditCardInfo>({
    cardNumber: "",
    nameOnCard: "",
    expiryDate: "",
    cvv: "",
    cardType: null,
  })

  // State for saved cards
  const [savedCards, setSavedCards] = useState([
    {
      id: "1",
      cardNumber: "•••• •••• •••• 4242",
      nameOnCard: "John Doe",
      expiryDate: "12/25",
      cardType: "visa",
      isDefault: true,
    },
  ])

  // State for selected card
  const [selectedCardId, setSelectedCardId] = useState<string | null>("1")

  // Animation values
  const cartHeight = useRef(new Animated.Value(0)).current
  const shippingHeight = useRef(new Animated.Value(0)).current
  const paymentHeight = useRef(new Animated.Value(0)).current

  const shippingCost = shippingMethod === "express" ? 15.99 : shippingMethod === "standard" ? 5.99 : 1.99
  const discount = promoCode.toLowerCase() === "team20" ? totalPrice * 0.2 : 0
  const tax = totalPrice * 0.08 // 8% tax
  const finalTotal = totalPrice + shippingCost + tax - discount

  type Section = keyof typeof expandedSections;

  const toggleSection = (section: Section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };
  // Format credit card number with spaces
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const limit = 16

    let formatted = ""
    for (let i = 0; i < cleaned.length && i < limit; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " "
      }
      formatted += cleaned[i]
    }

    // Detect card type
    let cardType = null
    if (/^4/.test(cleaned)) cardType = "visa"
    else if (/^5[1-5]/.test(cleaned)) cardType = "mastercard"
    else if (/^3[47]/.test(cleaned)) cardType = "amex"
    else if (/^6(?:011|5)/.test(cleaned)) cardType = "discover"

    setCreditCard({
      ...creditCard,
      cardNumber: formatted,
      cardType,
    })
  }

  // Format expiry date (MM/YY)
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "")
    let formatted = cleaned

    if (cleaned.length > 2) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`
    }

    setCreditCard({
      ...creditCard,
      expiryDate: formatted,
    })
  }

  // Handle adding a new card
  const handleAddCard = () => {
    // Validate card details
    if (
      creditCard.cardNumber.length < 19 ||
      !creditCard.nameOnCard ||
      creditCard.expiryDate.length < 5 ||
      creditCard.cvv.length < 3
    ) {
      showNotification("Please fill in all card details correctly")
      return
    }

    // Create a new card object
    const newCard = {
      id: Date.now().toString(),
      cardNumber: "•••• •••• •••• " + creditCard.cardNumber.slice(-4),
      nameOnCard: creditCard.nameOnCard,
      expiryDate: creditCard.expiryDate,
      cardType: creditCard.cardType || "visa",
      isDefault: savedCards.length === 0,
    }

    // Add to saved cards
    setSavedCards([...savedCards, newCard])
    setSelectedCardId(newCard.id)

    // Reset form
    setCreditCard({
      cardNumber: "",
      nameOnCard: "",
      expiryDate: "",
      cvv: "",
      cardType: null,
    })

    showNotification("Card added successfully")
  }

  // Apply promo code
  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "team20") {
      showNotification("Promo code applied: 20% off")
    } else {
      showNotification("Invalid promo code")
    }
  }

  // Copy billing address to shipping
  const copyBillingToShipping = () => {
    if (sameAsBilling) {
      setShippingAddress(billingAddress)
    }
  }

  // Validate checkout
  const validateCheckout = () => {
    // Check if cart is empty
    if (items.length === 0) {
      showNotification("Your cart is empty")
      return false
    }

    // Check if billing address is complete
    const requiredBillingFields = ["fullName", "addressLine1", "city", "state", "zipCode", "phone"]
    for (const field of requiredBillingFields) {
      if (!billingAddress[field as keyof Address]) {
        showNotification("Please complete your billing address")
        return false
      }
    }

    // Check if shipping address is complete (if not same as billing)
    if (!sameAsBilling) {
      const requiredShippingFields = ["fullName", "addressLine1", "city", "state", "zipCode", "phone"]
      for (const field of requiredShippingFields) {
        if (!shippingAddress[field as keyof Address]) {
          showNotification("Please complete your shipping address")
          return false
        }
      }
    }

    // Check if payment method is selected
    if (paymentMethod === "creditCard" && !selectedCardId) {
      showNotification("Please select or add a payment method")
      return false
    }

    return true
  }

  // Handle checkout
  const handleCheckout = () => {
    if (!validateCheckout()) return

    Alert.alert("Order Placed", "Your order has been successfully placed!", [
      {
        text: "OK",
        onPress: () => {
          clearCart()
          router.push("/")
        },
      },
    ])
  }

  // Update billing address field
  const updateBillingField = (field: keyof Address, value: string) => {
    const updatedAddress = { ...billingAddress, [field]: value }
    setBillingAddress(updatedAddress)

    // If same as billing is checked, update shipping address too
    if (sameAsBilling) {
      setShippingAddress(updatedAddress)
    }
  }

  // Update shipping address field
  const updateShippingField = (field: keyof Address, value: string) => {
    setShippingAddress({ ...shippingAddress, [field]: value })
  }

  return (
    <SafeAreaView style={styles.container} edges={["left"]}>

      {items.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.continueShoppingButton} onPress={() => router.push("../(tabs)/rewards")}>
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={100}
        >
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {/* Cart Items Section */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("cart")} activeOpacity={0.7}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionNumber}>1</Text>
                  <Text style={styles.sectionTitle}>Cart Items</Text>
                </View>
                {expandedSections.cart ? <Feather name="chevron-up" size={20} color="#555" /> : <Feather name="chevron-down" size={20} color="#555" />}
              </TouchableOpacity>

              {expandedSections.cart && (
                <View style={styles.sectionContent}>
                  {items.map((item) => (
                    <View key={`${item.product.id}-${item.size}`} style={styles.cartItem}>
                      <Image source={{ uri: item.product.image || "/placeholder.svg?height=150&width=150" }} style={styles.itemImage} />

                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.product.name}</Text>
                        {item.size && <Text style={styles.itemSize}>Size: {item.size}</Text>}
                        <Text style={styles.itemPrice}>${item.product.price.toFixed(2)}</Text>

                        <View style={styles.quantityContainer}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Feather name="minus" size={16} color="#555" />
                          </TouchableOpacity>

                          <Text style={styles.quantityText}>{item.quantity}</Text>

                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Feather name="plus" size={16} color="#555" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.product.id)}>
                        <Feather name="trash-2" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Promo Code */}
                  <View style={styles.promoContainer}>
                    <TextInput
                      style={styles.promoInput}
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChangeText={setPromoCode}
                    />
                    <TouchableOpacity style={styles.applyButton} onPress={applyPromoCode}>
                      <Text style={styles.applyButtonText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.promoHint}>Try "TEAM20" for 20% off</Text>
                </View>
              )}
            </View>

            {/* Shipping Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection("shipping")}
                activeOpacity={0.7}
              >
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionNumber}>2</Text>
                  <Text style={styles.sectionTitle}>Shipping</Text>
                </View>
                {expandedSections.shipping ? (
                  <Feather name="chevron-up" size={20} color="#555" />
                ) : (
                  <Feather name="chevron-down" size={20} color="#555" />
                )}
              </TouchableOpacity>

              {expandedSections.shipping && (
                <View style={styles.sectionContent}>
                  {/* Billing Address */}
                  <Text style={styles.subsectionTitle}>Billing Address</Text>
                  <View style={styles.addressForm}>
                    <View style={styles.formRow}>
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={billingAddress.fullName}
                        onChangeText={(text) => updateBillingField("fullName", text)}
                      />
                    </View>
                    <View style={styles.formRow}>
                      <TextInput
                        style={styles.input}
                        placeholder="Address Line 1"
                        value={billingAddress.addressLine1}
                        onChangeText={(text) => updateBillingField("addressLine1", text)}
                      />
                    </View>
                    <View style={styles.formRow}>
                      <TextInput
                        style={styles.input}
                        placeholder="Address Line 2 (Optional)"
                        value={billingAddress.addressLine2}
                        onChangeText={(text) => updateBillingField("addressLine2", text)}
                      />
                    </View>
                    <View style={styles.formRowMulti}>
                      <TextInput
                        style={[styles.input, styles.inputHalf]}
                        placeholder="City"
                        value={billingAddress.city}
                        onChangeText={(text) => updateBillingField("city", text)}
                      />
                      <TextInput
                        style={[styles.input, styles.inputHalf]}
                        placeholder="State"
                        value={billingAddress.state}
                        onChangeText={(text) => updateBillingField("state", text)}
                      />
                    </View>
                    <View style={styles.formRowMulti}>
                      <TextInput
                        style={[styles.input, styles.inputHalf]}
                        placeholder="ZIP Code"
                        value={billingAddress.zipCode}
                        onChangeText={(text) => updateBillingField("zipCode", text)}
                        keyboardType="number-pad"
                      />
                      <TextInput
                        style={[styles.input, styles.inputHalf]}
                        placeholder="Phone"
                        value={billingAddress.phone}
                        onChangeText={(text) => updateBillingField("phone", text)}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Shipping Address */}
                  <View style={styles.shippingAddressHeader}>
                    <Text style={styles.subsectionTitle}>Shipping Address</Text>
                    <TouchableOpacity
                      style={styles.sameAsBillingContainer}
                      onPress={() => {
                        const newValue = !sameAsBilling
                        setSameAsBilling(newValue)
                        if (newValue) {
                          setShippingAddress(billingAddress)
                        }
                      }}
                    >
                      <View style={[styles.checkbox, sameAsBilling && styles.checkboxChecked]}>
                        {sameAsBilling && <Feather name="check" size={14} color="#FFF" />}
                      </View>
                      <Text style={styles.sameAsBillingText}>Same as billing</Text>
                    </TouchableOpacity>
                  </View>

                  {!sameAsBilling && (
                    <View style={styles.addressForm}>
                      <View style={styles.formRow}>
                        <TextInput
                          style={styles.input}
                          placeholder="Full Name"
                          value={shippingAddress.fullName}
                          onChangeText={(text) => updateShippingField("fullName", text)}
                        />
                      </View>
                      <View style={styles.formRow}>
                        <TextInput
                          style={styles.input}
                          placeholder="Address Line 1"
                          value={shippingAddress.addressLine1}
                          onChangeText={(text) => updateShippingField("addressLine1", text)}
                        />
                      </View>
                      <View style={styles.formRow}>
                        <TextInput
                          style={styles.input}
                          placeholder="Address Line 2 (Optional)"
                          value={shippingAddress.addressLine2}
                          onChangeText={(text) => updateShippingField("addressLine2", text)}
                        />
                      </View>
                      <View style={styles.formRowMulti}>
                        <TextInput
                          style={[styles.input, styles.inputHalf]}
                          placeholder="City"
                          value={shippingAddress.city}
                          onChangeText={(text) => updateShippingField("city", text)}
                        />
                        <TextInput
                          style={[styles.input, styles.inputHalf]}
                          placeholder="State"
                          value={shippingAddress.state}
                          onChangeText={(text) => updateShippingField("state", text)}
                        />
                      </View>
                      <View style={styles.formRowMulti}>
                        <TextInput
                          style={[styles.input, styles.inputHalf]}
                          placeholder="ZIP Code"
                          value={shippingAddress.zipCode}
                          onChangeText={(text) => updateShippingField("zipCode", text)}
                          keyboardType="number-pad"
                        />
                        <TextInput
                          style={[styles.input, styles.inputHalf]}
                          placeholder="Phone"
                          value={shippingAddress.phone}
                          onChangeText={(text) => updateShippingField("phone", text)}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>
                  )}

                  {/* Shipping Method */}
                  <Text style={styles.subsectionTitle}>Shipping Method</Text>
                  <TouchableOpacity
                    style={[styles.shippingOption, shippingMethod === "standard" && styles.selectedShippingOption]}
                    onPress={() => setShippingMethod("standard")}
                  >
                    <View>
                      <Text style={styles.shippingOptionTitle}>Standard Shipping</Text>
                      <Text style={styles.shippingOptionDescription}>3-5 business days</Text>
                    </View>
                    <Text style={styles.shippingOptionPrice}>$5.99</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.shippingOption, shippingMethod === "express" && styles.selectedShippingOption]}
                    onPress={() => setShippingMethod("express")}
                  >
                    <View>
                      <Text style={styles.shippingOptionTitle}>Express Shipping</Text>
                      <Text style={styles.shippingOptionDescription}>1-2 business days</Text>
                    </View>
                    <Text style={styles.shippingOptionPrice}>$15.99</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.shippingOption, shippingMethod === "pickup" && styles.selectedShippingOption]}
                    onPress={() => setShippingMethod("pickup")}
                  >
                    <View>
                      <Text style={styles.shippingOptionTitle}>Pick Up in Person</Text>
                      <Text style={styles.shippingOptionDescription}>At the next game</Text>
                    </View>
                    <Text style={styles.shippingOptionPrice}>$1.99</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Payment Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection("payment")}
                activeOpacity={0.7}
              >
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionNumber}>3</Text>
                  <Text style={styles.sectionTitle}>Payment</Text>
                </View>
                {expandedSections.payment ? (
                  <Feather name="chevron-up" size={20} color="#555" />
                ) : (
                  <Feather name="chevron-down" size={20} color="#555" />
                )}
              </TouchableOpacity>

              {expandedSections.payment && (
                <View style={styles.sectionContent}>
                  <View style={styles.paymentMethodSelector}>
                    <TouchableOpacity
                      style={[styles.paymentTab, paymentMethod === "creditCard" && styles.activePaymentTab]}
                      onPress={() => setPaymentMethod("creditCard")}
                    >
                      <Feather name="credit-card" size={18} color={paymentMethod === "creditCard" ? colors.primary : "#555"} />
                      <Text
                        style={[styles.paymentTabText, paymentMethod === "creditCard" && styles.activePaymentTabText]}
                      >
                        Credit Card
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.paymentTab, paymentMethod === "points" && styles.activePaymentTab]}
                      onPress={() => setPaymentMethod("points")}
                    >
                      <Text style={[styles.pointsIcon, paymentMethod === "points" && styles.activePaymentTabText]}>
                        P
                      </Text>
                      <Text style={[styles.paymentTabText, paymentMethod === "points" && styles.activePaymentTabText]}>
                        Points
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {paymentMethod === "creditCard" && (
                    <View style={styles.creditCardSection}>
                      {/* Saved Cards */}
                      {savedCards.length > 0 && (
                        <View style={styles.savedCardsSection}>
                          <Text style={styles.subsectionTitle}>Saved Cards</Text>
                          {savedCards.map((card) => (
                            <TouchableOpacity
                              key={card.id}
                              style={[styles.savedCard, selectedCardId === card.id && styles.selectedSavedCard]}
                              onPress={() => setSelectedCardId(card.id)}
                            >
                              <View style={styles.savedCardInfo}>
                                {card.cardType && (
                                  <Image
                                    source={CARD_TYPES[card.cardType as keyof typeof CARD_TYPES]}
                                    style={styles.cardTypeIcon}
                                  />
                                )}
                                <View>
                                  <Text style={styles.savedCardNumber}>{card.cardNumber}</Text>
                                  <Text style={styles.savedCardName}>{card.nameOnCard}</Text>
                                </View>
                              </View>
                              <View style={styles.savedCardRight}>
                                <Text style={styles.savedCardExpiry}>Expires {card.expiryDate}</Text>
                                {card.isDefault && (
                                  <View style={styles.defaultCardBadge}>
                                    <Text style={styles.defaultCardText}>Default</Text>
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* Add New Card */}
                      <Text style={styles.subsectionTitle}>Add New Card</Text>
                      <View style={styles.cardForm}>
                        <View style={styles.cardNumberRow}>
                          <TextInput
                            style={styles.cardNumberInput}
                            placeholder="Card Number"
                            value={creditCard.cardNumber}
                            onChangeText={formatCardNumber}
                            keyboardType="number-pad"
                            maxLength={19} // 16 digits + 3 spaces
                          />
                          {creditCard.cardType && (
                            <Image
                              source={CARD_TYPES[creditCard.cardType as keyof typeof CARD_TYPES]}
                              style={styles.cardTypeIconInput}
                            />
                          )}
                        </View>

                        <TextInput
                          style={styles.input}
                          placeholder="Name on Card"
                          value={creditCard.nameOnCard}
                          onChangeText={(text) => setCreditCard({ ...creditCard, nameOnCard: text })}
                        />

                        <View style={styles.formRowMulti}>
                          <TextInput
                            style={[styles.input, styles.inputHalf]}
                            placeholder="MM/YY"
                            value={creditCard.expiryDate}
                            onChangeText={formatExpiryDate}
                            keyboardType="number-pad"
                            maxLength={5} // MM/YY
                          />
                          <TextInput
                            style={[styles.input, styles.inputHalf]}
                            placeholder="CVV"
                            value={creditCard.cvv}
                            onChangeText={(text) => setCreditCard({ ...creditCard, cvv: text.replace(/[^0-9]/g, "") })}
                            keyboardType="number-pad"
                            maxLength={4} // 3-4 digits
                            secureTextEntry
                          />
                        </View>

                        <TouchableOpacity style={styles.addCardButton} onPress={handleAddCard}>
                          <Text style={styles.addCardButtonText}>Add Card</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {paymentMethod === "points" && (
                    <View style={styles.pointsPaymentSection}>
                      <View style={styles.pointsBalanceContainer}>
                        <Text style={styles.pointsBalanceLabel}>Your Points Balance:</Text>
                        <Text style={styles.pointsBalance}>2,500 pts</Text>
                      </View>
                      <Text style={styles.pointsEquivalent}>(Equivalent to ${(2500 / 100).toFixed(2)})</Text>

                      <View style={styles.pointsInfoBox}>
                        <Text style={styles.pointsInfoText}>
                          You need {Math.ceil(finalTotal * 100)} points to complete this purchase.
                        </Text>
                      </View>

                      {2500 < finalTotal * 100 ? (
                        <View style={styles.insufficientPointsContainer}>
                          <Text style={styles.insufficientPointsText}>
                            You don't have enough points for this purchase.
                          </Text>
                          <TouchableOpacity
                            style={styles.switchToCardButton}
                            onPress={() => setPaymentMethod("creditCard")}
                          >
                            <Text style={styles.switchToCardButtonText}>Switch to Credit Card</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.sufficientPointsContainer}>
                          <Text style={styles.sufficientPointsText}>You have enough points for this purchase!</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection("summary")}
                activeOpacity={0.7}
              >
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionNumber}>4</Text>
                  <Text style={styles.sectionTitle}>Order Summary</Text>
                </View>
                {expandedSections.summary ? (
                  <Feather name="chevron-up" size={20} color="#555" />
                ) : (
                  <Feather name="chevron-down" size={20} color="#555" />
                )}
              </TouchableOpacity>

              {expandedSections.summary && (
                <View style={styles.sectionContent}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping</Text>
                    <Text style={styles.summaryValue}>${shippingCost.toFixed(2)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax (8%)</Text>
                    <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                  </View>

                  {discount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Discount (20%)</Text>
                      <Text style={styles.discountValue}>-${discount.toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
                  </View>

                  {paymentMethod === "points" && (
                    <View style={styles.pointsTotalRow}>
                      <Text style={styles.pointsTotalLabel}>Points Required:</Text>
                      <Text style={styles.pointsTotalValue}>{Math.ceil(finalTotal * 100)} pts</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Checkout Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => handleCheckout}
             >
                <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.checkoutButton}
                >
                    <Text style={styles.checkoutButtonText}>
                        {paymentMethod === "points" ? "Pay with Points" : "Place Order"}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  sectionContent: {
    padding: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginTop: 16,
  },
  cartItem: {
    flexDirection: "row",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginHorizontal: 12,
  },
  removeButton: {
    padding: 8,
  },
  promoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  promoInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  applyButton: {
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  promoHint: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
    fontStyle: "italic",
  },
  addressForm: {
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 12,
  },
  formRowMulti: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputHalf: {
    width: "48%",
  },
  shippingAddressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sameAsBillingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sameAsBillingText: {
    fontSize: 14,
    color: "#555",
  },
  shippingOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedShippingOption: {
    borderColor: colors.primary,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
  },
  shippingOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  shippingOptionDescription: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  shippingOptionPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  paymentMethodSelector: {
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    overflow: "hidden",
  },
  paymentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
  },
  activePaymentTab: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  paymentTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginLeft: 8,
  },
  activePaymentTabText: {
    color: colors.primary,
  },
  pointsIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    width: 18,
    height: 18,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#555",
  },
  creditCardSection: {
    marginBottom: 16,
  },
  savedCardsSection: {
    marginBottom: 16,
  },
  savedCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedSavedCard: {
    borderColor: colors.primary,
    backgroundColor: "rgba(59, 130, 246, 0.05)",
  },
  savedCardInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTypeIcon: {
    width: 40,
    height: 25,
    marginRight: 12,
    resizeMode: "contain",
  },
  cardTypeIconInput: {
    width: 40,
    height: 25,
    position: "absolute",
    right: 12,
    top: 12,
    resizeMode: "contain",
  },
  savedCardNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  savedCardName: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  savedCardRight: {
    alignItems: "flex-end",
  },
  savedCardExpiry: {
    fontSize: 14,
    color: "#555",
  },
  defaultCardBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  defaultCardText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  cardForm: {
    marginBottom: 16,
  },
  cardNumberRow: {
    position: "relative",
    marginBottom: 12,
  },
  cardNumberInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    paddingRight: 60,
  },
  addCardButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addCardButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  pointsPaymentSection: {
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    marginBottom: 16,
  },
  pointsBalanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pointsBalanceLabel: {
    fontSize: 16,
    color: "#555",
  },
  pointsBalance: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  pointsEquivalent: {
    fontSize: 14,
    color: "#777",
    textAlign: "right",
    marginBottom: 16,
  },
  pointsInfoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    marginBottom: 16,
  },
  pointsInfoText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  insufficientPointsContainer: {
    alignItems: "center",
  },
  insufficientPointsText: {
    fontSize: 14,
    color: "#FF3B30",
    marginBottom: 8,
  },
  switchToCardButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  switchToCardButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  sufficientPointsContainer: {
    alignItems: "center",
  },
  sufficientPointsText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#555",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  discountValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  pointsTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    borderStyle: "dashed",
  },
  pointsTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  pointsTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    marginBottom: 12
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom:12,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: "#555",
    marginBottom: 20,
  },
  continueShoppingButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default CheckoutScreen
