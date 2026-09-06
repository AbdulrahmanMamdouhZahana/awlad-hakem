// src/services/offerService.ts

export interface ProductOffer {
  productId: number
  isOffer: boolean
  originalPrice: number
  offerPrice: number
  discountPercentage: number
  offerBadge: string
  updatedAt?: string
}

export const OFFERS_STORAGE_KEY = "awlad_hakem_product_offers"
export const OFFERS_CHANGED_EVENT = "offersChanged"

/**
 * Load all offers from localStorage
 */
export const loadOffers = (): Record<number, ProductOffer> => {
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    return parsed
  } catch {
    return {}
  }
}

/**
 * Save all offers to localStorage and notify listeners
 */
export const saveOffers = (offers: Record<number, ProductOffer>) => {
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers))
    window.dispatchEvent(new CustomEvent(OFFERS_CHANGED_EVENT, { detail: offers }))
  } catch (err) {
    console.error("Failed to save product offers:", err)
  }
}

/**
 * Get offer for a single product
 */
export const getProductOffer = (productId: number): ProductOffer | null => {
  if (!productId) return null
  const offers = loadOffers()
  const offer = offers[productId]
  if (offer && offer.isOffer && Number(offer.offerPrice) > 0) {
    return offer
  }
  return null
}

/**
 * Set or update an offer for a product
 */
export const setProductOffer = (
  productId: number,
  offerData: {
    originalPrice: number
    offerPrice: number
    discountPercentage?: number
    offerBadge?: string
    isOffer?: boolean
  }
): ProductOffer => {
  const offers = loadOffers()

  const originalPrice = Number(offerData.originalPrice) || 0
  const offerPrice = Number(offerData.offerPrice) || 0

  let discountPercentage = offerData.discountPercentage
  if (discountPercentage == null && originalPrice > 0 && offerPrice > 0 && originalPrice > offerPrice) {
    discountPercentage = Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
  }

  const badge =
    offerData.offerBadge?.trim() ||
    (discountPercentage ? `خصم ${discountPercentage}%` : "عرض خاص 🔥")

  const newOffer: ProductOffer = {
    productId,
    isOffer: offerData.isOffer !== false,
    originalPrice,
    offerPrice,
    discountPercentage: discountPercentage || 0,
    offerBadge: badge,
    updatedAt: new Date().toISOString(),
  }

  offers[productId] = newOffer
  saveOffers(offers)
  return newOffer
}

/**
 * Remove an offer for a product
 */
export const removeProductOffer = (productId: number) => {
  const offers = loadOffers()
  if (offers[productId]) {
    delete offers[productId]
    saveOffers(offers)
  }
}

/**
 * Calculate the effective active price for a product
 */
export const getProductEffectivePrice = (
  product: {
    id: number
    price: number
    piece_price?: number | null
    weight_price?: number | null
    sale_type?: string
  },
  currentSaleType?: "piece" | "weight"
): {
  finalPrice: number
  originalPrice: number
  isOnOffer: boolean
  discountPercentage: number
  offerBadge: string
} => {
  const basePrice =
    currentSaleType === "weight"
      ? Number(product.weight_price ?? product.price ?? 0)
      : Number(product.piece_price ?? product.price ?? 0)

  const offer = getProductOffer(product.id)

  if (offer && offer.isOffer && offer.offerPrice > 0 && offer.offerPrice < basePrice) {
    return {
      finalPrice: offer.offerPrice,
      originalPrice: basePrice,
      isOnOffer: true,
      discountPercentage: offer.discountPercentage,
      offerBadge: offer.offerBadge,
    }
  }

  return {
    finalPrice: basePrice,
    originalPrice: basePrice,
    isOnOffer: false,
    discountPercentage: 0,
    offerBadge: "",
  }
}
