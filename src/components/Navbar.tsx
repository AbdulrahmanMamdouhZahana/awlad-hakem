import type { RefObject } from "react"
import { useState, useEffect } from "react" // Added missing imports
import { Link } from "react-router-dom"
import Cart from "./Cart"

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

interface CartItem {
  product: iProducts
  quantity: number
}

interface IProps {
  cartCount?: number
  cart?: any[]
  products?: any[]
  onAddToCart?: (...args: any[]) => void
  onIncrease?: (...args: any[]) => void
  onDecrease?: (...args: any[]) => void
  onRemove?: (...args: any[]) => void
  onCheckout?: (...args: any[]) => void

  logoRef?: React.RefObject<HTMLAnchorElement | null>
  hideLogo?: boolean
}


const Navbar = ({
  products = [],
  cartCount = 0,
  cart = [],
  onIncrease = () => {},
  onDecrease = () => {},
  onRemove = () => {},
  onAddToCart = () => {},
  onCheckout = () => {},
  logoRef,
  hideLogo = false,
}: IProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [navReady, setNavReady] = useState(false)
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [scrolled, setScrolled] = useState(false)

  // Search
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<iProducts[]>([])
  const [searchOpen, setSearchOpen] = useState(false)

  // =====================================================
  // CUSTOMER AUTH
  // =====================================================

  const checkCustomerAuth = () => {
    const token = localStorage.getItem("customer_token")
    const user = localStorage.getItem("customer_user")

    if (!token) {
      setIsCustomerLoggedIn(false)
      setCustomerName("")
      return
    }

    setIsCustomerLoggedIn(true)

    if (!user) {
      setCustomerName("")
      return
    }

    try {
      const parsedUser = JSON.parse(user)
      setCustomerName(parsedUser?.name || "")
    } catch {
      setCustomerName("")
    }
  }

  useEffect(() => {
    checkCustomerAuth()

    const handleCustomerAuthChange = () => {
      checkCustomerAuth()
    }

    window.addEventListener("customer-auth-changed", handleCustomerAuthChange)
    window.addEventListener("storage", handleCustomerAuthChange)

    return () => {
      window.removeEventListener("customer-auth-changed", handleCustomerAuthChange)
      window.removeEventListener("storage", handleCustomerAuthChange)
    }
  }, [])

  // =====================================================
  // NAVBAR ANIMATION & SCROLL EFFECT
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      requestAnimationFrame(() => setNavReady(true))
    }, 50)

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const handleCart = () => {
    setCartOpen((prev) => !prev)
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("customer_token")
    localStorage.removeItem("customer_user")
    setIsCustomerLoggedIn(false)
    setCustomerName("")
    window.dispatchEvent(new Event("customer-auth-changed"))
    setMobileMenuOpen(false)
  }

  // =====================================================
  // PRODUCT SEARCH
  // =====================================================

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    const query = value.trim().toLowerCase()

    if (!query) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }

    const results = products.filter((product) => {
      const name = product.name?.toLowerCase() || ""
      const category = product.category?.toLowerCase() || ""
      return name.includes(query) || category.includes(query)
    })

    setSearchResults(results.slice(0, 6))
    setSearchOpen(true)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setSearchOpen(false)
  }

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return
    setSearchOpen(false)
    window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`
  }

  return (
    <nav
      dir="rtl"
      className={`
        sticky
        top-0
        z-50
        w-full
        transition-all
        duration-500
        ease-out
        ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-slate-200/50"
            : "bg-white shadow-sm border-b border-slate-200/80"
        }
        ${
          navReady
            ? "translate-y-0 opacity-100"
            : "-translate-y-6 opacity-0"
        }
      `}
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-8">

        {/* =====================================================
            TOP ROW
        ===================================================== */}

        <div
          className="
            flex
            min-h-[62px]
            items-center
            gap-2
            sm:min-h-[70px]
            sm:gap-3
            lg:min-h-[78px]
            lg:gap-8
          "
        >

          {/* =========================
              Logo
          ========================= */}

          <Link
            ref={logoRef}
            to="/"
            aria-label="أولاد حكيم - الرئيسية"
            onClick={closeMobileMenu}
            className={`
              group
              flex
              shrink-0
              items-center
              transition-all
              duration-700
              ${
                hideLogo
                  ? "pointer-events-none scale-95 opacity-0"
                  : navReady
                    ? "scale-100 opacity-100"
                    : "scale-95 opacity-0"
              }
            `}
          >
            <div
              className="
                flex
                h-16
                w-20
                items-center
                justify-start
                overflow-hidden
                sm:h-18
                sm:w-28
                md:h-20
                md:w-36
                lg:h-22
                lg:w-40
              "
            >
              <img
                src="/main_logo.png"
                alt="أولاد حكيم"
                className="
                  h-full
                  w-full
                  object-contain
                  object-right
                  transition-all
                  duration-500
                  group-hover:scale-105
                  group-hover:brightness-110
                "
              />
            </div>
          </Link>

          {/* =========================
              Desktop Search
          ========================= */}

          <div
            className={`
              hidden
              flex-1
              justify-center
              lg:flex
              transition-all
              duration-700
              ${
                navReady
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              }
            `}
          >
            <div className="relative w-full max-w-[470px] group">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.trim() && setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchSubmit()
                  if (e.key === "Escape") clearSearch()
                }}
                placeholder="ابحث عن منتج..."
                aria-label="ابحث عن منتج"
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50/80
                  px-4
                  pr-12
                  text-sm
                  text-slate-700
                  outline-none
                  placeholder:text-slate-400
                  transition-all
                  duration-300
                  focus:border-[#17656b]
                  focus:bg-white
                  focus:shadow-[0_0_0_4px_rgba(23,101,107,0.12)]
                  hover:border-slate-300
                  hover:bg-white
                "
              />

              <button
                type="button"
                aria-label="بحث"
                className="
                  absolute
                  right-0
                  top-0
                  flex
                  h-11
                  w-12
                  items-center
                  justify-center
                  text-slate-400
                  transition-all
                  duration-300
                  group-hover:text-[#17656b]
                  group-focus-within:text-[#17656b]
                "
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="
                      m21 21-4.35-4.35
                      m1.35-5.15
                      a6.5 6.5 0 1 1-13 0
                      a6.5 6.5 0 0 1 13 0Z
                    "
                  />
                </svg>
              </button>

              {searchOpen && searchQuery.trim() && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-[10000] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="max-h-[360px] overflow-y-auto p-2">
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50"
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl">
                                  📦
                                </div>
                              )}
                            </div>

                            <Link
                              to={`/products/${product.id}`}
                              onClick={clearSearch}
                              className="min-w-0 flex-1 text-right"
                            >
                              <p className="truncate text-sm font-bold text-slate-800">
                                {product.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {product.category}
                              </p>
                              <p className="mt-1 text-sm font-black text-[#17656b]">
                                {Number(product.price).toFixed(2)} ج.م
                              </p>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(product)
                                setSearchOpen(false)
                              }}
                              className="shrink-0 rounded-lg bg-[#17656b] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0f4a4f]"
                            >
                              إضافة للسلة
                            </button>
                          </div>
                        ))}
                      </div>

                      <Link
                        to={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={clearSearch}
                        className="block border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-[#17656b] transition hover:bg-[#eef7f7]"
                      >
                        عرض كل نتائج البحث
                      </Link>
                    </>
                  ) : (
                    <div className="px-5 py-6 text-center">
                      <div className="text-3xl">🔍</div>
                      <p className="mt-2 text-sm font-bold text-slate-700">
                        مفيش منتجات مطابقة
                      </p>
                      <Link
                        to="/products"
                        onClick={clearSearch}
                        className="mt-3 inline-block text-xs font-bold text-[#17656b] hover:underline"
                      >
                        تصفح كل المنتجات
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* =====================================================
              ACTIONS
          ===================================================== */}

          <div
            className="
              mr-auto
              flex
              shrink-0
              items-center
              gap-1
              sm:gap-2
            "
          >

            {/* Favorites */}

            <Link
              to="/favorites"
              aria-label="المفضلة"
              title="المفضلة"
              className="
                hidden
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-slate-50
                text-slate-600
                transition-all
                duration-300
                hover:bg-[#17656b]/10
                hover:text-[#17656b]
                hover:scale-110
                active:scale-95
                sm:flex
                sm:h-10
                sm:w-10
                lg:h-11
                lg:w-11
              "
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="
                    M20.84 4.61
                    a5.5 5.5 0 0 0-7.78 0
                    L12 5.67
                    l-1.06-1.06
                    a5.5 5.5 0 0 0-7.78 7.78
                    L12 21.23
                    l8.84-8.84
                    a5.5 5.5 0 0 0 0-7.78Z
                  "
                />
              </svg>
            </Link>

            {/* Cart */}

            <div className="relative">
              <button
                type="button"
                onClick={handleCart}
                aria-label="السلة"
                aria-expanded={cartOpen}
                className={`
                  relative
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  transition-all
                  duration-300
                  sm:h-10
                  sm:w-10
                  lg:h-11
                  lg:w-11
                  ${
                    cartOpen
                      ? "bg-[#17656b] text-white shadow-lg shadow-[#17656b]/30"
                      : "bg-slate-50 text-slate-600 hover:bg-[#17656b]/10 hover:text-[#17656b] hover:scale-110 active:scale-95"
                  }
                `}
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="
                      M6 7h12
                      l1 13H5L6 7Z
                      M9 7V5
                      a3 3 0 0 1 6 0v2
                    "
                  />
                </svg>

                {cartCount > 0 && (
                  <span
                    className="
                      absolute
                      -right-1
                      -top-1
                      flex
                      h-5
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-[#17656b]
                      px-1.5
                      text-[10px]
                      font-black
                      text-white
                      ring-2
                      ring-white
                      animate-bounce-in
                      sm:h-5
                      sm:min-w-5
                      sm:text-[10px]
                    "
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              {cartOpen && (
                <>
                  {/* Backdrop to close on click outside */}
                  <div
                    className="fixed inset-0 z-[9990]"
                    onClick={() => setCartOpen(false)}
                    aria-hidden="true"
                  />

                  {/* Cart Dropdown */}
                  <div
                    className="
                      fixed
                      left-3
                      right-3
                      top-[66px]
                      z-[9999]
                      animate-slide-down
                      sm:absolute
                      sm:left-0
                      sm:right-auto
                      sm:top-full
                      sm:mt-2.5
                      sm:w-[380px]
                      sm:max-w-[calc(100vw-2rem)]
                    "
                  >
                    <Cart
                      cart={cart}
                      onIncrease={onIncrease}
                      onDecrease={onDecrease}
                      onRemove={onRemove}
                      onClose={() => setCartOpen(false)}
                      onCheckout={() => {
                        setCartOpen(false)
                        onCheckout()
                      }}
                      mode="dropdown"
                    />
                  </div>
                </>
              )}
            </div>

            {/* =========================
                CUSTOMER ACCOUNT - DESKTOP
            ========================= */}            {isCustomerLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  className="
                    hidden h-9 items-center gap-2 rounded-xl
                    bg-gradient-to-r from-[#17656b] to-[#0f4a4f]
                    px-3 text-xs font-bold text-white
                    shadow-md shadow-[#17656b]/30
                    transition-all duration-300 hover:shadow-lg
                    hover:shadow-[#17656b]/40 hover:scale-105 active:scale-95
                    sm:flex sm:h-10 sm:px-4 lg:h-11 lg:px-5 lg:text-sm
                  "
                >
                  <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                    />
                  </svg>

                  <span className="hidden md:inline">حسابي</span>

                  {customerName && (
                    <span className="hidden lg:inline max-w-[100px] truncate text-white/80">
                      {customerName}
                    </span>
                  )}
                </Link>

                <Link
                  to="/customer/orders"
                  aria-label="طلباتي"
                  title="طلباتي"
                  className="
                    hidden h-9 w-9 items-center justify-center rounded-full
                    bg-slate-50 text-slate-600 transition-all duration-300
                    hover:bg-[#17656b]/10 hover:text-[#17656b] hover:scale-110
                    active:scale-95 sm:flex sm:h-10 sm:w-10 lg:h-11 lg:w-11
                  "
                >
                  <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M4 5h16v14H4zM8 9h8M8 13h5"
                    />
                  </svg>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="تسجيل الخروج"
                  title="تسجيل الخروج"
                  className="
                    hidden h-9 w-9 items-center justify-center rounded-full
                    bg-red-50 text-red-600 transition-all duration-300
                    hover:bg-red-100 hover:text-red-700 hover:scale-110
                    active:scale-95 sm:flex sm:h-10 sm:w-10 lg:h-11 lg:w-11
                  "
                >
                  <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <Link
                to="/customer/login"
                className="
                  hidden
                  h-9
                  items-center
                  gap-1.5
                  rounded-xl
                  bg-gradient-to-r
                  from-[#17656b]
                  to-[#0f4a4f]
                  px-3
                  text-xs
                  font-bold
                  text-white
                  shadow-md
                  shadow-[#17656b]/30
                  transition-all
                  duration-300
                  hover:shadow-lg
                  hover:shadow-[#17656b]/40
                  hover:scale-105
                  active:scale-95
                  sm:flex
                  sm:h-10
                  sm:px-4
                  lg:h-11
                  lg:px-5
                  lg:text-sm
                "
              >
                <svg
                  className="h-4 w-4 lg:h-5 lg:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="
                      M15 21v-2
                      a4 4 0 0 0-4-4H7
                      a4 4 0 0 0-4 4v2
                      M9 11
                      a4 4 0 1 0 0-8
                      a4 4 0 0 0 0 8Z
                      M17 8h4
                      M19 6v4
                    "
                  />
                </svg>

                <span className="hidden md:inline">
                  تسجيل الدخول
                </span>
              </Link>
            )}

            {/* Mobile Menu Button */}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen((prev) => !prev)
                setCartOpen(false)
              }}
              aria-label="القائمة"
              aria-expanded={mobileMenuOpen}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                text-slate-600
                transition-all
                duration-300
                hover:bg-slate-100
                hover:scale-110
                active:scale-95
                sm:h-10
                sm:w-10
                lg:hidden
              "
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 6l12 12M18 6 6 18"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* =====================================================
            MOBILE SEARCH
        ===================================================== */}

        <div className="pb-3 lg:hidden animate-fade-in">
          <div className="relative group">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.trim() && setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchSubmit()
                if (e.key === "Escape") clearSearch()
              }}
              placeholder="ابحث عن منتج..."
              aria-label="ابحث عن منتج"
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50/80
                px-3
                pr-10
                text-sm
                outline-none
                placeholder:text-slate-400
                transition-all
                duration-300
                focus:border-[#17656b]
                focus:bg-white
                focus:shadow-[0_0_0_4px_rgba(23,101,107,0.12)]
                hover:border-slate-300
                hover:bg-white
                sm:h-11
                sm:px-4
                sm:pr-12
              "
            />

            <svg
              className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
                transition-colors
                duration-300
                group-focus-within:text-[#17656b]
                sm:right-4
                sm:h-5
                sm:w-5
              "
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="
                  m21 21-4.35-4.35
                  m1.35-5.15
                  a6.5 6.5 0 1 1-13 0
                  a6.5 6.5 0 0 1 13 0Z
                "
              />
            </svg>

            {searchOpen && searchQuery.trim() && (
              <div className="absolute right-0 left-0 top-[calc(100%+6px)] z-[10000] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {searchResults.length > 0 ? (
                  <div className="max-h-[320px] overflow-y-auto p-2">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 rounded-xl p-2.5 transition hover:bg-slate-50"
                      >
                        <Link
                          to={`/products/${product.id}`}
                          onClick={clearSearch}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                📦
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 text-right">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400">{product.category}</p>
                            <p className="text-sm font-black text-[#17656b]">
                              {Number(product.price).toFixed(2)} ج.م
                            </p>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(product)
                            setSearchOpen(false)
                          }}
                          className="shrink-0 rounded-lg bg-[#17656b] px-2.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#0f4a4f]"
                        >
                          إضافة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <div className="text-2xl">🔍</div>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      مفيش منتجات مطابقة
                    </p>
                  </div>
                )}

                <Link
                  to={`/products?search=${encodeURIComponent(searchQuery.trim())}`}
                  onClick={clearSearch}
                  className="block border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-[#17656b]"
                >
                  عرض كل النتائج
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            DESKTOP NAVIGATION
        ===================================================== */}

        <div
          className="
            hidden
            h-[58px]
            items-center
            border-t
            border-slate-100/80
            lg:flex
          "
        >
          <div className="flex w-full items-center justify-between">

            <button
  type="button"
  onClick={() => {
    document.getElementById("categories")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }}
  className="
    flex
    items-center
    gap-2
    text-sm
    font-medium
    text-slate-700
    transition-all
    duration-300
    hover:text-[#17656b]
    hover:scale-105
    group
  "
>
  <svg
    className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="5" cy="5" r="1.7" />
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="19" cy="5" r="1.7" />
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
    <circle cx="5" cy="19" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
    <circle cx="19" cy="19" r="1.7" />
  </svg>

  تصفح الأقسام
</button>

            <div className="flex items-center gap-6 xl:gap-8">
              {["/", "/products", "#"].map((path, index) => {
                const labels = ["الرئيسية", "المنتجات", "اتصل بنا"]
                return (
                  <Link
                    key={path}
                    to={path}
                    className="
                      relative
                      text-sm
                      font-medium
                      text-slate-600
                      transition-all
                      duration-300
                      hover:text-[#17656b]
                      hover:scale-105
                      after:absolute
                      after:bottom-0
                      after:right-0
                      after:h-[2px]
                      after:w-0
                      after:bg-[#17656b]
                      after:transition-all
                      after:duration-300
                      hover:after:w-full
                    "
                  >
                    {labels[index]}
                  </Link>


                  
                )
              })}

              
            </div>
          </div>
        </div>

        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        <div
          className={`
            overflow-hidden
            transition-all
            duration-500
            ease-in-out
            lg:hidden
            ${
              mobileMenuOpen
                ? "max-h-[800px] opacity-100"
                : "pointer-events-none max-h-0 opacity-0"
            }
          `}
        >
          <div className="border-t border-slate-100 py-2 space-y-0.5">

            {[
              { to: "/", label: "الرئيسية", icon: "" },
              { to: "/products", label: "المنتجات", icon: "" },
              { to: "/categories", label: "الأقسام", icon: "" },
              { to: "/favorites", label: "♡ المفضلة", icon: "" },
              { to: "/contact", label: "اتصل بنا", icon: "" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-slate-700
                  transition-all
                  duration-300
                  hover:bg-[#17656b]/5
                  hover:text-[#17656b]
                  hover:translate-x-1
                  active:scale-95
                "
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <div className="my-3 border-t border-slate-100" />

            {/* Mobile Customer Account */}

            {isCustomerLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    bg-gradient-to-r
                    from-[#17656b]/10
                    to-[#0f4a4f]/10
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-[#17656b]
                    transition-all
                    duration-300
                    hover:from-[#17656b]/20
                    hover:to-[#0f4a4f]/20
                    hover:scale-[1.02]
                    active:scale-95
                  "
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="
                        M15 21v-2
                        a4 4 0 0 0-4-4H7
                        a4 4 0 0 0-4 4v2
                        M9 11
                        a4 4 0 1 0 0-8
                        a4 4 0 0 0 0 8Z
                      "
                    />
                  </svg>

                  <span>حسابي</span>

                  {customerName && (
                    <span className="mr-auto max-w-[130px] truncate text-xs font-medium text-slate-500">
                      {customerName}
                    </span>
                  )}
                </Link>

                <Link
                  to="/customer/orders"
                  onClick={closeMobileMenu}
                  className="
                    flex items-center gap-3 rounded-xl px-4 py-3
                    text-sm font-bold text-slate-700 transition-all duration-300
                    hover:bg-[#17656b]/5 hover:text-[#17656b]
                    hover:scale-[1.02] active:scale-95
                  "
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M4 5h16v14H4zM8 9h8M8 13h5"
                    />
                  </svg>
                  طلباتي
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    text-right
                    text-sm
                    font-bold
                    text-red-600
                    transition-all
                    duration-300
                    hover:bg-red-50
                    hover:scale-[1.02]
                    active:scale-95
                  "
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/customer/login"
                  onClick={closeMobileMenu}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-[#17656b]
                    transition-all
                    duration-300
                    hover:bg-[#17656b]/5
                    hover:scale-[1.02]
                    active:scale-95
                  "
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                  تسجيل الدخول
                </Link>

                <Link
                  to="/customer/register"
                  onClick={closeMobileMenu}
                  className="
                    flex
                    items-center
                    justify-center
                    gap-3
                    rounded-xl
                    bg-gradient-to-r
                    from-[#17656b]
                    to-[#0f4a4f]
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-white
                    shadow-md
                    shadow-[#17656b]/30
                    transition-all
                    duration-300
                    hover:shadow-lg
                    hover:shadow-[#17656b]/40
                    hover:scale-[1.02]
                    active:scale-95
                  "
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                  </svg>
                  إنشاء حساب جديد
                </Link>
              </>
            )}

          </div>
        </div>

      </div>

      {/* Add animation keyframes */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </nav>
  )
}

export default Navbar