// src/services/cartService.ts

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

interface CartItem {
  product: iProducts
  quantity: number
}

const CART_STORAGE_KEY = "shopping_cart"

export const getCart = (): CartItem[] => {
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY)
    if (cartData) {
      return JSON.parse(cartData)
    }
  } catch (error) {
    console.error("Error loading cart:", error)
  }
  return []
}

export const saveCart = (cart: CartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (error) {
    console.error("Error saving cart:", error)
  }
}

export const clearCart = (): void => {
  localStorage.removeItem(CART_STORAGE_KEY)
}