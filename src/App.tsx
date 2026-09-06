import { useState, useEffect, useRef } from "react"
import toast, { Toaster } from "react-hot-toast"
import { Navigate, Outlet, Routes, Route, useLocation, useNavigate } from "react-router-dom"
import CustomerOrders from "./pages/CustomerOrders"

import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import TrustBar from "./components/TrustBar"
import HeaderProducts from "./components/HeaderProducts"
// import CTA from "./components/CTA"
import Footer from "./components/Footer"

// import AdminLayout from "./components/Admin/AdminLayout"
import Dashboard from "./components/Admin/Dashboard"
import Orders from "./components/Admin/Orders"
import AdminLayout from "./components/Admin/AdminLayout"


import AdminProducts from "./components/Admin/Products"



import ProductsPage from "./pages/ProductsPage"

import Checkout from "./components/Checkout"
import Cart from "./components/Cart"


import { getProducts } from "./services/productService"
import { apiFetch } from "./services/api"


import AdminLogin from "./pages/Login"
import CustomerLogin from "./pages/CustomerLogin"
import Profile from "./pages/Profile"
import Favorites from "./pages/Favorites"
import CustomerRegister from "./pages/CustomerRegister"
import CustomerProfile from "./pages/CustomerProfile"

import AdminDeliveries from "./components/Admin/Deliveries"
import DeliveryDashboard from "./pages/DeliveryDashboard"
import DeliveryProfile from "./pages/DeliveryProfile"
import DeliveryLayout from "./pages/DeliveryLayout"

import {
  getCart,
  saveCart,
} from "./services/cartService"

import { getActiveOffer } from "./services/offerService"

// =====================================
// Product Type
// =====================================

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

// =====================================
// Cart Type
// =====================================

export interface CartItem {
  product: iProducts
  quantity: number
  saleType: "piece" | "weight"
  weight?: number
  unitPrice: number
}

// =====================================
// Store Props
// =====================================

interface StoreProps {
  products: iProducts[]
  productsLoading: boolean
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  cartCount: number
  addToCart: (
    product: iProducts,
    options?: {
      saleType?: "piece" | "weight"
      weight?: number
    }
  ) => void
  increaseQuantity: (productId: number) => void
  decreaseQuantity: (productId: number) => void
  removeFromCart: (productId: number) => void
  checkoutOpen: boolean
  setCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>
}

// =====================================
// Products Request Cache
// =====================================

// =====================================
// Products Request Cache
// =====================================

let productsRequest: Promise<iProducts[]> | null = null

const loadProductsOnce = async (): Promise<iProducts[]> => {

  // =====================================
  // Always load fresh products from API
  // so admin price/sale-type changes
  // appear immediately for customers.
  // =====================================

  if (productsRequest) {
    return productsRequest
  }

  productsRequest = getProducts()
    .then((data) => {

      const products =
        Array.isArray(data)
          ? data
          : []

      return products
    })
    .catch((error) => {

      productsRequest = null

      throw error
    })

  return productsRequest
}

// =====================================
// Store
// =====================================

