import { useMemo, useRef, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Products from "./Products"
import { isOfferActive } from "../services/offerService"
import {
  ShoppingBagIcon,
  SparklesIcon,
  ShoppingCartIcon,
  BookOpenIcon,
  BuildingStorefrontIcon,
  TagIcon,
} from "@heroicons/react/24/outline"

// =====================================
// Customer Categories
// 3 main sections -> subcategories -> products
// =====================================
const CATEGORY_GROUPS: Record<string, string[]> = {
  "السوبر ماركت": [
    "فيبا", "تايجر", "غسيل اطباق", "مخلل", "الضحى", "جهينه", "نسله", "مستورد",
    "ونستون", "مستود", "جلاش", "لببتون", "رجب", "بسبوسه", "العاب اطفال كبيره",
    "مصر كافيه", "زيت وسمنه", "هيلس", "ايزيس", "مجموعه مقاات", "فاخر", "ريحانه",
    "ايمن افندى", "حبوبه", "بيض شكلاته", "شامبو", "كولا", "فلاش", "بيبسى", "لينو",
    "هديا", "كبيات", "بمبرز", "هاينز", "دريم", "بسكوت", "بطاطس", "ارز", "ريش باك",
    "جلاكسى", "كابرى", "عصير", "المرعي عصير", "حجاره", "اوكسى", "شبسى", "الملكه",
    "برافو شيبسى", "مستخدمات حريمي", "المراعى", "ماكنة حلاق", "دريا", "صوص", "المصريه",
    "ربيع", "نسكافيه", "AMR", "السوبر ماركت", "ماكنة حلاق6974824289153", "مزارع دينا",
    "فتراك", "مشروب مصرى", "السنبله", "برسيل", "كرونا", "بنجور", "نظافه", "البوادى",
    "اندومي", "شكلاته", "احمدتي", "ملابورو", "شهد", "مستوردات", "سكر", "الرشيدي",
    "بسمه", "ماجى", "كلوركس", "ايس كريم", "اريال", "كيك", "سنبله الفرات", "جبه سايبه",
    "سديم", "كاتل كهراء", "مولتو", "العروسة", "حوا", "بسكويت شاي"
  ],
  "المكتبة": ["كرسات وكشكيل", "لزق", "وصلات وشوحن", "اعياد ميلاد"],
  "المحمصة": ["المقلاة", "بن العروبه", "المناخلي", "هيلس", "فاخر", "ريحانه", "ايمن افندى", "حبوبه", "فحم", "بن شاهين"],
}

const MAIN_CATEGORIES = Object.keys(CATEGORY_GROUPS)

const MAIN_CATEGORY_META: Record<string, { Icon: typeof ShoppingCartIcon; description: string }> = {
  "السوبر ماركت": { Icon: ShoppingCartIcon, description: "كل احتياجات البيت اليومية" },
  "المكتبة": { Icon: BookOpenIcon, description: "مستلزمات الدراسة والمكتبة" },
  "المحمصة": { Icon: BuildingStorefrontIcon, description: "البن والمكسرات ومستلزمات المحمصة" },
}

interface iProducts {
  id: number
  name: string
  category: string
  price: number
  unit: string
  image: string
  stock: number
  created_at?: string
  is_offer?: boolean
  offer_price?: number | null
  original_price?: number | null
  discount_percentage?: number | null
  offer_badge?: string | null
}

interface IProps {
  products: iProducts[]
  onAddToCart: (product: iProducts) => void
}

const HeaderProducts = ({
  products,
  onAddToCart,
}: IProps) => {

  // =====================================
  // Category Slider Ref
  // =====================================

  const [selectedMainCategory, setSelectedMainCategory] = useState("الكل")
  const [selectedSubCategory, setSelectedSubCategory] = useState("الكل")

  const subCategories = useMemo(() => {
    if (selectedMainCategory === "الكل" || selectedMainCategory === "العروض") return []
    return CATEGORY_GROUPS[selectedMainCategory] ?? []
  }, [selectedMainCategory])

  // =====================================
  // Filter Products
  // =====================================

  const filteredProducts = useMemo(() => {
    let result = products

    if (selectedMainCategory === "العروض") {
      result = result.filter(isOfferActive)
    } else if (selectedMainCategory !== "الكل") {
      const allowedSubCategories = CATEGORY_GROUPS[selectedMainCategory] ?? []

      result = result.filter((product) =>
        allowedSubCategories.includes(product.category?.trim())
      )
    }

    if (selectedSubCategory !== "الكل") {
      result = result.filter(
        (product) => product.category?.trim() === selectedSubCategory
      )
    }

    return result.slice(0, 8)
  }, [products, selectedMainCategory, selectedSubCategory])

  // =====================================
  // Main Category Icon
  // =====================================

  const getMainCategoryIcon = (category: string) => {
    const IconComp = MAIN_CATEGORY_META[category]?.Icon ?? TagIcon
    return <IconComp className="h-6 w-6" />
  }

  return (
    <section
      id="products"
      dir="rtl"
      className="bg-[#fafafc] py-6 sm:py-12"
    >
      <div className="mx-auto max-w-6xl px-2 sm:px-6 lg:px-8">

        {/* =====================================
            Main Categories
        ===================================== */}

        <div id="categories" className="mb-6 scroll-mt-24">
          <div className="mb-4">
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              تسوق حسب القسم
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              اختار القسم اللي بتدور فيه على منتجاتك
            </p>
          </div>

          {/* 3 Main Categories */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                setSelectedMainCategory("الكل")
                setSelectedSubCategory("الكل")
              }}
              className={`group rounded-2xl border p-4 text-right transition-all duration-200 ${selectedMainCategory === "الكل"
                ? "border-[#17656b] bg-[#17656b] text-white shadow-lg"
                : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-[#42a1a7] hover:shadow-md"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${selectedMainCategory === "الكل" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                  }`}>
                  <ShoppingBagIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black sm:text-base">كل المنتجات</div>
                  <div className={`mt-0.5 text-[10px] sm:text-xs ${selectedMainCategory === "الكل" ? "text-white/75" : "text-slate-500"
                    }`}>
                    تصفح كل المنتجات
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedMainCategory("العروض")
                setSelectedSubCategory("الكل")
              }}
              className={`group rounded-2xl border p-4 text-right transition-all duration-200 ${selectedMainCategory === "العروض"
                ? "border-red-500 bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg shadow-red-500/30"
                : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-red-400 hover:shadow-md"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${selectedMainCategory === "العروض" ? "bg-white/20 text-white" : "bg-red-50 text-red-500"
                  }`}>
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black sm:text-base">عروض وتخفيضات</div>
                  <div className={`mt-0.5 text-[10px] sm:text-xs ${selectedMainCategory === "العروض" ? "text-white/85" : "text-red-500 font-bold"
                    }`}>
                    وفر مع أفضل العروض
                  </div>
                </div>
              </div>
            </button>

            {MAIN_CATEGORIES.map((mainCategory) => {
              const active = selectedMainCategory === mainCategory
              const meta = MAIN_CATEGORY_META[mainCategory]

              return (
                <button
                  key={mainCategory}
                  type="button"
                  onClick={() => {
                    setSelectedMainCategory(mainCategory)
                    setSelectedSubCategory("الكل")
                  }}
                  className={`group rounded-2xl border p-4 text-right transition-all duration-200 ${active
                    ? "border-[#17656b] bg-[#17656b] text-white shadow-lg"
                    : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-[#42a1a7] hover:shadow-md"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-105 ${active ? "bg-white/15" : "bg-[#eef7f7]"
                      }`}>
                      {getMainCategoryIcon(mainCategory)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black sm:text-base">
                        {mainCategory}
                      </div>
                      <div className={`mt-0.5 text-[10px] sm:text-xs ${active ? "text-white/75" : "text-slate-500"
                        }`}>
                        {meta?.description}
                      </div>
                    </div>


                  </div>
                </button>
              )
            })}
          </div>

          {/* Subcategories */}
          {selectedMainCategory !== "الكل" && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    أقسام {selectedMainCategory}
                  </h3>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    اختار القسم الفرعي لعرض منتجاته
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSubCategory("الكل")}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black transition ${selectedSubCategory === "الكل"
                    ? "bg-[#17656b] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  الكل
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {subCategories.map((subCategory) => {
                  const active = selectedSubCategory === subCategory

                  return (
                    <button
                      key={subCategory}
                      type="button"
                      onClick={() => setSelectedSubCategory(subCategory)}
                      className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-bold transition-all sm:text-xs ${active
                        ? "border-[#17656b] bg-[#17656b] text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#42a1a7] hover:bg-[#eef7f7]"
                        }`}
                    >
                      {subCategory}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* =====================================
            Products Header
        ===================================== */}

        <div className="mb-4 sm:mb-5 flex items-center justify-between px-1 sm:px-0">

          <div>

            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              {selectedSubCategory !== "الكل"
                ? selectedSubCategory
                : selectedMainCategory !== "الكل"
                  ? selectedMainCategory
                  : "تصفح المنتجات"}
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              اختيارات مميزة من منتجاتنا
            </p>

          </div>

        </div>

        {/* =====================================
            PRODUCTS GRID
        ===================================== */}

        {filteredProducts.length > 0 ? (

          <div
            className="
              grid
              grid-cols-3
              gap-2
              sm:gap-4
              md:gap-5
              lg:grid-cols-4
            "
          >

            {filteredProducts.map((product) => (

              <div
                key={product.id}
                className="min-w-0 h-full flex flex-col"
              >

                <Products
                  product={product}
                  onAddToCart={onAddToCart}
                />

              </div>

            ))}

          </div>

        ) : (

          <div className="
            rounded-xl
            border
            border-slate-200
            bg-white
            py-12
            text-center
          ">

            <div className="
              mx-auto
              mb-3
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-indigo-50
              text-[#17656b]
            ">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 7h18M5 7l1 13h12l1-13M9 7V4h6v3"
                />
              </svg>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              لا توجد منتجات في هذا القسم
            </p>

          </div>
        )}

        {/* =====================================
            All Products
        ===================================== */}

        <div className="mt-6 flex justify-center">

          <Link
            to="/products"
            className="
              inline-flex
              items-center
              gap-1.5
              text-xs
              font-black
              text-[#fff]

              bg-[#17656b]
              p-4
              rounded-sm 
              transition
              hover:bg-[#37b9c3]

              hover:underline
            "
          >
            <span>عرض كل المنتجات</span>

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
                d="M5 12h14M13 6l6 6-6 6"
              />
            </svg>
          </Link>

        </div>

      </div>
    </section>
  )
}

export default HeaderProducts