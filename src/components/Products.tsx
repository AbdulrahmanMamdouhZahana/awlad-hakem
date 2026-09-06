import { useState, useMemo, memo } from "react"
import { createPortal } from "react-dom"
import { getActiveOffer } from "../services/offerService"

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

export type IProduct = iProducts

export interface IProps {
  product: iProducts
  onDelete?: (id: number) => void
  onEdit?: (product: iProducts) => void
  onAddToCart?: (
    product: iProducts,
    options?: {
      saleType?: "piece" | "weight"
      weight?: number
    }
  ) => void
  isDeleting?: boolean
  categoryGroups?: Record<string, string[]>
  className?: string
}

const CATEGORY_GROUPS: Record<string, string[]> = {
  "🛒 السوبر ماركت": [
    "فيبا", "تايجر", "غسيل اطباق", "مخلل", "الضحى", "جهينه", "نسله",
    "مستورد", "ونستون", "مستود", "جلاش", "لببتون", "رجب", "بسبوسه",
    "مصر كافيه", "زيت وسمنه", "ايزيس", "مجموعه مقاات", "ثوث", "بيض شكلاته",
    "شامبو", "كولا", "فلاش", "بيبسى", "لينو", "هديا", "كبيات", "بمبرز",
    "هاينز", "دريم", "بسكوت", "بطاطس", "ارز", "ريش باك", "جلاكسى", "كابرى",
    "عصير", "المرعي عصير", "حجاره", "اوكسى", "شبسى", "الملكه", "برافو شيبسى",
    "مستخدمات حريمي", "المراعى", "ماكنة حلاق", "دريا", "صوص", "المصريه", "ربيع",
    "نسكافيه", "AMR", "ماكنة حلاق6974824289153", "مزارع دينا", "فتراك", "مشروب مصرى",
    "السنبله", "برسيل", "كرونا", "بنجور", "نظافه", "البوادى", "اندومي", "شكلاته",
    "احمدتي", "ملابورو", "شهد", "مستوردات", "سكر", "الرشيدي", "بسمه", "ماجى",
    "كلوركس", "ايس كريم", "اريال", "كيك", "سنبله الفرات", "جبه سايبه", "سديم",
    "كاتل كهراء", "مولتو", "العروسة", "حوا", "بسكويت شاي",
  ],
  "📚 المكتبة": [
    "كرسات وكشكيل", "لزق", "وصلات وشوحن", "اعياد ميلاد", "العاب اطفال كبيره",
  ],
  "☕ المحمصة": [
    "المقلاة", "بن العروبه", "المناخلي", "هيلس", "فاخر", "ريحانه",
    "ايمن افندى", "حبوبه", "فحم", "بن شاهين",
  ],
}

// Fast pre-computed map for default categories (O(1) lookup)
const DEFAULT_CATEGORY_MAP = new Map<string, string>()
for (const [mainCat, subs] of Object.entries(CATEGORY_GROUPS)) {
  for (const sub of subs) {
    DEFAULT_CATEGORY_MAP.set(sub, mainCat)
  }
}

const getCategoryInfo = (
  category: string,
  customGroups?: Record<string, string[]>
) => {
  if (customGroups) {
    for (const [mainCategory, subCategories] of Object.entries(customGroups)) {
      if (subCategories.includes(category)) {
        return { mainCategory, subCategory: category }
      }
    }
  }

  const mappedMain = DEFAULT_CATEGORY_MAP.get(category)
  if (mappedMain) {
    return { mainCategory: mappedMain, subCategory: category }
  }

  return {
    mainCategory: "🛒 السوبر ماركت",
    subCategory: category || "عام",
  }
}

const FAVORITES_KEY = "favorite_products"

const searchEnginePages = [
  "google.com/search",
  "google.com/imgres",
  "yahoo.com/search",
  "bing.com/search",
  "duckduckgo.com/",
  "yandex.com/search",
]

