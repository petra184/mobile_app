import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type StoreProduct = Database["public"]["Tables"]["store_products"]["Row"]
type Promotion = Database["public"]["Tables"]["promotions"]["Row"]
type SpecialOffer = Database["public"]["Tables"]["special_offers"]["Row"]
type BirthdayPackage = Database["public"]["Tables"]["birthday_packages"]["Row"]

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  isNew?: boolean
  teamId?: string
  searchQuery?: string
}

export interface SortOptions {
  field: "created_at" | "price" | "name" | "sales_count"
  ascending: boolean
}

// Get all active store products with optional filters
export async function getStoreProducts(filters?: ProductFilters, sort?: SortOptions, limit?: number, offset?: number) {
  try {
    let query = supabase.from("store_products").select("*").eq("is_active", true)

    // Apply filters
    if (filters?.category) {
      query = query.eq("category", filters.category)
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice)
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice)
    }

    if (filters?.inStock) {
      query = query.gt("inventory", 0)
    }

    if (filters?.isNew) {
      query = query.eq("is_new", true)
    }

    if (filters?.teamId) {
      query = query.eq("team_id", filters.teamId)
    }

    if (filters?.searchQuery) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,category.ilike.%${filters.searchQuery}%`,
      )
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.ascending })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching store products:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch store products:", error)
    throw error
  }
}

// Get a single product by ID
export async function getProductById(productId: string) {
  try {
    const { data, error } = await supabase
      .from("store_products")
      .select("*")
      .eq("id", productId)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Error fetching product:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Failed to fetch product:", error)
    throw error
  }
}

// Get featured/new products
export async function getFeaturedProducts(limit = 6) {
  try {
    const { data, error } = await supabase
      .from("store_products")
      .select("*")
      .eq("is_active", true)
      .eq("is_new", true)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching featured products:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch featured products:", error)
    throw error
  }
}

// Get products by category
export async function getProductsByCategory(category: string, limit?: number) {
  try {
    let query = supabase
      .from("store_products")
      .select("*")
      .eq("is_active", true)
      .eq("category", category)
      .order("created_at", { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching products by category:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch products by category:", error)
    throw error
  }
}

// Get all unique categories
export async function getProductCategories() {
  try {
    const { data, error } = await supabase
      .from("store_products")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null)

    if (error) {
      console.error("Error fetching categories:", error)
      throw error
    }

    // Get unique categories
    const categories = [...new Set(data?.map((item) => item.category).filter(Boolean))]
    return categories
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    throw error
  }
}

// Get active promotions
export async function getActivePromotions(teamId?: string) {
  try {
    const now = new Date().toISOString()

    let query = supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("created_at", { ascending: false })

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching promotions:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch promotions:", error)
    throw error
  }
}

// Get special offers
export async function getSpecialOffers(teamId?: string) {
  try {
    const now = new Date().toISOString()

    let query = supabase
      .from("special_offers")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("created_at", { ascending: false })

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching special offers:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch special offers:", error)
    throw error
  }
}

// Get birthday packages
export async function getBirthdayPackages(teamId?: string) {
  try {
    let query = supabase.from("birthday_packages").select("*").eq("is_active", true).order("price", { ascending: true })

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching birthday packages:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch birthday packages:", error)
    throw error
  }
}

// Update product inventory (for cart operations)
export async function updateProductInventory(productId: string, quantity: number, operation: "add" | "subtract") {
  try {
    // First get current inventory
    const { data: product, error: fetchError } = await supabase
      .from("store_products")
      .select("inventory")
      .eq("id", productId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    const newInventory = operation === "add" ? product.inventory + quantity : product.inventory - quantity

    // Ensure inventory doesn't go below 0
    if (newInventory < 0) {
      throw new Error("Insufficient inventory")
    }

    const { data, error } = await supabase
      .from("store_products")
      .update({ inventory: newInventory })
      .eq("id", productId)
      .select()
      .single()

    if (error) {
      console.error("Error updating inventory:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Failed to update inventory:", error)
    throw error
  }
}

// Increment product sales count
export async function incrementProductSales(productId: string, quantity = 1) {
  try {
    const { data, error } = await supabase.rpc("increment_product_sales", {
      product_id: productId,
      increment_by: quantity,
    })

    if (error) {
      console.error("Error incrementing sales:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Failed to increment sales:", error)
    throw error
  }
}

// Get price range for filters
export async function getProductPriceRange(teamId?: string) {
  try {
    let query = supabase.from("store_products").select("price").eq("is_active", true)

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching price range:", error)
      throw error
    }

    if (!data || data.length === 0) {
      return { min: 0, max: 100 }
    }

    const prices = data.map((item) => item.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  } catch (error) {
    console.error("Failed to fetch price range:", error)
    return { min: 0, max: 100 }
  }
}

// Search products with advanced filtering
export async function searchProducts(searchQuery: string, filters?: ProductFilters, sort?: SortOptions, limit = 20) {
  try {
    const combinedFilters = {
      ...filters,
      searchQuery,
    }

    return await getStoreProducts(combinedFilters, sort, limit)
  } catch (error) {
    console.error("Failed to search products:", error)
    throw error
  }
}

// Get products with discounts
export async function getDiscountedProducts(teamId?: string, limit?: number) {
  try {
    let query = supabase
      .from("store_products")
      .select("*")
      .eq("is_active", true)
      .not("discount_percentage", "is", null)
      .gt("discount_percentage", 0)
      .order("discount_percentage", { ascending: false })

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching discounted products:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch discounted products:", error)
    throw error
  }
}

// Get low stock products (for admin)
export async function getLowStockProducts(threshold = 5, teamId?: string) {
  try {
    let query = supabase
      .from("store_products")
      .select("*")
      .eq("is_active", true)
      .lte("inventory", threshold)
      .order("inventory", { ascending: true })

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching low stock products:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch low stock products:", error)
    throw error
  }
}


// Order related types
export interface OrderItem {
    productId: string
    productName: string
    quantity: number
    price: number
    points?: number
  }
  
export interface CreateOrderData {
    userId: string
    items: OrderItem[]
    totalAmount: number
    totalPoints?: number
    paymentMethod: "cash" | "points" | "mixed"
    shippingAddress?: string
    notes?: string
  }
  
  // Create a new order (you'll need to create an orders table)
export async function createOrder(orderData: CreateOrderData) {
    try {
      // This would require creating an orders table in your database
      // For now, we'll simulate the order creation process
  
      // 1. Validate inventory for all items
      for (const item of orderData.items) {
        const { data: product, error } = await supabase
          .from("store_products")
          .select("inventory, name")
          .eq("id", item.productId)
          .single()
  
        if (error) {
          throw new Error(`Product not found: ${item.productId}`)
        }
  
        if (product.inventory < item.quantity) {
          throw new Error(`Insufficient inventory for ${product.name}`)
        }
      }
  
      // 2. Update inventory for all items
      for (const item of orderData.items) {
        await updateProductInventory(item.productId, item.quantity, "subtract")
        await incrementProductSales(item.productId, item.quantity)
      }
  
      // 3. If using points, deduct from user
      if (orderData.paymentMethod === "points" || orderData.paymentMethod === "mixed") {
        if (orderData.totalPoints) {
          // You would integrate this with your user store
          // await updateUserPoints(orderData.userId, orderData.totalPoints, 'subtract')
        }
      }
  
      // 4. Create order record (requires orders table)
      // const { data: order, error: orderError } = await supabase
      //   .from('orders')
      //   .insert({
      //     user_id: orderData.userId,
      //     total_amount: orderData.totalAmount,
      //     total_points: orderData.totalPoints,
      //     payment_method: orderData.paymentMethod,
      //     status: 'pending',
      //     items: orderData.items,
      //     shipping_address: orderData.shippingAddress,
      //     notes: orderData.notes
      //   })
      //   .select()
      //   .single()
  
      return {
        success: true,
        orderId: `order_${Date.now()}`,
        message: "Order created successfully",
      }
    } catch (error) {
      console.error("Failed to create order:", error)
      throw error
    }
}

// Get a single birthday package by ID
export async function getBirthdayPackageById(packageId: string) {
  try {
    const { data, error } = await supabase
      .from("birthday_packages")
      .select("*")
      .eq("id", packageId)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Error fetching birthday package:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Failed to fetch birthday package:", error)
    throw error
  }
}

// Get testimonials
export async function getTestimonials(limit = 10) {
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching testimonials:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch testimonials:", error)
    throw error
  }
}

// Get FAQs
export async function getFAQs(category = "birthdays", limit = 10) {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching FAQs:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Failed to fetch FAQs:", error)
    throw error
  }
}

// Submit a birthday package reservation
export async function submitBirthdayReservation(reservationData: {
  package_id: string
  user_id: string
  event_date: string
  num_guests: number
  special_requests?: string
  contact_name: string
  contact_email: string
  contact_phone: string
}) {
  try {
    const { data, error } = await supabase
      .from("birthday_reservations")
      .insert([
        {
          ...reservationData,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error submitting reservation:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Failed to submit reservation:", error)
    throw error
  }
}

// Submit a contact form
export async function submitContactForm(formData: {
  name: string
  email: string
  phone: string
  message: string
  user_id?: string
  category: string
}) {
  try {
    const { data, error } = await supabase
      .from("contact_submissions")
      .insert([
        {
          ...formData,
          status: "new",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error submitting contact form:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Failed to submit contact form:", error)
    throw error
  }
}