function Store({
  products,
  productsLoading,
  cart,
  setCart,
  cartCount,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  checkoutOpen,
  setCheckoutOpen,
}: StoreProps) {

  // =========================
  // Loader
  // =========================

  const [showLoader, setShowLoader] =
    useState(true)

  // Loader stays visible for at least 2 seconds.
  const [minimumTimePassed, setMinimumTimePassed] =
    useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinimumTimePassed(true)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [])

  // Splash animation state
  const [splashPhase, setSplashPhase] =
    useState<"loading" | "moving" | "done">(
      "loading"
    )

  // Floating splash logo
  const splashLogoRef =
    useRef<HTMLDivElement | null>(null)

  // =========================
  // Welcome Account Popup
  // =========================

  const [showWelcomePopup, setShowWelcomePopup] =
    useState(false)

  const navigate = useNavigate()

  // =========================
  // Product Loading / Splash
  // =========================
  // Start the logo transition only after BOTH:
  // - 3 seconds have passed
  // - the products request has finished
  useEffect(() => {
    if (!minimumTimePassed || productsLoading) {
      return
    }

    setSplashPhase("moving")
  }, [minimumTimePassed, productsLoading])

  // =========================
  // Welcome Account Popup - SHOW IMMEDIATELY
  // =========================
  // The popup appears as soon as the splash screen finishes.
  // Logged-in users do not see it.
  // "Continue shopping" hides it for this browser tab.

  useEffect(() => {
    // Don't show popup while splash is loading
    if (showLoader) {
      return
    }

    const token = localStorage.getItem("customer_token")

    if (token) {
      setShowWelcomePopup(false)
      return
    }

    const alreadyShown =
      sessionStorage.getItem("welcome_popup_shown")

    if (alreadyShown === "true") {
      setShowWelcomePopup(false)
      return
    }

    // Show popup immediately after splash
    setShowWelcomePopup(true)
  }, [showLoader])

  const closeWelcomePopup = () => {
    sessionStorage.setItem(
      "welcome_popup_shown",
      "true"
    )

    setShowWelcomePopup(false)
  }

  // =========================
  // Finish Splash Transition
  // =========================

  useEffect(() => {
    if (splashPhase !== "moving") {
      return
    }

    const timer = window.setTimeout(() => {
      setSplashPhase("done")
    }, 900)

    return () => window.clearTimeout(timer)
  }, [splashPhase])

  // =========================
  // Remove Splash
  // =========================

  useEffect(() => {

    if (splashPhase !== "done") {
      return
    }

    const timer = setTimeout(() => {
      setShowLoader(false)
    }, 550)

    return () => {
      clearTimeout(timer)
    }

  }, [splashPhase])

  // =========================
  // Navbar
  // =========================

  const navbar = (
  <Navbar
    cartCount={cartCount}
    cart={cart}
    products={products}
    onAddToCart={addToCart}
    onIncrease={increaseQuantity}
    onDecrease={decreaseQuantity}
    onRemove={removeFromCart}
    onCheckout={() => {
      if (cart.length === 0) {
        toast.error("السلة فارغة")
        return
      }

      const token = localStorage.getItem("customer_token")

      if (!token) {
        setShowWelcomePopup(true)
        return
      }

      setCheckoutOpen(true)
    }}
  />
)
  // =========================
  // Main Store
  // =========================

  return (

    <div
      dir="rtl"
      className="min-h-screen bg-white"
    >

      {/* =====================================
          Website
      ===================================== */}

      <Routes>

        {/* =========================
            Home
        ========================= */}

        <Route
          path="/"
          element={
            <>
              {navbar}

              <Hero />



              <HeaderProducts
                products={products}
                onAddToCart={addToCart}
              />

              <TrustBar />

              <Footer />
            </>
          }
        />

        {/* =========================
            Products
        ========================= */}

        <Route
          path="/products"
          element={
            <>
              {navbar}

              <ProductsPage
                products={products}
                onAddToCart={addToCart}
              />
            </>
          }
        />

        {/* =========================
            Favorites
        ========================= */}

             {/* =========================
          Favorites
      ========================= */}

      <Route
        path="/favorites"
        element={
          <>
            {navbar}

            <Favorites
              products={products}
              onAddToCart={addToCart}
            />
          </>
        }
      />

      {/* =========================
          Cart
      ========================= */}

      <Route
        path="/cart"
        element={
          <>
            {navbar}

            <Cart
              cart={cart}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              onRemove={removeFromCart}
              onClose={() => {}}
              onCheckout={() => {
                if (cart.length === 0) {
                  toast.error("السلة فارغة")
                  return
                }

                const token =
                  localStorage.getItem("customer_token")

                if (!token) {
                  setShowWelcomePopup(true)
                  return
                }

                setCheckoutOpen(true)
              }}
              mode="page"
            />
          </>
        }
      />

    </Routes>
      

      {/* =====================================
          Welcome Account Popup
      ===================================== */}

      {showWelcomePopup && (
        <div
          dir="rtl"
          className="
            fixed
            inset-0
            z-[10000]
            flex
            items-center
            justify-center
            bg-slate-950/55
            px-4
            backdrop-blur-sm
            animate-in
            fade-in
            zoom-in-95
            duration-300
          "
          onClick={closeWelcomePopup}
        >
          <div
            className="
              relative
              w-full
              max-w-sm
              overflow-hidden
              rounded-[28px]
              bg-white
              p-6
              shadow-2xl
              sm:p-8
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeWelcomePopup}
              aria-label="إغلاق"
              className="
                absolute
                left-4
                top-4
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-slate-100
                text-slate-500
                transition
                hover:bg-slate-200
              "
            >
              <svg
                className="h-4 w-4"
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
            </button>

            {/* Logo */}
            <div className="flex justify-center">
              <div
                className="
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-3xl
                  bg-indigo-50
                  p-3
                "
              >
                <img
                  src="/main_logo.png"
                  alt="أولاد الحكيم"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Text */}
            <div className="mt-5 text-center">
              <h2 className="text-2xl font-black text-slate-900">
                أهلاً بيك في أولاد الحكيم 👋
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                هل لديك حساب بالفعل؟
                <br />
                سجل دخولك للاستفادة من كل مميزات الموقع.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={() => {
                  closeWelcomePopup()
                  navigate("/customer/login")
                }}
                className="
                  w-full
                  rounded-xl
                  bg-indigo-600
                  px-5
                  py-3.5
                  text-sm
                  font-black
                  text-white
                  shadow-lg
                  shadow-indigo-600/20
                  transition
                  hover:bg-indigo-700
                "
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                onClick={() => {
                  closeWelcomePopup()

                  navigate("/customer/login")
                }}
                className="
                  w-full
                  rounded-xl
                  border
                  border-indigo-200
                  bg-indigo-50
                  px-5
                  py-3.5
                  text-sm
                  font-black
                  text-indigo-700
                  transition
                  hover:bg-indigo-100
                "
              >
                إنشاء حساب جديد
              </button>

              <button
                type="button"
                onClick={closeWelcomePopup}
                className="
                  w-full
                  rounded-xl
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-slate-400
                  transition
                  hover:bg-slate-50
                  hover:text-slate-600
                "
              >
                متابعة التسوق كزائر
              </button>
            </div>

            <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
              يمكنك تصفح المنتجات بدون حساب،
              <br />
              لكن يلزم تسجيل الدخول لإتمام الشراء.
            </p>
          </div>
        </div>
      )}

      {/* =====================================
          SPLASH SCREEN
      ===================================== */}

      {showLoader && (

        <div
          className={`
            fixed
            inset-0
            z-[9999]
            overflow-hidden
            bg-white
            transition-opacity
            duration-500
            ease-out
            ${
              splashPhase === "done"
                ? "pointer-events-none opacity-0"
                : "opacity-100"
            }
          `}
        >

          {/* Logo */}

          <div
            ref={splashLogoRef}
            className="
              fixed
              z-30
              flex
              items-center
              justify-center
              transition-all
              duration-[1200ms]
              ease-[cubic-bezier(0.22,1,0.36,1)]
            "
            style={{
              left: "50%",
              top: "50%",
              width: "144px",
              height: "144px",
              transform: "translate(-50%, -50%)",
            }}
          >

            {/* Spinner */}

            <div
              className={`
                absolute
                inset-0
                rounded-full
                border-[3px]
                border-slate-200
                border-t-indigo-600
                border-r-indigo-400
                transition-all
                duration-500
                ${
                  splashPhase === "loading"
                    ? "animate-spin opacity-100"
                    : "scale-125 opacity-0"
                }
              `}
            />

            {/* Inner Ring */}

            <div
              className={`
                absolute
                inset-3
                rounded-full
                border
                border-indigo-100
                transition-all
                duration-700
                ${
                  splashPhase === "loading"
                    ? "scale-100 opacity-100"
                    : "scale-125 opacity-0"
                }
              `}
            />

            {/* Logo */}

            <div
              className="
                relative
                flex
                h-full
                w-full
                items-center
                justify-center
                overflow-hidden
                rounded-full
                transition-all
                duration-300
              "
            >

              <img
                src="/main_logo.png"
                alt="أولاد الحكيم"
                className="
                  h-full
                  w-full
                  object-contain
                  p-2
                "
              />

            </div>

          </div>

          {/* Loading Text */}

          <div
            className={`
              absolute
              left-1/2
              top-[calc(50%+125px)]
              -translate-x-1/2
              text-center
              transition-all
              duration-500
              ${
                splashPhase === "loading"
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }
            `}
          >

            <h1
              className="
                text-xl
                font-black
                tracking-tight
                text-slate-900
              "
            >
              أولاد الحكيم
            </h1>

            <p
              className="
                mt-2
                text-sm
                font-medium
                text-slate-500
              "
            >
              كل احتياجاتك في مكان واحد
            </p>

            <p
              className="
                mt-2
                text-xs
                text-slate-400
              "
            >
              جاري تحميل المنتجات...
            </p>

        {/* Loading Dots */}

            <div
              className="
                mt-4
                flex
                justify-center
                gap-1.5
              "
            >

              <span
                className="
                  h-1.5
                  w-1.5
                  animate-bounce
                  rounded-full
                  bg-indigo-600
                  [animation-delay:-0.3s]
                "
              />

              <span
                className="
                  h-1.5
                  w-1.5
                  animate-bounce
                  rounded-full
                  bg-indigo-500
                  [animation-delay:-0.15s]
                "
              />

              <span
                className="
                  h-1.5
                  w-1.5
                  animate-bounce
                  rounded-full
                  bg-indigo-400
                "
              />

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

// =====================================
// Customer Register
// =====================================



// =====================================
// Admin Guard
// =====================================

function AdminGuard() {
  const location = useLocation()
  const [authenticated, setAuthenticated] =
    useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("staff_token")
    const userRaw = localStorage.getItem("staff_user")

    let isAdmin = false

    try {
      const user = userRaw
        ? JSON.parse(userRaw)
        : null

      isAdmin =
        Boolean(token) &&
        user?.role === "admin"
    } catch {
      isAdmin = false
    }

    setAuthenticated(isAdmin)
  }, [])

  if (authenticated === null) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-100"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            جاري تحميل لوحة التحكم...
          </p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}


