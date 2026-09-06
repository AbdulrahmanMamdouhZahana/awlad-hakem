// src/services/offerService.ts

export interface ProductOfferInfo {
  isOffer: boolean
  originalPrice: number
  offerPrice: number
  discountPercentage: number
  offerBadge: string
  expiresAt?: string | null
}

/**
 * Checks whether an offer is currently active on a product from backend data.
 * Validates offer flag, positive price, and expiration date.
 */
export const isOfferActive = (product?: {
  is_offer?: boolean
  offer_price?: number | null
  offer_expires_at?: string | null
} | null): boolean => {
  if (!product || !product.is_offer || product.offer_price == null) {
    return false
  }

  const offerPrice = Number(product.offer_price)
  if (isNaN(offerPrice) || offerPrice <= 0) {
    return false
  }

  if (product.offer_expires_at) {
    const expiresAt = new Date(product.offer_expires_at).getTime()
    if (!isNaN(expiresAt) && expiresAt <= Date.now()) {
      return false
    }
  }

  return true
}

/**
 * Extracts and normalizes offer details directly from product database attributes.
 */
export const getActiveOffer = (product?: {
  price?: number
  piece_price?: number | null
  weight_price?: number | null
  original_price?: number | null
  is_offer?: boolean
  offer_price?: number | null
  discount_percentage?: number | null
  offer_badge?: string | null
  offer_expires_at?: string | null
} | null): ProductOfferInfo | null => {
  if (!product || !isOfferActive(product)) {
    return null
  }

  const originalPrice = Number(
    product.original_price ??
      product.piece_price ??
      product.weight_price ??
      product.price ??
      0
  )
  const offerPrice = Number(product.offer_price)

  let discount =
    product.discount_percentage != null
      ? Number(product.discount_percentage)
      : 0

  if (!discount && originalPrice > 0 && offerPrice > 0 && originalPrice > offerPrice) {
    discount = Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
  }

  const badge =
    product.offer_badge?.trim() ||
    (discount > 0 ? `خصم ${discount}%` : "عرض خاص 🔥")

  return {
    isOffer: true,
    originalPrice,
    offerPrice,
    discountPercentage: discount,
    offerBadge: badge,
    expiresAt: product.offer_expires_at || null,
  }
}

/**
 * Utility helper to calculate discount percentage
 */
export const calculateDiscountPercentage = (
  originalPrice: number,
  offerPrice: number
): number => {
  if (originalPrice <= 0 || offerPrice >= originalPrice) return 0
  return Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
}

/**
 * Utility helper to calculate offer price from discount percentage
 */
export const calculateOfferPrice = (
  originalPrice: number,
  discountPercentage: number
): number => {
  if (originalPrice <= 0 || discountPercentage <= 0) return originalPrice
  const discounted = originalPrice * (1 - discountPercentage / 100)
  return Math.round(discounted * 100) / 100
}
