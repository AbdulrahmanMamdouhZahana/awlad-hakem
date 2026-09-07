import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import Products from "../components/Products"
import { getAllCustomerProducts } from "../services/productService"
import { BackToTop } from "../components/UI/BackToTop"
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  SparklesIcon,
  Squares2X2Icon,
  TagIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  BookOpenIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

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
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(true)

  // =========================
  // Refs
  // =========================
  const categoriesRef = useRef<HTMLDivElement>(null)
  const productsRef = useRef<HTMLDivElement>(null)

  // =========================
  // Categories Definitions
  // =========================
  const categoryGroups: Record<string, string[]> = useMemo(() => {
    const base: Record<string, string[]> = {
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
    };

    displayedProducts.forEach((p) => {
      const cat = p.category?.trim();
      if (!cat) return;
      const alreadyMapped = Object.values(base).some((subs) => subs.includes(cat));
      if (!alreadyMapped) {
        if (
          cat.includes("بن ") ||
          cat.includes("مكسرات") ||
          cat.includes("تسالي") ||
          cat.includes("محمص") ||
          cat.includes("لب ") ||
          cat.includes("المقلاة")
        ) {
          base["المحمصة"].push(cat);
        } else if (
          cat.includes("كشكول") ||
          cat.includes("كرسات") ||
          cat.includes("قلم") ||
          cat.includes("مكتب") ||
          cat.includes("ورق") ||
          cat.includes("ادوات") ||
          cat.includes("وصلات") ||
          cat.includes("اعياد ميلاد")
        ) {
          base["المكتبة"].push(cat);
        } else {
          base["السوبر ماركت"].push(cat);
        }
      }
    });

    return base;
  }, [displayedProducts]);


  const mainCategories = Object.keys(categoryGroups)

  const getSubCategories = (mainCategory: string): string[] => {
    return categoryGroups[mainCategory] || []
  }

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "السوبر ماركت":
        return <ShoppingCartIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
      case "المكتبة":
        return <BookOpenIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
      case "المحمصة":
        return <SparklesIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
      default:
        return <TagIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
    }
  }

  // =========================
  // URL Update Helper
  // =========================
  const updateUrlParams = useCallback((updates: {
    search?: string
    category?: string
    subcategory?: string
    sort?: string
  }) => {
    const newParams = new URLSearchParams(searchParams)

    // Ensure page parameter is completely removed
    newParams.delete("page")

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
  // SEO & Structured Data
  // =========================
  useEffect(() => {
    const categoryTitle =
      selectedMainCategory !== "الكل"
        ? `${selectedMainCategory} ${selectedSubCategory !== "الكل" ? `- ${selectedSubCategory}` : ""}`
        : "جميع المنتجات"

    document.title = `${categoryTitle} | أولاد الحكيم`

    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement("meta")
      metaDesc.setAttribute("name", "description")
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute(
      "content",
      `تسوق ${categoryTitle} من أولاد الحكيم بأفضل الأسعار وأعلى جودة مع توصيل سريع لجميع الطلبات.`
    )

    let metaRobots = document.querySelector('meta[name="robots"]')
    if (!metaRobots) {
      metaRobots = document.createElement("meta")
      metaRobots.setAttribute("name", "robots")
      document.head.appendChild(metaRobots)
    }
    metaRobots.setAttribute("content", "index, follow")

    const structuredDataId = "products-json-ld"
    let script = document.getElementById(structuredDataId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement("script")
      script.id = structuredDataId
      script.type = "application/ld+json"
      document.head.appendChild(script)
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "الرئيسية",
          item: window.location.origin,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "المنتجات",
          item: `${window.location.origin}/products`,
        },
        ...(selectedMainCategory !== "الكل"
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: selectedMainCategory,
                item: `${window.location.origin}/products?category=${encodeURIComponent(selectedMainCategory)}`,
              },
            ]
          : []),
      ],
    }
    script.textContent = JSON.stringify(schemaData)

    return () => {
      const el = document.getElementById(structuredDataId)
      if (el) el.remove()
    }
  }, [selectedMainCategory, selectedSubCategory])

  // =========================
  // Fetch All Customer Products from Server (No Pagination)
  // =========================
  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    const fetchCatalog = async () => {
      try {
        const queryArgs: Parameters<typeof getAllCustomerProducts>[0] = {
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

        const res = await getAllCustomerProducts(queryArgs)

        if (!isCancelled) {
          setDisplayedProducts(res.data || [])
          setTotalProducts(res.total || (res.data ? res.data.length : 0))
        }
      } catch (err) {
        console.error("Failed to load customer products:", err)
        if (!isCancelled) {
          setDisplayedProducts([])
          setTotalProducts(0)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchCatalog()

    return () => {
      isCancelled = true
    }
  }, [searchQuery, selectedMainCategory, selectedSubCategory, sortBy])

  // =========================
  // Handlers
  // =========================
  const handleSearchSubmit = (val: string) => {
    setSearchInput(val)
    updateUrlParams({ search: val })
  }

  // Debounce search typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateUrlParams({ search: searchInput })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, searchQuery, updateUrlParams])

  const handleMainCategoryChange = (category: string) => {
    updateUrlParams({ category, subcategory: "الكل" })
    setTimeout(() => {
      scrollToSection(productsRef)
    }, 100)
  }

  const handleSubCategoryChange = (subCategory: string) => {
    updateUrlParams({ subcategory: subCategory })
    setTimeout(() => {
      scrollToSection(productsRef)
    }, 100)
  }

  const handleSortChange = (value: typeof sortBy) => {
    updateUrlParams({ sort: value })
  }

  const resetFilters = () => {
    setSearchInput("")
    setSearchParams(new URLSearchParams())
  }

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

              <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                <ShoppingBagIcon className="h-10 w-10 text-amber-300 sm:h-12 sm:w-12 shrink-0" aria-hidden="true" />
                <span>كل المنتجات</span>
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
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ابحث باسم المنتج أو القسم الفرعي أو الشركة..."
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3 pr-12 pl-10 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/20"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit("")}
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    aria-label="مسح البحث"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
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
                className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${selectedMainCategory === "الكل" && selectedSubCategory === "الكل"
                    ? "bg-[#17656b] text-white shadow-lg shadow-[#17656b]/30"
                    : "border-2 border-slate-200 bg-white text-slate-600 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b] hover:shadow-md"
                  }`}
              >
                <Squares2X2Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>كل المنتجات</span>
              </button>

              <button
                type="button"
                onClick={() => handleMainCategoryChange("العروض")}
                className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                  selectedMainCategory === "العروض"
                    ? "bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg shadow-red-500/30"
                    : "border-2 border-red-200 bg-white text-red-600 hover:border-red-400 hover:bg-red-50 hover:shadow-md"
                }`}
              >
                <SparklesIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>العروض والتخفيضات</span>
              </button>

              {mainCategories.map((mainCategory) => {
                const active = selectedMainCategory === mainCategory
                return (
                  <button
                    key={mainCategory}
                    type="button"
                    onClick={() => handleMainCategoryChange(mainCategory)}
                    className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${active
                        ? "bg-[#17656b] text-white shadow-lg shadow-[#17656b]/30"
                        : "border-2 border-slate-200 bg-white text-slate-600 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b] hover:shadow-md"
                      }`}
                  >
                    {renderCategoryIcon(mainCategory)}
                    <span>{mainCategory}</span>
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
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-300 ${selectedSubCategory === "الكل"
                      ? "bg-[#17656b] text-white shadow-md"
                      : "border-2 border-slate-200 bg-slate-50 text-slate-600 hover:border-[#17656b] hover:bg-[#eef7f7] hover:text-[#17656b]"
                    }`}
                >
                  <Squares2X2Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>كل الأقسام</span>
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
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#17656b]/10 to-[#17656b]/20 text-slate-600">
                <MagnifyingGlassIcon className="h-10 w-10 text-[#17656b]" aria-hidden="true" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-800">
                لم يتم العثور على منتجات مطابقة لبحثك.
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                جرب البحث باسم منتج أو قسم فرعي أو شركة أخرى، أو اختر قسمًا مختلفًا
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#17656b] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#17656b]/30 transition hover:scale-105 hover:shadow-xl"
              >
                <ArrowPathIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>عرض كل المنتجات</span>
              </button>
            </div>
          ) : (
            <>
              {/* Results Info */}
              <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 px-1 sm:px-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500">
                  عرض جميع المنتجات (
                  <span className="rounded-lg bg-[#17656b]/10 px-2 py-0.5 font-bold text-[#17656b]">
                    {totalProducts}
                  </span>
                  {" "}منتج)
                </p>

                {selectedMainCategory !== "الكل" && (
                  <button
                    type="button"
                    onClick={() => scrollToSection(categoriesRef)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#17656b] hover:underline"
                  >
                    <ChevronUpIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>العودة للأقسام</span>
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
            </>
          )}
        </div>
      </section>

      {/* Floating Back to Top Button with SVG Circular Progress Ring */}
      <BackToTop />
    </main>
  )
}

export default ProductsPage