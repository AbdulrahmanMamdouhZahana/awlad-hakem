// src/services/productService.ts

import { apiFetch } from "./api"
import { supabase } from "../lib/supabase"

export interface iProducts {
  id: number
  name: string
  category: string
  price: number
  unit: string
  image: string
  stock: number
  sale_type?: "piece" | "weight" | "both"
  piece_price?: number | null
  weight_price?: number | null
  created_at?: string
  is_offer?: boolean
  offer_price?: number | null
  original_price?: number | null
  discount_percentage?: number | null
  offer_badge?: string | null
  offer_expires_at?: string | null
}

// =====================================
// Products Request Cache
// =====================================

let productsRequest: Promise<iProducts[]> | null = null

const CACHE_KEY = "products_cache"

// =====================================
// Get All Products
// =====================================

export const getProducts = async (): Promise<iProducts[]> => {

  // ---------------------------------
  // 1. Check session cache
  // ---------------------------------

  const cachedProducts =
    sessionStorage.getItem(CACHE_KEY)

  if (cachedProducts !== null) {
    try {
      const parsedProducts =
        JSON.parse(cachedProducts)

      if (Array.isArray(parsedProducts)) {
        return parsedProducts
      }
    } catch {
      sessionStorage.removeItem(CACHE_KEY)
    }
  }

  // ---------------------------------
  // 2. Reuse existing request
  // ---------------------------------

  if (productsRequest) {
    return productsRequest
  }

  // ---------------------------------
  // 3. Make ONE request
  // ---------------------------------

  productsRequest = apiFetch("/products")
    .then((response) => {

      let products: iProducts[] = []

      if (
        response?.data &&
        Array.isArray(response.data)
      ) {
        products = response.data
      } else if (
        Array.isArray(response)
      ) {
        products = response
      } else if (
        response?.products &&
        Array.isArray(response.products)
      ) {
        products = response.products
      }

      // Cache even if products = []
      // so we don't repeatedly request an empty result.
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify(products)
      )

      return products
    })
    .catch((error) => {

      // Allow retry if the API request actually failed.
      productsRequest = null

      console.error(
        "Failed to fetch products:",
        error
      )

      throw error
    })

  return productsRequest
}

// =====================================
// Clear Products Cache
// =====================================

export const clearProductsCache = () => {
  sessionStorage.removeItem(CACHE_KEY)

  productsRequest = null
}

// =====================================
// Get Product By ID
// =====================================

export const getProduct = async (
  id: number
): Promise<iProducts> => {

  const response =
    await apiFetch(`/products/${id}`)

  return response?.data ?? response
}

// =====================================
// Add Product
// =====================================

export const addProduct = async (
  product: Omit<
    iProducts,
    "id" | "created_at"
  >
): Promise<iProducts> => {

  const response =
    await apiFetch("/products", {
      method: "POST",

      body: JSON.stringify(product),
    })

  // Products changed.
  clearProductsCache()

  return response?.data ?? response
}

// =====================================
// Update Product
// =====================================

export const updateProduct = async (
  id: number,
  product: Partial<
    Omit<
      iProducts,
      "id" | "created_at"
    >
  >
): Promise<iProducts> => {

  const response =
    await apiFetch(
      `/products/${id}`,
      {
        method: "PUT",

        body: JSON.stringify(product),
      }
    )

  // Products changed.
  clearProductsCache()

  return response?.data ?? response
}

// =====================================
// Delete Product
// =====================================

export const deleteProduct = async (
  id: number
): Promise<void> => {

  await apiFetch(
    `/products/${id}`,
    {
      method: "DELETE",
    }
  )

  // Products changed.
  clearProductsCache()
}

// =====================================
// Upload Product Image
// =====================================

// =====================================
// Upload Product Image
// =====================================

export const uploadProductImage = async (
  file: File
): Promise<string> => {
  if (!(file instanceof File)) {
    throw new Error("ملف الصورة غير صحيح")
  }

  // 1. Primary: Direct upload to Supabase Storage
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`

    const { error: supabaseError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      })

    if (!supabaseError) {
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName)

      if (urlData?.publicUrl) {
        console.log("✅ Supabase Image Upload Success:", urlData.publicUrl)
        return urlData.publicUrl
      }
    } else {
      console.warn("⚠️ Supabase storage upload error:", supabaseError)
    }
  } catch (err) {
    console.warn("⚠️ Supabase upload threw exception, falling back to backend:", err)
  }

  // 2. Fallback: Backend /products/upload-image
  const formData = new FormData()
  formData.append("image", file)

  const response = await apiFetch(
    "/products/upload-image",
    {
      method: "POST",
      body: formData,
    }
  )

  const imageUrl =
    response?.url ||
    response?.data?.url ||
    response?.image_url ||
    ""

  if (!imageUrl) {
    throw new Error("لم يتم الحصول على رابط الصورة")
  }

  return imageUrl
}