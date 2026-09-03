import { useState } from "react"

interface iProducts {
  id: number
  name: string
  category: string
  price: number
  unit: string
  image: string
  stock: number
  created_at?: string
}

interface IProps {
  product: iProducts
  onDelete?: (id: number) => void
  onEdit?: (product: iProducts) => void
  onAddToCart?: (product: iProducts) => void
}


// تقسيم الأقسام من منظور العميل: 3 أقسام رئيسية فقط
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

const getCategoryInfo = (category: string) => {
  for (const [mainCategory, subCategories] of Object.entries(CATEGORY_GROUPS)) {
    if (subCategories.includes(category)) {
      return { mainCategory, subCategory: category }
    }
  }

  return {
    mainCategory: "🛒 السوبر ماركت",
    subCategory: category,
  }
}

const FAVORITES_KEY = "favorite_products"

const ProductCard = ({
  product,
  onDelete,
  onEdit,
  onAddToCart,
}: IProps) => {
  const isAdmin = Boolean(onDelete || onEdit)
  const isAvailable = product.stock > 0

  // =========================
  // Favorite
  // =========================

  const [isFavorite, setIsFavorite] = useState(() => {
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
        // Remove
        updatedFavorites = favorites.filter(
          (id) => id !== product.id
        )

        setIsFavorite(false)
      } else {
        // Add
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

      // Allow other components to know favorites changed
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

  return (
    <article
      className="
        group
        relative
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
      "
    >

      {/* =========================
          Image
      ========================= */}

      <div className="relative h-44 overflow-hidden bg-[#eef3f3] sm:h-48">

        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="
            h-full
            w-full
            object-contain
            p-4
            transition-transform
            duration-300
            group-hover:scale-105
          "
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/400x300?text=Product"
          }}
        />

        {/* =========================
            Availability
        ========================= */}

        <span
          className={`
            absolute
            right-2
            top-2
            rounded-md
            px-2
            py-1
            text-[10px]
            font-black
            ${
              isAvailable
                ? "bg-amber-300 text-slate-900"
                : "bg-red-100 text-red-600"
            }
          `}
        >
          {isAvailable
            ? "متوفر"
            : "غير متوفر"}
        </span>

        {/* =========================
            Favorite
        ========================= */}

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
              left-2
              top-2
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-white/95
              shadow-sm
              transition-all
              duration-200
              hover:scale-105
              ${
                isFavorite
                  ? "text-red-500"
                  : "text-slate-500 hover:text-red-500"
              }
            `}
          >
            <svg
              className="h-4 w-4"
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

        {/* =========================
            Admin Actions
        ========================= */}

        {isAdmin && (
          <div className="absolute bottom-2 left-2 flex gap-1.5">

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(product)
                }}
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-indigo-600
                  text-white
                  shadow-md
                  transition
                  hover:bg-indigo-500
                "
                title="تعديل المنتج"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232 18.768 8.768M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3Z"
                  />
                </svg>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(product.id)
                }}
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-red-500
                  text-white
                  shadow-md
                  transition
                  hover:bg-red-600
                "
                title="حذف المنتج"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

          </div>
        )}

      </div>

      {/* =========================
          Content
      ========================= */}

      <div className="flex flex-1 flex-col px-3 py-3">

        {/* Customer Category */}
        {(() => {
          const { mainCategory, subCategory } = getCategoryInfo(product.category)

          return (
            <div className="mb-2 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                  {mainCategory}
                </span>
              </div>

              <p
                className="mt-1 truncate text-[10px] font-bold text-[#17656b]"
                title={subCategory}
              >
                {subCategory}
              </p>
            </div>
          )
        })()}

        {/* Name */}

        <h3
          className="
            min-h-[38px]
            line-clamp-2
            text-xs
            font-black
            leading-5
            text-slate-800
            sm:text-sm
          "
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Rating */}

        <div className="mt-1 flex items-center gap-1">
          <div className="flex text-[10px] text-amber-400">
            ★★★★★
          </div>

          <span className="text-[9px] font-medium text-slate-400">
            ({product.stock})
          </span>
        </div>

        {/* =========================
            Bottom
        ========================= */}

        <div className="mt-3 flex items-center justify-between gap-2">

          {/* Price */}

          <div className="min-w-0">
            {product.price > 0 ? (
              <div className="flex items-baseline gap-1">

                <span className="text-sm font-black text-slate-900 sm:text-base">
                  {product.price.toFixed(2)} جنية مصري
                </span>

                {product.unit && (
                  <span className="truncate text-[9px] font-medium text-slate-400">
                    / {product.unit}
                  </span>
                )}

              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-400">
                السعر غير محدد
              </span>
            )}
          </div>

          {/* Add To Cart */}

          {onAddToCart && !isAdmin && (
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() =>
                onAddToCart(product)
              }
              className="
                flex
                shrink-0
                items-center
                gap-1
                rounded-md
                border
                border-slate-300
                bg-white
                px-2
                py-1.5
                text-[9px]
                font-bold
                text-slate-700
                transition
                hover:border-[#17656b]
                hover:bg-[#17656b]
                hover:text-white
                disabled:cursor-not-allowed
                disabled:border-slate-200
                disabled:bg-slate-100
                disabled:text-slate-400
              "
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2 2h13m-11 4a1 1 0 1 0 2 0m8 0a1 1 0 1 0 2 0"
                />
              </svg>

              <span>أضف للسلة</span>
            </button>
          )}

        </div>

      </div>

    </article>
  )
}

export default ProductCard