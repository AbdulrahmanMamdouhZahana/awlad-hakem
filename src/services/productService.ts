// src/services/productService.ts

import { apiFetch } from "./api"

export interface iProducts {
  id: number
  name: string
  category: string
  price: number
  unit: string
  image: string
  stock: number
  created_at?: string
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

export const uploadProductImage = async (
  file: File
): Promise<string> => {

  const formData =
    new FormData()

  formData.append(
    "image",
    file
  )

  const token =
    localStorage.getItem(
      "auth_token"
    )

  const response =
    await fetch(
      `${import.meta.env.VITE_API_URL}/products/upload-image`,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        },

        body: formData,
      }
    )

  const data =
    await response
      .json()
      .catch(() => null)

  // ---------------------------------
  // Authentication error
  // ---------------------------------

  if (response.status === 401) {

    localStorage.removeItem(
      "auth_token"
    )

    localStorage.removeItem(
      "auth_user"
    )

    window.location.href =
      "/login"

    throw new Error(
      "انتهت جلسة تسجيل الدخول"
    )
  }

  // ---------------------------------
  // Other errors
  // ---------------------------------

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "فشل رفع الصورة"
    )
  }

  return (
    data?.url ||
    data?.data?.url ||
    data?.image_url ||
    ""
  )
}