// =====================================
// Delivery Guard
// =====================================

function DeliveryGuard() {
  const location = useLocation()
  const [authenticated, setAuthenticated] =
    useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("staff_token")
    const userRaw = localStorage.getItem("staff_user")

    let isDelivery = false

    try {
      const user = userRaw
        ? JSON.parse(userRaw)
        : null

      isDelivery =
        Boolean(token) &&
        user?.role === "delivery"
    } catch {
      isDelivery = false
    }

    setAuthenticated(isDelivery)
  }, [])

  if (authenticated === null) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-100"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            جاري تحميل صفحة الدليفري...
          </p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}

// =====================================
// App / Routes
// =====================================

// =====================================
// Global Admin New Order Notification
// =====================================

interface AdminNotificationOrder {
  id: number
  customer_name?: string
  total?: number
}

function AdminOrderNotifier() {
  const knownOrderIdsRef = useRef<Set<number>>(new Set())
  const firstLoadRef = useRef(true)
  const audioContextRef = useRef<AudioContext | null>(null)

  const isAdmin = () => {
    const token = localStorage.getItem("staff_token")
    const userRaw = localStorage.getItem("staff_user")

    if (!token || !userRaw) return false

    try {
      return JSON.parse(userRaw)?.role === "admin"
    } catch {
      return false
    }
  }

  const playNotificationSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext
        }).webkitAudioContext

      if (!AudioContextClass) return

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      const context = audioContextRef.current

      if (context.state === "suspended") {
        void context.resume()
      }

      const now = context.currentTime

      ;[0, 0.2].forEach((offset, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()

        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(
          index === 0 ? 880 : 1175,
          now + offset
        )

        gain.gain.setValueAtTime(0.0001, now + offset)
        gain.gain.exponentialRampToValueAtTime(
          0.25,
          now + offset + 0.02
        )
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + offset + 0.17
        )

        oscillator.connect(gain)
        gain.connect(context.destination)

        oscillator.start(now + offset)
        oscillator.stop(now + offset + 0.18)
      })
    } catch (error) {
      console.warn("ADMIN ORDER SOUND ERROR:", error)
    }
  }

  const showNotification = (order: AdminNotificationOrder) => {
    playNotificationSound()

    toast.custom(
      (toastInstance) => (
        <button
          type="button"
          onClick={() => toast.dismiss(toastInstance.id)}
          className="w-[min(92vw,420px)] rounded-2xl border border-indigo-200 bg-white p-4 text-right shadow-2xl ring-1 ring-black/5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
              🔔
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-indigo-700">
                طلب جديد 🎉
              </p>

              <p className="mt-1 text-sm font-black text-slate-900">
                الطلب #{order.id}
              </p>

              {order.customer_name && (
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                  العميل: {order.customer_name}
                </p>
              )}

              {order.total !== undefined && (
                <p className="mt-1 text-xs font-bold text-emerald-600">
                  الإجمالي: {Number(order.total || 0).toLocaleString("ar-EG")} جنيه
                </p>
              )}
            </div>
          </div>
        </button>
      ),
      {
        duration: 8000,
        position: "top-center",
      }
    )
  }

  useEffect(() => {
    const unlockAudio = () => {
      if (!isAdmin()) return

      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext
          }).webkitAudioContext

        if (!AudioContextClass) return

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass()
        }

        if (audioContextRef.current.state === "suspended") {
          void audioContextRef.current.resume()
        }
      } catch (error) {
        console.warn("ADMIN AUDIO UNLOCK ERROR:", error)
      }
    }

    window.addEventListener("click", unlockAudio)
    window.addEventListener("keydown", unlockAudio)

    return () => {
      window.removeEventListener("click", unlockAudio)
      window.removeEventListener("keydown", unlockAudio)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin()) return

    let cancelled = false

    const checkNewOrders = async () => {
      if (cancelled || !isAdmin()) return

      try {
        const response = await apiFetch("/orders")

        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.orders)
            ? response.orders
            : Array.isArray(response?.data)
              ? response.data
              : []

        const orders = list as AdminNotificationOrder[]

        if (firstLoadRef.current) {
          knownOrderIdsRef.current = new Set(
            orders.map((order) => order.id)
          )

          firstLoadRef.current = false
          return
        }

        const newOrders = orders.filter(
          (order) => !knownOrderIdsRef.current.has(order.id)
        )

        orders.forEach((order) => {
          knownOrderIdsRef.current.add(order.id)
        })

        newOrders.forEach(showNotification)
      } catch (error) {
        console.warn("ADMIN NEW ORDER CHECK ERROR:", error)
      }
    }

    void checkNewOrders()

    const timer = window.setInterval(() => {
      void checkNewOrders()
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return null
}

function App() {

  // =====================================
  // Current Route
  // =====================================

  // =====================================
  // Global Products State
  // =====================================

  const [products, setProducts] =
    useState<iProducts[]>([])

  const [productsLoading, setProductsLoading] =
    useState(false)

  // =====================================
  // Load Products
  // =====================================

useEffect(() => {
  let cancelled = false

  const load = async () => {
    try {
      setProductsLoading(true)

      const data = await loadProductsOnce()

      if (cancelled) return

      setProducts(data)

    } catch (error) {

      if (cancelled) return

      console.error(
        "APP LOAD PRODUCTS ERROR:",
        error
      )

      toast.error(
        "حدث خطأ أثناء تحميل المنتجات"
      )
    } finally {
      if (!cancelled) setProductsLoading(false)
    }
  }

  void load()

  return () => {
    cancelled = true
  }

}, [])

  // =====================================
  // Cart State (Global)
  // =====================================

  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = getCart() as Array<{
      product: iProducts
      quantity?: number
      saleType?: "piece" | "weight"
      weight?: number
      unitPrice?: number
    }>

    return stored
      .map((item) => {
        const product = item.product
        const saleType =
          item.saleType ||
          (product.sale_type === "weight" ? "weight" : "piece")

        const unitPrice = Number(
          item.unitPrice ??
            (saleType === "weight"
              ? product.weight_price ?? product.price
              : product.piece_price ?? product.price)
        )

        return {
          product,
          quantity: Number(item.quantity ?? 1),
          saleType,
          weight:
            saleType === "weight" ? Number(item.weight ?? 0) : undefined,
          unitPrice,
        }
      })
      .filter(
        (item) =>
          item.saleType === "piece" || Number(item.weight || 0) > 0
      )
  })

  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // Save Cart to localStorage on every change
  useEffect(() => {
    saveCart(cart)
  }, [cart])

  // Validate Cart when products load
  useEffect(() => {
    if (products.length === 0) return

    setCart((currentCart) => {
      return currentCart.map((item) => {
        const currentProduct = products.find(
          (product) => product.id === item.product.id
        )

        if (!currentProduct) {
          return {
            ...item,
            product: {
              ...item.product,
              stock: 0,
            },
          }
        }

        return {
          ...item,
          product: currentProduct,
        }
      })
    })
  }, [products])

  const addToCart = (
    product: iProducts,
    options?: {
      saleType?: "piece" | "weight"
      weight?: number
    }
  ) => {
    if (product.stock <= 0) {
      toast.error("هذا المنتج غير متوفر حالياً")
      return
    }

    const saleType =
      options?.saleType ||
      (product.sale_type === "weight" ? "weight" : "piece")

    const activeOffer = getActiveOffer(product)
    const effectiveOfferPrice = activeOffer ? activeOffer.offerPrice : null

    const basePrice =
      saleType === "weight"
        ? Number(product.weight_price ?? product.price)
        : Number(product.piece_price ?? product.price)

    const unitPrice = effectiveOfferPrice != null ? effectiveOfferPrice : basePrice

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      toast.error("سعر المنتج غير صحيح")
      return
    }

    const selectedWeight = Number(options?.weight ?? 0)

    if (saleType === "weight") {
      if (!Number.isFinite(selectedWeight) || selectedWeight <= 0) {
        toast.error("حدد وزن المنتج أولاً")
        return
      }

      if (selectedWeight > Number(product.stock)) {
        toast.error("الكمية المطلوبة أكبر من المخزون")
        return
      }
    }

    const productToStore: iProducts = {
      ...product,
      price: unitPrice,
      is_offer: Boolean(effectiveOfferPrice != null),
      offer_price: effectiveOfferPrice,
      original_price: effectiveOfferPrice != null ? (activeOffer?.originalPrice ?? (product.original_price ?? basePrice)) : undefined,
      offer_badge: activeOffer?.offerBadge ?? product.offer_badge,
      offer_expires_at: product.offer_expires_at,
    }

    const existingIndex = cart.findIndex(
      (item) =>
        item.product.id === product.id && item.saleType === saleType
    )

    if (existingIndex >= 0) {
      const existing = cart[existingIndex]

      if (saleType === "weight") {
        const nextWeight =
          Number(existing.weight || 0) + Number(selectedWeight || 0)

        if (nextWeight > product.stock) {
          toast.error("لا توجد كمية إضافية متاحة")
          return
        }

        setCart((currentCart) =>
          currentCart.map((item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  product: productToStore,
                  weight: nextWeight,
                  quantity: 1,
                  unitPrice,
                }
              : item
          )
        )
      } else {
        if (existing.quantity + 1 > product.stock) {
          toast.error("لا توجد كمية إضافية متاحة")
          return
        }

        setCart((currentCart) =>
          currentCart.map((item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  product: productToStore,
                  quantity: item.quantity + 1,
                  unitPrice,
                }
              : item
          )
        )
      }

      toast.success(`تمت إضافة ${product.name} إلى السلة`)
      return
    }

    setCart((currentCart) => [
      ...currentCart,
      {
        product: productToStore,
        quantity: 1,
        saleType,
        weight: saleType === "weight" ? selectedWeight : undefined,
        unitPrice,
      },
    ])

    toast.success(`تمت إضافة ${product.name} إلى السلة`)
  }

  const increaseQuantity = (productId: number) => {
    const item = cart.find((item) => item.product.id === productId)
    if (!item) return

    if (item.product.stock <= 0) {
      toast.error(`${item.product.name} غير متوفر حالياً`)
      return
    }

    if (item.saleType === "weight") {
      const currentWeight = Number(item.weight || 0)
      const nextWeight = Math.round((currentWeight + 0.25) * 1000) / 1000

      if (nextWeight > item.product.stock) {
        toast.error("لا توجد كمية إضافية متاحة")
        return
      }

      setCart((currentCart) =>
        currentCart.map((cartItem) =>
          cartItem.product.id === productId
            ? { ...cartItem, weight: nextWeight }
            : cartItem
        )
      )
      return
    }

    if (item.quantity >= item.product.stock) {
      toast.error("لا توجد كمية إضافية متاحة")
      return
    }

    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.product.id === productId
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      )
    )
  }

  const decreaseQuantity = (productId: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.product.id !== productId) return item

          if (item.saleType === "weight") {
            const currentWeight = Number(item.weight || 0)
            const nextWeight = Math.round((currentWeight - 0.25) * 1000) / 1000
            if (nextWeight <= 0) return null
            return { ...item, weight: nextWeight }
          }

          return { ...item, quantity: item.quantity - 1 }
        })
        .filter(
          (item): item is CartItem =>
            item !== null &&
            (item.saleType === "weight"
              ? Number(item.weight || 0) > 0
              : item.quantity > 0)
        )
    )
  }

  const removeFromCart = (productId: number) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product.id !== productId)
    )
    toast.success("تم حذف المنتج من السلة")
  }

  const cartCount = cart.reduce(
    (total, item) =>
      total + (item.saleType === "weight" ? 1 : item.quantity),
    0
  )


  return (

    <>

      <Toaster
        position="bottom-left"
        reverseOrder={false}
        gutter={8}

        toastOptions={{
          duration: 3000,

          style: {
            background: "#363636",
            color: "#fff",
            direction: "rtl",
          },

          success: {
            duration: 3000,

            style: {
              background: "#10b981",
            },
          },

          error: {
            duration: 4000,

            style: {
              background: "#ef4444",
            },
          },
        }}
      />

      <AdminOrderNotifier />

      <Routes>

        {/* =========================
            CUSTOMER LOGIN
        ========================= */}

      <Route
  path="/customer/login"
  element={<CustomerLogin />}
/>

<Route
  path="/customer/register"
  element={<CustomerRegister />}
/>

      <Route
        path="/profile"
        element={
          <CustomerProfile
            cart={cart}
            cartCount={cartCount}
            products={products}
            onAddToCart={addToCart}
            onIncrease={increaseQuantity}
            onDecrease={decreaseQuantity}
            onRemove={removeFromCart}
            onCheckout={() => {
              if (cart.length === 0) {
                toast.error("السلة فارغة")
                return
              }
              setCheckoutOpen(true)
            }}
          />
        }
      />

      <Route
        path="/customer/orders"
        element={
          <CustomerOrders
            cart={cart}
            cartCount={cartCount}
            products={products}
            onAddToCart={addToCart}
            onIncrease={increaseQuantity}
            onDecrease={decreaseQuantity}
            onRemove={removeFromCart}
            onCheckout={() => {
              if (cart.length === 0) {
                toast.error("السلة فارغة")
                return
              }
              setCheckoutOpen(true)
            }}
          />
        }
      />

        {/* =========================
            ADMIN LOGIN
            Separate from customer login
        ========================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* =========================
            PROTECTED ADMIN ONLY
        ========================= */}

        {/* =========================
            ADMIN PANEL
        ========================= */}

        <Route path="/admin" element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route
              index
              element={
                <Dashboard
                  products={products}
                  setProducts={setProducts}
                />
              }
            />

            <Route
              path="orders"
              element={<Orders />}
            />

            <Route
              path="products"
              element={
                <AdminProducts
                  products={products}
                  setProducts={setProducts}
                />
              }
            />

            <Route
              path="deliveries"
              element={<AdminDeliveries />}
            />

            <Route
              path="profile"
              element={<Profile />}
            />
          </Route>
        </Route>


        {/* =========================
            DELIVERY PANEL WITH LAYOUT
        ========================= */}

        <Route
          path="/delivery"
          element={<DeliveryGuard />}
        >
          <Route element={<DeliveryLayout />}>
            <Route
              index
              element={<DeliveryDashboard />}
            />
            <Route
              path="profile"
              element={<DeliveryProfile />}
            />
          </Route>
        </Route>


        {/* =========================
            PUBLIC CUSTOMER WEBSITE
        ========================= */}

        <Route
          path="*"
          element={
            <Store
              products={products}
              productsLoading={productsLoading}
              cart={cart}
              setCart={setCart}
              cartCount={cartCount}
              addToCart={addToCart}
              increaseQuantity={increaseQuantity}
              decreaseQuantity={decreaseQuantity}
              removeFromCart={removeFromCart}
              checkoutOpen={checkoutOpen}
              setCheckoutOpen={setCheckoutOpen}
            />
          }
        />

      </Routes>

      {/* Global Checkout Modal */}
      {checkoutOpen && (
        <Checkout
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => {
            setCheckoutOpen(false)
            setCart([])
          }}
        />
      )}

    </>
  )
}

export default App