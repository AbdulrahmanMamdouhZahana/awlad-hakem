// src/services/productService.ts

import { apiFetch } from "./api"
import { supabase } from "../lib/supabase"

export interface iProducts {
  id: number
  name: string
  category: string
  price: number
  tax_rate?: number | null
  tax_type?: "percentage" | "fixed" | null
  tax_value?: number | null
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

export interface PaginatedProductsResponse {
  data: iProducts[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// In-memory runtime request deduplication (never persisted in browser storage)
let activeProductsPromise: Promise<iProducts[]> | null = null

// =====================================
// Get Paginated Products (Server-Side)
// =====================================
export const getPaginatedProducts = async (params?: {
  page?: number
  per_page?: number
  search?: string
  category?: string
  only_offers?: boolean
  sort_by?: string
}): Promise<PaginatedProductsResponse> => {
  const query = new URLSearchParams()
  if (params?.page) query.append("page", String(params.page))
  if (params?.per_page) query.append("per_page", String(params.per_page))
  if (params?.search?.trim()) query.append("search", params.search.trim())
  if (params?.category && params.category !== "الكل" && params.category !== "all") {
    query.append("category", params.category)
  }
  if (params?.only_offers) query.append("only_offers", "true")
  if (params?.sort_by) query.append("sort_by", params.sort_by)

  const queryString = query.toString()
  const response = await apiFetch(`/products${queryString ? `?${queryString}` : ""}`)

  if (response?.data && Array.isArray(response.data) && typeof response?.current_page === "number") {
    return {
      data: response.data,
      current_page: response.current_page,
      last_page: response.last_page || 1,
      per_page: response.per_page || 20,
      total: response.total || response.data.length,
    }
  }

  const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
  return {
    data: list,
    current_page: 1,
    last_page: 1,
    per_page: list.length,
    total: list.length,
  }
}

// =====================================
// Get Products (Non-persistent runtime fetch)
// =====================================
export const getProducts = async (all: boolean = false): Promise<iProducts[]> => {
  // If requesting a specific mode or already requesting, avoid duplicate in-flight requests
  if (!all && activeProductsPromise) {
    return activeProductsPromise
  }

  const endpoint = all ? "/products?all=true" : "/products?page=1&per_page=20"

  const request = apiFetch(endpoint)
    .then((response) => {
      let products: iProducts[] = []

      if (response?.data && Array.isArray(response.data)) {
        products = response.data
      } else if (Array.isArray(response)) {
        products = response
      } else if (response?.products && Array.isArray(response.products)) {
        products = response.products
      }

      return products
    })
    .catch((error) => {
      activeProductsPromise = null
      console.error("Failed to fetch products:", error)
      throw error
    })
    .finally(() => {
      // Clear in-flight promise after resolution so future calls get fresh data
      setTimeout(() => {
        activeProductsPromise = null
      }, 1000)
    })

  if (!all) {
    activeProductsPromise = request
  }

  return request
}

// =====================================
// Clear In-Memory Products Cache
// =====================================
export const clearProductsCache = () => {
  activeProductsPromise = null
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