import { useMemo, useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import Products from "../components/Products"
import { isOfferActive } from "../services/offerService"

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
  offer_expires_at?: string | null
}

interface IProps {
  products: iProducts[]
  onAddToCart: (product: iProducts) => void
}

const ProductsPage = ({
  products,
  onAddToCart,
}: IProps) => {

  // =========================
  // Refs
  // =========================
  const categoriesRef = useRef<HTMLDivElement>(null)
  const productsRef = useRef<HTMLDivElement>(null)

  // =========================
  // State
  // =========================

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMainCategory, setSelectedMainCategory] = useState("الكل")
  const [selectedSubCategory, setSelectedSubCategory] = useState("الكل")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "name">("newest")


  const productsPerPage = 24

  // =========================
  // Categories
  // =========================
  const categoryGroups: Record<string, string[]> = {
    "السوبر ماركت": [
      "فيبا", "تايجر", "غسيل اطباق", "مخلل", "الضحى", "جهينه", "نسله",
      "مستورد", "ونستون", "مستود", "جلاش", "لببتون", "رجب", "بسبوسه",
      "العاب اطفال كبيره", "مصر كافيه", "هيلس", "ايزيس", "مجموعه مقاات",
      "فاخر", "ريحانه", "ايمن افندى", "حبوبه", "فحم", "ثوث", "بيض شكلاته",
      "شامبو", "اعياء ميلاد", "كولا", "فلاش", "بيبسى", "لينو", "هديا",
      "كبيات", "بمبرز", "هاينز", "دريم", "بسكوت", "بطاطس", "ارز",
      "ريش باك", "جلاكسى", "كابرى", "عصير", "المرعي عصير", "حجاره",
      "اوكسى", "شبسى", "الملكه", "برافو شيبسى", "مستخدمآت حريمي",
      "المراعى", "ماكنة حلاق", "دريا", "صوص", "المصريه", "ربيع",
      "نسكافيه", "AMR", "ماكنة حلاق6974824289153", "مزارع دينا", "فتراك",
      "مشروب مصرى", "السنبله", "برسيل", "كرونا", "بنجور", "نظافه", "البوادى",
      "اندومي", "شكلاته", "احمدتي", "ملابورو", "شهد", "مستوردات", "سكر",
      "الرشيدي", "بسمه", "ماجى", "كلوركس", "ايس كريم", "اريال", "كيك",
      "سنبله الفرات", "جبه سايبه", "سديم", "كاتل كهراء", "مولتو",
      "العروسة", "حوا", "بسكويت شاي"
    ],
    "المكتبة": [
      "كرسات وكشكيل", "لزق", "وصلات وشوحن", "اعياد ميلاد"
    ],
    "المحمصة": [
      "المقلاة", "بن العروبه", "المناخلي", "هيلس", "فاخر", "ريحانه",
      "ايمن افندى", "حبوبه", "فحم", "بن شاهين"
    ]
  }

  const mainCategories = Object.keys(categoryGroups)

  // Get main category for a subcategory
  const getMainCategory = (subCategory: string): string | null => {
    for (const [main, subCategories] of Object.entries(categoryGroups)) {
      if (subCategories.includes(subCategory)) {
        return main
      }
    }
    return null
  }

  // Get all subcategories for a main category
  const getSubCategories = (mainCategory: string): string[] => {
    return categoryGroups[mainCategory] || []
  }



  // =========================
  // Scroll to section
  // =========================
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const yOffset = -100
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  // =========================
  // Filter Products
  // =========================

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    let result = products.filter((product) => {
      const productCategory = product.category?.trim() || ""

      // Check if product matches main category
      let matchesMainCategory = selectedMainCategory === "الكل"

      if (selectedMainCategory === "العروض") {
        matchesMainCategory = isOfferActive(product)
      } else if (!matchesMainCategory) {
        const productMainCategory = getMainCategory(productCategory)
        matchesMainCategory = productMainCategory === selectedMainCategory
      }

      // Check if product matches subcategory
      let matchesSubCategory = selectedSubCategory === "الكل"

      if (!matchesSubCategory) {
        matchesSubCategory = productCategory === selectedSubCategory
      }

      // Check search query
      const matchesSearch = query === "" ||
        product.name.toLowerCase().includes(query)

      return matchesMainCategory && matchesSubCategory && matchesSearch
    })

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        result.sort((a, b) => b.price - a.price)
        break
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "newest":
      default:
        if (result.some(p => p.created_at)) {
          result.sort((a, b) => {
            if (!a.created_at) return 1
            if (!b.created_at) return -1
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
        }
        break
    }

    return result

  }, [products, searchQuery, selectedMainCategory, selectedSubCategory, sortBy])

  // =========================
  // Pagination
  // =========================

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const startIndex = (safeCurrentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const displayedProducts = filteredProducts.slice(startIndex, endIndex)

  // =========================
  // Handlers
  // =========================

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleMainCategoryChange = (category: string) => {
    setSelectedMainCategory(category)
    setSelectedSubCategory("الكل")
    setCurrentPage(1)

    // Scroll to products after a small delay
    setTimeout(() => {
      scrollToSection(productsRef)
    }, 100)
  }

  const handleSubCategoryChange = (subCategory: string) => {
    setSelectedSubCategory(subCategory)
    setCurrentPage(1)

    // Scroll to products after a small delay
    setTimeout(() => {
      scrollToSection(productsRef)
    }, 100)
  }

  const handleSortChange = (value: typeof sortBy) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // =========================
  // Page Numbers
  // =========================

  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let page = startPage; page <= endPage; page++) {
      pages.push(page)
    }

    return pages
  }, [safeCurrentPage, totalPages])

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("")
    setSelectedMainCategory("الكل")
    setSelectedSubCategory("الكل")
    setCurrentPage(1)
    setSortBy("newest")
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      "السوبر ماركت": "🛒",
      "المكتبة": "📚",
      "المحمصة": "☕"
    }
    return icons[category] || "📦"
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* =========================
          Header with Gradient
      ========================= */}
      <section className="relative overflow-hidden bg-[#17656b] pb-12 pt-20 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzR2LTRoNHY0aC00em0wIDB2LTRoLTR2NGg0eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to="/"
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                الرئيسية
              </Link>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                🛍️ كل المنتجات
              </h1>
              <p className="mt-2 text-lg text-white/80">
                تصفح كل منتجات أولاد الحكيم واختر اللي يناسبك
              </p>
            </div>


          </div>
        </div>
      </section>

      {/* =========================
          Filters
      ========================= */}
      <section className="sticky top-[76px] z-30 border-b border-slate-200 bg-white/95 py-4 shadow-lg backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {/* Search and Sort Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                  />
                </svg>

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3 pr-12 pl-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/20"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearch("")}
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    aria-label="مسح البحث"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5" />
                </svg>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                  className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-[#17656b] focus:ring-4 focus:ring-[#17656b]/20"
                >
                  <option value="newest">الأحدث</option>
                  <option value="price-low">السعر: من الأقل للأعلى</option>
                  <option value="price-high">السعر: من الأعلى للأقل</option>
                  <option value="name">الاسم</option>
                </select>
              </div>
            </div>

            {/* Main Categories */}
            <div ref={categoriesRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent" style={{ scrollbarWidth: "thin" }}>
              <button
                type="button"
                onClick={() => handleMainCategoryChange("الكل")}
                className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${selectedMainCategory === "الكل" && selectedSubCategory === "الكل"
                    ? "bg-[#17656b] text-white shadow-lg shadow-[#17656b]/30"
                    : "border-2 border-slate-200 bg-white text-slate-600 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b] hover:shadow-md"
                  }`}
              >
                🎯 كل المنتجات
              </button>

              <button
                type="button"
                onClick={() => handleMainCategoryChange("العروض")}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                  selectedMainCategory === "العروض"
                    ? "bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg shadow-red-500/30"
                    : "border-2 border-red-200 bg-white text-red-600 hover:border-red-400 hover:bg-red-50 hover:shadow-md"
                }`}
              >
                <span>🔥</span>
                <span>العروض والتخفيضات</span>
              </button>

              {mainCategories.map((mainCategory) => {
                const active = selectedMainCategory === mainCategory
                return (
                  <button
                    key={mainCategory}
                    type="button"
                    onClick={() => handleMainCategoryChange(mainCategory)}
                    className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${active
                        ? "bg-[#17656b] text-white shadow-lg shadow-[#17656b]/30"
                        : "border-2 border-slate-200 bg-white text-slate-600 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b] hover:shadow-md"
                      }`}
                  >
                    {getCategoryIcon(mainCategory)} {mainCategory}
                  </button>
                )
              })}
            </div>

            {/* Sub Categories */}
            {selectedMainCategory !== "الكل" && selectedMainCategory !== "العروض" && (
              <div className="flex gap-2 overflow-x-auto border-t-2 border-slate-100 pt-4 pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent" style={{ scrollbarWidth: "thin" }}>
                <button
                  type="button"
                  onClick={() => handleSubCategoryChange("الكل")}
                  className={`shrink-0 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-300 ${selectedSubCategory === "الكل"
                      ? "bg-[#17656b] text-white shadow-md"
                      : "border-2 border-slate-200 bg-slate-50 text-slate-600 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b]"
                    }`}
                >
                  📋 كل الأقسام
                </button>

                {getSubCategories(selectedMainCategory).map((subCategory) => {
                  const active = selectedSubCategory === subCategory
                  return (
                    <button
                      key={subCategory}
                      type="button"
                      onClick={() => handleSubCategoryChange(subCategory)}
                      className={`shrink-0 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-300 ${active
                          ? "bg-[#17656b] text-white shadow-md"
                          : "border-2 border-slate-200 bg-slate-50 text-slate-600 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b]"
                        }`}
                    >
                      {subCategory}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================
          Products
      ========================= */}
      <section ref={productsRef} className="py-6 sm:py-12">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          {displayedProducts.length === 0 ? (
            /* Empty State */
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-24 text-center shadow-lg">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#17656b]/10 to-[#17656b]/20 text-4xl">
                🔍
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-800">
                مفيش منتجات مطابقة
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                جرب البحث باسم مختلف أو اختر قسمًا آخر
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#17656b] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#17656b]/30 transition hover:scale-105 hover:shadow-xl"
              >
                <span>🔄 عرض كل المنتجات</span>
              </button>
            </div>
          ) : (
            <>
              {/* Results Info */}
              <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 px-1 sm:px-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">
                  عرض{" "}
                  <span className="rounded-lg bg-[#17656b]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold text-[#17656b]">
                    {startIndex + 1}
                  </span>
                  {" "}إلى{" "}
                  <span className="rounded-lg bg-[#17656b]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold text-[#17656b]">
                    {Math.min(endIndex, filteredProducts.length)}
                  </span>
                  {" "}من{" "}
                  <span className="rounded-lg bg-[#17656b]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold text-[#17656b]">
                    {filteredProducts.length}
                  </span>
                  {" "}منتج
                </p>

                {selectedMainCategory !== "الكل" && (
                  <button
                    type="button"
                    onClick={() => scrollToSection(categoriesRef)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#17656b] hover:underline"
                  >
                    ↑ العودة للأقسام
                  </button>
                )}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {displayedProducts.map((product) => (
                  <Products
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => changePage(safeCurrentPage - 1)}
                    className="flex h-10 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition-all duration-300 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    السابق
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => changePage(page)}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition-all duration-300 ${safeCurrentPage === page
                          ? "bg-[#17656b] text-white shadow-lg shadow-[#17656b]/30 scale-110"
                          : "border-2 border-slate-200 bg-white text-slate-600 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b]"
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => changePage(safeCurrentPage + 1)}
                    className="flex h-10 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition-all duration-300 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    التالي
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default ProductsPage