import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import Products from "../components/Products"
import { getPaginatedProducts } from "../services/productService"

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
  products?: iProducts[]
  onAddToCart: (product: iProducts) => void
}

const ProductsPage = ({
  onAddToCart,
}: IProps) => {
  // =========================
  // URL Search Parameters
  // =========================
  const [searchParams, setSearchParams] = useSearchParams()

  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const searchQuery = searchParams.get("search") || ""
  const selectedMainCategory = searchParams.get("category") || "الكل"
  const selectedSubCategory = searchParams.get("subcategory") || "الكل"
  const sortBy = (searchParams.get("sort") as "newest" | "price-low" | "price-high" | "name") || "newest"

  // Local input search state for smooth typing & debouncing
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Keep searchInput in sync if URL changes externally (e.g. back button)
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // =========================
  // Server-side State
  // =========================
  const [displayedProducts, setDisplayedProducts] = useState<iProducts[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(true)

  // =========================
  // Refs
  // =========================
  const categoriesRef = useRef<HTMLDivElement>(null)
  const productsRef = useRef<HTMLDivElement>(null)

  const productsPerPage = 20

  // =========================
  // Categories Definitions
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

  const getSubCategories = (mainCategory: string): string[] => {
    return categoryGroups[mainCategory] || []
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      "السوبر ماركت": "🛒",
      "المكتبة": "📚",
      "المحمصة": "☕"
    }
    return icons[category] || "📦"
  }

  // =========================
  // URL Update Helper
  // =========================
  const updateUrlParams = useCallback((updates: {
    page?: number
    search?: string
    category?: string
    subcategory?: string
    sort?: string
  }) => {
    const newParams = new URLSearchParams(searchParams)

    if (updates.page !== undefined) {
      if (updates.page > 1) {
        newParams.set("page", String(updates.page))
      } else {
        newParams.delete("page")
      }
    }

    if (updates.search !== undefined) {
      const trimmed = updates.search.trim()
      if (trimmed) {
        newParams.set("search", trimmed)
      } else {
        newParams.delete("search")
      }
    }

    if (updates.category !== undefined) {
      if (updates.category && updates.category !== "الكل") {
        newParams.set("category", updates.category)
      } else {
        newParams.delete("category")
      }
    }

    if (updates.subcategory !== undefined) {
      if (updates.subcategory && updates.subcategory !== "الكل") {
        newParams.set("subcategory", updates.subcategory)
      } else {
        newParams.delete("subcategory")
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "newest") {
        newParams.set("sort", updates.sort)
      } else {
        newParams.delete("sort")
      }
    }

    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

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
  // Fetch Paginated Products from Server
  // =========================
  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    const fetchCurrentPage = async () => {
      try {
        const queryArgs: Parameters<typeof getPaginatedProducts>[0] = {
          page: currentPage,
          per_page: productsPerPage,
          sort_by: sortBy,
        }

        if (searchQuery.trim()) {
          queryArgs.search = searchQuery.trim()
        }

        if (selectedMainCategory === "العروض") {
          queryArgs.only_offers = true
        } else if (selectedSubCategory !== "الكل") {
          queryArgs.category = selectedSubCategory
        } else if (selectedMainCategory !== "الكل") {
          const subs = categoryGroups[selectedMainCategory] || []
          if (subs.length > 0) {
            queryArgs.categories = subs
          } else {
            queryArgs.category = selectedMainCategory
          }
        }

        const res = await getPaginatedProducts(queryArgs)

        if (!isCancelled) {
          setDisplayedProducts(res.data || [])
          setTotalPages(res.last_page || 1)
          setTotalProducts(res.total || 0)
        }
      } catch (err) {
        console.error("Failed to load products for page:", err)
        if (!isCancelled) {
          setDisplayedProducts([])
          setTotalPages(1)
          setTotalProducts(0)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchCurrentPage()

    return () => {
      isCancelled = true
    }
  }, [currentPage, searchQuery, selectedMainCategory, selectedSubCategory, sortBy])

  // =========================
  // Handlers
  // =========================
  const handleSearchSubmit = (val: string) => {
    setSearchInput(val)
    updateUrlParams({ search: val, page: 1 })
  }

  // Debounce search typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateUrlParams({ search: searchInput, page: 1 })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, searchQuery, updateUrlParams])

  const handleMainCategoryChange = (category: string) => {
    updateUrlParams({ category, subcategory: "الكل", page: 1 })
    setTimeout(() => {
      scrollToSection(productsRef)
    }, 100)
  }

  const handleSubCategoryChange = (subCategory: string) => {
    updateUrlParams({ subcategory: subCategory, page: 1 })
    setTimeout(() => {
      scrollToSection(productsRef)
    }, 100)
  }

  const handleSortChange = (value: typeof sortBy) => {
    updateUrlParams({ sort: value, page: 1 })
  }

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    updateUrlParams({ page })
    setTimeout(() => {
      if (productsRef.current) {
        const yOffset = -120
        const y = productsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset
        window.scrollTo({ top: y, behavior: "smooth" })
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }, 50)
  }

  const resetFilters = () => {
    setSearchInput("")
    setSearchParams(new URLSearchParams())
  }

  // =========================
  // Page Numbers List
  // =========================
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push("...")
      }

      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("...")
      }

      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = Math.min(startIndex + productsPerPage, totalProducts)

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
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

      {/* Filters */}
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3 pr-12 pl-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/20"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit("")}
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

      {/* Products Grid Section */}
      <section ref={productsRef} className="py-6 sm:py-12">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          {loading ? (
            /* Loading State */
            <div className="py-20 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#17656b]" />
              <p className="mt-4 text-base font-bold text-slate-600">جاري تحميل المنتجات...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
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
                    {totalProducts === 0 ? 0 : startIndex + 1}
                  </span>
                  {" "}إلى{" "}
                  <span className="rounded-lg bg-[#17656b]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold text-[#17656b]">
                    {endIndex}
                  </span>
                  {" "}من{" "}
                  <span className="rounded-lg bg-[#17656b]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold text-[#17656b]">
                    {totalProducts}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => changePage(currentPage - 1)}
                    className="flex h-10 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition-all duration-300 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    السابق
                  </button>

                  {pageNumbers.map((page, idx) =>
                    typeof page === "string" ? (
                      <span
                        key={`dots-${idx}`}
                        className="flex h-10 w-10 items-center justify-center text-sm font-black text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => changePage(page)}
                        className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition-all duration-300 ${currentPage === page
                            ? "bg-[#17656b] text-white shadow-lg shadow-[#17656b]/30 scale-110"
                            : "border-2 border-slate-200 bg-white text-slate-600 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b]"
                          }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => changePage(currentPage + 1)}
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