const getImageUrl = (image?: string | null): string => {
  const rawImage = String(image ?? "").trim()

  if (!rawImage || rawImage.startsWith("data:image/")) {
    return "/main_logo.png"
  }

  if (searchEnginePages.some((engine) => rawImage.includes(engine))) {
    return "/main_logo.png"
  }

  if (/^https?:\/\//i.test(rawImage)) {
    return rawImage
  }

  const backendUrl = String(
    import.meta.env.VITE_API_URL ||
    "https://awlad-hakem-backend.onrender.com/api"
  )
    .replace(/\/+$/, "")
    .replace(/\/api$/, "")

  if (rawImage.startsWith("/storage/")) {
    return `${backendUrl}${rawImage}`
  }

  if (rawImage.startsWith("storage/")) {
    return `${backendUrl}/${rawImage}`
  }

  if (rawImage.startsWith("products/")) {
    return `${backendUrl}/storage/${rawImage}`
  }

  if (rawImage.startsWith("/")) {
    return `${backendUrl}${rawImage}`
  }

  return `${backendUrl}/${rawImage}`
}

const ProductCard = ({
  product,
  onDelete,
  onEdit,
  onAddToCart,
  isDeleting = false,
  categoryGroups,
  className = "",
}: IProps) => {
  const isAdmin = Boolean(onDelete || onEdit)
  const isAvailable = Number(product.stock) > 0

  const saleType = product.sale_type || "piece"
  const piecePrice = Number(
    product.piece_price ?? product.price ?? 0
  )
  const weightPrice = Number(
    product.weight_price ?? product.price ?? 0
  )

  const [showSaleOptions, setShowSaleOptions] = useState(false)
  const [selectedSaleType, setSelectedSaleType] = useState<"piece" | "weight">(
    saleType === "weight" ? "weight" : "piece"
  )
  const [selectedWeight, setSelectedWeight] = useState("0.25")
  const offer = useMemo(() => {
    return getActiveOffer(product)
  }, [product])

  const effectiveProduct = useMemo(() => {
    if (!offer) return product
    return {
      ...product,
      price: offer.offerPrice,
      piece_price: product.piece_price != null ? offer.offerPrice : product.piece_price,
      weight_price: product.sale_type === "weight" ? offer.offerPrice : product.weight_price,
      is_offer: true,
      offer_price: offer.offerPrice,
      original_price: offer.originalPrice,
      discount_percentage: offer.discountPercentage,
      offer_badge: offer.offerBadge,
    }
  }, [product, offer])

  const stockStatus = useMemo(() => {
    const stockNum = Number(product.stock)
    if (stockNum <= 0) {
      return { text: "نفد", className: "bg-red-100 text-red-700 border border-red-200" }
    }
    if (stockNum <= 10) {
      return { text: "قارب النفاد", className: "bg-amber-100 text-amber-700 border border-amber-200" }
    }
    return { text: "متوفر", className: "bg-emerald-100 text-emerald-700 border border-emerald-200" }
  }, [product.stock])

  const { mainCategory, subCategory } = useMemo(
    () => getCategoryInfo(product.category, categoryGroups),
    [product.category, categoryGroups]
  )

  const imageUrl = useMemo(() => getImageUrl(product.image), [product.image])

  const openAddOptions = () => {
    if (!onAddToCart || !isAvailable) return

    if (saleType === "piece") {
      onAddToCart(effectiveProduct, { saleType: "piece" })
      return
    }

    if (saleType === "weight") {
      setSelectedSaleType("weight")
      setSelectedWeight("0.25")
      setShowSaleOptions(true)
      return
    }

    setSelectedSaleType("piece")
    setSelectedWeight("0.25")
    setShowSaleOptions(true)
  }

  const confirmAdd = () => {
    if (!onAddToCart) return

    if (selectedSaleType === "weight") {
      const weight = Number(selectedWeight)

      if (!Number.isFinite(weight) || weight <= 0) {
        return
      }

      if (weight > Number(product.stock)) {
        return
      }

      onAddToCart(effectiveProduct, {
        saleType: "weight",
        weight,
      })
    } else {
      onAddToCart(effectiveProduct, {
        saleType: "piece",
      })
    }

    setShowSaleOptions(false)
  }

  // Optimize: Skip localStorage read when rendering in admin mode
  const [isFavorite, setIsFavorite] = useState(() => {
    if (isAdmin) return false
    try {
      const favorites = JSON.parse(
        localStorage.getItem(FAVORITES_KEY) || "[]"
      )

      return Array.isArray(favorites)
        ? favorites.includes(product.id)
        : false
    } catch {
      return false
    }
  })

  const toggleFavorite = () => {
    try {
      const favorites: number[] = JSON.parse(
        localStorage.getItem(FAVORITES_KEY) || "[]"
      )

      let updatedFavorites: number[]

      if (favorites.includes(product.id)) {
        updatedFavorites = favorites.filter(
          (id) => id !== product.id
        )
        setIsFavorite(false)
      } else {
        updatedFavorites = [
          ...favorites,
          product.id,
        ]
        setIsFavorite(true)
      }

      localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(updatedFavorites)
      )

      window.dispatchEvent(
        new CustomEvent("favoritesChanged")
      )
    } catch (error) {
      console.error(
        "FAVORITE ERROR:",
        error
      )
    }
  }

  const isValidWeight = () => {
    const weight = Number(selectedWeight)
    return weight > 0 && weight <= Number(product.stock)
  }

  return (
    <article
      className={`
        group
        relative
        flex
        h-full
        flex-col
        justify-between
        overflow-hidden
        rounded-xl
        sm:rounded-2xl
        border-2
        bg-white
        transition-all
        duration-300
        hover:-translate-y-1.5
        ${
          offer
            ? "border-red-500 ring-1 ring-red-400/40 bg-gradient-to-b from-red-50/30 via-white to-white shadow-[0_4px_18px_-4px_rgba(239,68,68,0.2)] hover:border-red-600 hover:ring-2 hover:ring-red-500/50 hover:shadow-[0_16px_34px_-6px_rgba(239,68,68,0.32)]"
            : "border-[#17656b]/60 ring-1 ring-[#17656b]/20 shadow-[0_3px_12px_-2px_rgba(23,101,107,0.12)] hover:border-[#17656b] hover:ring-2 hover:ring-[#17656b]/40 hover:shadow-[0_16px_32px_-6px_rgba(23,101,107,0.24)]"
        }
        ${className}
      `}
    >
      {/* Glossy light sheen sweep effect on hover (تأثير لمعان وبريق) */}
      <div className="pointer-events-none absolute -inset-y-2 -inset-x-full z-30 h-[120%] w-[150%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100" />

      {/* Top subtle glass gloss line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

      {/* Offer top accent bar */}
      {offer && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 z-20" />
      )}

      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full overflow-hidden border-b border-slate-100 bg-gradient-to-b from-[#eef3f3]/60 to-[#eef3f3] p-1.5 sm:p-3">
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="
            h-full
            w-full
            object-contain
            transition-transform
            duration-300
            group-hover:scale-105
          "
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = "/main_logo.png"
            e.currentTarget.className =
              "h-full w-full object-contain p-2"
          }}
        />

        {/* Stock badge */}
        <span
          className={`
            absolute
            right-1
            sm:right-2
            top-1
            sm:top-2
            rounded-md
            px-1.5
            py-0.5
            sm:px-2
            sm:py-1
            text-[8px]
            sm:text-[10px]
            font-black
            shadow-sm
            ${stockStatus.className}
          `}
        >
          {stockStatus.text}
        </span>

        {/* Category badge - desktop only (shown when no offer badge in same spot) */}
        {!offer && (
          <span className="hidden md:inline-block absolute left-2 bottom-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur">
            {subCategory}
          </span>
        )}

        {/* Offer badge */}
        {offer && (
          <span
            className="
              absolute
              left-1
              sm:left-2
              bottom-1
              sm:bottom-2
              z-10
              rounded-lg
              bg-gradient-to-r
              from-red-600
              to-amber-500
              px-2
              py-0.5
              sm:px-3
              sm:py-1
              text-[9px]
              sm:text-[11px]
              font-black
              text-white
              shadow-md
              shadow-red-500/30
              flex
              items-center
              gap-1
            "
          >
            <span>{offer.offerBadge || "عرض خاص 🔥"}</span>
            {offer.discountPercentage != null && offer.discountPercentage > 0 && (
              <span className="bg-black/20 rounded px-1 text-[7px] sm:text-[9px]">
                -{offer.discountPercentage}%
              </span>
            )}
          </span>
        )}

        {/* Customer favorite button */}
        {!isAdmin && (
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={
              isFavorite
                ? "إزالة من المفضلة"
                : "إضافة للمفضلة"
            }
            title={
              isFavorite
                ? "إزالة من المفضلة"
                : "إضافة للمفضلة"
            }
            className={`
              absolute
              left-1
              sm:left-2
              top-1
              sm:top-2
              flex
              h-6
              w-6
              sm:h-7
              sm:w-7
              items-center
              justify-center
              rounded-full
              bg-white/95
              shadow-sm
              transition-all
              duration-200
              hover:scale-110
              ${isFavorite
                ? "text-red-500"
                : "text-slate-400 hover:text-red-500"
              }
            `}
          >
            <svg
              className="h-3 w-3 sm:h-3.5 sm:w-3.5"
              fill={
                isFavorite
                  ? "currentColor"
                  : "none"
              }
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-2 sm:p-3">
        <div>
          {/* Main Category tag */}
          <div className="mb-1 min-w-0">
            <span className="truncate max-w-full rounded-md bg-[#17656b]/10 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-[#17656b] inline-block">
              {mainCategory}
            </span>
          </div>

          {/* Product Name */}
          <h3
            className="
              line-clamp-2
              min-h-[26px]
              sm:min-h-[34px]
              text-[11px]
              sm:text-xs
              md:text-sm
              font-black
              leading-tight
              sm:leading-snug
              text-slate-900
              break-words
            "
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Stock / Unit indicator */}
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="truncate text-[8px] sm:text-[10px] font-medium text-slate-400">
              {saleType === "weight"
                ? `المخزون: ${Number(product.stock).toFixed(1)} كجم`
                : `المخزون: ${Number(product.stock).toFixed(0)} ${product.unit || "قطعة"}`}
            </span>
          </div>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-2 pt-1 border-t border-slate-100">
          <div className="min-w-0">
            {offer ? (
              <div>
                <div className="flex items-baseline flex-wrap gap-1.5">
                  <div className="flex items-baseline gap-0.5 text-xs sm:text-base font-black text-red-600">
                    <bdi>{offer.offerPrice.toFixed(2)}</bdi>
                    <span className="text-[8px] sm:text-[10px] font-bold text-red-500">ج.م</span>
                  </div>
                  <div className="flex items-baseline text-[9px] sm:text-xs font-bold text-slate-400 line-through">
                    <bdi>{(offer.originalPrice || piecePrice || weightPrice).toFixed(2)}</bdi>
                  </div>
                </div>
                {saleType === "weight" ? (
                  <span className="text-[8px] sm:text-[10px] text-slate-400 block truncate">
                    لكل كجم (عرض خاص)
                  </span>
                ) : product.unit ? (
                  <span className="truncate text-[8px] sm:text-[10px] font-medium text-slate-400 block">
                    / {product.unit}
                  </span>
                ) : null}
              </div>
            ) : saleType === "weight" ? (
              weightPrice > 0 ? (
                <div>
                  <div className="flex items-baseline gap-0.5 text-xs sm:text-sm font-black text-[#17656b]">
                    <bdi>{weightPrice.toFixed(2)}</bdi>
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-500">ج.م</span>
                  </div>
                  <span className="text-[8px] sm:text-[10px] text-slate-400 block truncate">
                    لكل كجم
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">
                  سعر الكيلو غير محدد
                </span>
              )
            ) : saleType === "both" ? (
              <div>
                <div className="flex items-baseline gap-0.5 text-xs sm:text-sm font-black text-[#17656b]">
                  <bdi>{piecePrice.toFixed(2)}</bdi>
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-500">ج.م/قطعة</span>
                </div>
                <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 truncate">
                  كيلو: {weightPrice.toFixed(2)} ج.م
                </div>
              </div>
            ) : (
              piecePrice > 0 ? (
                <div>
                  <div className="flex items-baseline gap-0.5 text-xs sm:text-sm font-black text-[#17656b]">
                    <bdi>{piecePrice.toFixed(2)}</bdi>
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-500">ج.م</span>
                  </div>
                  {product.unit && (
                    <span className="truncate text-[8px] sm:text-[10px] font-medium text-slate-400 block">
                      / {product.unit}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">
                  السعر غير محدد
                </span>
              )
            )}
          </div>

          {/* Add to Cart Button */}
          {onAddToCart && !isAdmin && (
            <button
              type="button"
              disabled={!isAvailable}
              onClick={openAddOptions}
              className="
                mt-1.5
                sm:mt-2
                flex
                w-full
                items-center
                justify-center
                gap-1
                rounded-lg
                sm:rounded-xl
                bg-gradient-to-r
                from-[#17656b]
                to-[#0f4a4f]
                py-1.5
                sm:py-2
                px-1
                text-[10px]
                sm:text-xs
                font-bold
                text-white
                shadow-sm
                shadow-[#17656b]/20
                transition-all
                hover:shadow-md
                hover:shadow-[#17656b]/30
                active:scale-95
                disabled:cursor-not-allowed
                disabled:from-slate-200
                disabled:to-slate-200
                disabled:text-slate-400
                disabled:shadow-none
              "
            >
              <svg
                className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2 2h13m-11 4a1 1 0 1 0 2 0m8 0a1 1 0 1 0 2 0"
                />
              </svg>

              <span className="leading-none">
                {!isAvailable ? (
                  "نفد"
                ) : (
                  <>
                    <span className="sm:hidden">أضف</span>
                    <span className="hidden sm:inline">أضف للسلة</span>
                  </>
                )}
              </span>
            </button>
          )}

          {/* Admin Action Buttons */}
          {isAdmin && (
            <div className="mt-2 flex gap-1 border-t border-slate-100 pt-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(product)
                  }}
                  className="flex-1 rounded-lg border border-indigo-100 bg-indigo-50 py-1.5 text-[10px] sm:text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                >
                  تعديل
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(product.id)
                  }}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border border-red-100 bg-red-50 py-1.5 text-[10px] sm:text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {isDeleting ? "..." : "حذف"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sale Options Modal (Weight/Piece selection) for customer */}
      {showSaleOptions && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSaleOptions(false)}
        >
          <div
            dir="rtl"
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                اختر طريقة البيع
              </h3>
              <button
                type="button"
                onClick={() => setShowSaleOptions(false)}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {saleType === "both" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSaleType("piece")}
                  className={`rounded-xl border p-3 text-sm font-black ${selectedSaleType === "piece"
                    ? "border-[#17656b] bg-[#17656b] text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                >
                  بالقطعة
                  <div className="mt-1 text-xs opacity-80">
                    {piecePrice.toFixed(2)} جنيه
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSaleType("weight")}
                  className={`rounded-xl border p-3 text-sm font-black ${selectedSaleType === "weight"
                    ? "border-[#17656b] bg-[#17656b] text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                >
                  بالوزن
                  <div className="mt-1 text-xs opacity-80">
                    {weightPrice.toFixed(2)} جنيه/كجم
                  </div>
                </button>
              </div>
            )}

            {selectedSaleType === "weight" ? (
              <div className="mt-5">
                <label className="mb-2 block text-xs font-black text-slate-700">
                  الكمية المطلوبة بالكيلو
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={selectedWeight}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                      setSelectedWeight(val)
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-black outline-none focus:border-[#17656b]"
                />

                <div className="mt-2 text-center text-[11px] text-slate-400">
                  المتاح: {Number(product.stock).toFixed(2)} كجم
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-center">
                  <span className="text-xs text-slate-500">
                    الإجمالي
                  </span>
                  <div className="mt-1 text-lg font-black text-[#17656b]">
                    {(Number(selectedWeight || 0) * weightPrice).toFixed(2)} جنيه
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-slate-50 p-3 text-center">
                <span className="text-xs text-slate-500">
                  سعر القطعة
                </span>
                <div className="mt-1 text-lg font-black text-[#17656b]">
                  {piecePrice.toFixed(2)} جنيه
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={
                selectedSaleType === "weight" && !isValidWeight()
              }
              onClick={confirmAdd}
              className="mt-5 w-full rounded-xl bg-[#17656b] py-3 text-sm font-black text-white transition hover:bg-[#12555a] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              إضافة للسلة
            </button>
          </div>
        </div>,
        document.body
      )}
    </article>
  )
}

export default memo(ProductCard)