import { useEffect, useRef, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { apiFetch } from "../../services/api"
import toast from "react-hot-toast"

interface AdminOrderNotification {
  id: number
  customer_name?: string
  total?: number
  created_at?: string
}

interface IProps {
  pendingOrdersCount?: number
}

const AdminLayout = ({
  pendingOrdersCount = 0,
}: IProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const [pageLoading, setPageLoading] = useState(false)
  const [showPageLoader, setShowPageLoader] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<AdminOrderNotification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const notificationMenuRef = useRef<HTMLDivElement | null>(null)
  const knownOrderIdsRef = useRef<Set<number>>(new Set())
  const firstNotificationLoadRef = useRef(true)

  useEffect(() => {
    setPageLoading(true)
    setShowPageLoader(true)

    // Small delay gives the new route/content time to mount.
    const timer = window.setTimeout(() => {
      setPageLoading(false)

      // Keep the fade-out smooth instead of instantly removing the overlay.
      const hideTimer = window.setTimeout(() => {
        setShowPageLoader(false)
      }, 180)

      // Store the nested timer on the window so cleanup below can cancel it.
      ;(window as Window & {
        __adminLoaderHideTimer?: number
      }).__adminLoaderHideTimer = hideTimer
    }, 500)

    return () => {
      window.clearTimeout(timer)

      const hideTimer = (window as Window & {
        __adminLoaderHideTimer?: number
      }).__adminLoaderHideTimer

      if (hideTimer) {
        window.clearTimeout(hideTimer)
      }
    }
  }, [location.pathname])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_notifications")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setNotifications(parsed.slice(0, 20))
        }
      }

      const unread = Number(
        localStorage.getItem("admin_notifications_unread") || 0
      )
      setUnreadNotifications(Number.isFinite(unread) ? unread : 0)
    } catch {
      localStorage.removeItem("admin_notifications")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      "admin_notifications",
      JSON.stringify(notifications.slice(0, 20))
    )
  }, [notifications])

  useEffect(() => {
    localStorage.setItem(
      "admin_notifications_unread",
      String(unreadNotifications)
    )
  }, [unreadNotifications])

  useEffect(() => {
    let cancelled = false

    const checkNewOrders = async () => {
      if (cancelled) return

      try {
        const response = await apiFetch("/orders")
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.orders)
            ? response.orders
            : Array.isArray(response?.data)
              ? response.data
              : []

        const orders = list as AdminOrderNotification[]

        if (firstNotificationLoadRef.current) {
          knownOrderIdsRef.current = new Set(
            orders.map((order) => order.id)
          )
          firstNotificationLoadRef.current = false
          return
        }

        const newOrders = orders.filter(
          (order) => !knownOrderIdsRef.current.has(order.id)
        )

        orders.forEach((order) => {
          knownOrderIdsRef.current.add(order.id)
        })

        if (!newOrders.length) return

        setNotifications((current) => {
          const merged = [...newOrders, ...current]
          const unique = merged.filter(
            (order, index, array) =>
              array.findIndex((item) => item.id === order.id) === index
          )
          return unique.slice(0, 20)
        })

        setUnreadNotifications((current) => current + newOrders.length)

        newOrders.forEach((order) => {
          toast.success(
            `طلب جديد #${order.id} من ${order.customer_name || "عميل"}`,
            { duration: 5000 }
          )
        })
      } catch (error) {
        console.warn("ADMIN NOTIFICATIONS ERROR:", error)
      }
    }

    void checkNewOrders()
    const timer = window.setInterval(() => void checkNewOrders(), 5000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener("mousedown", closeOnOutside)
    return () => document.removeEventListener("mousedown", closeOnOutside)
  }, [])

  const openNotification = (order: AdminOrderNotification) => {
    setNotificationsOpen(false)
    setUnreadNotifications(0)
    navigate(`/admin/orders?order=${order.id}`)
  }

  const clearNotifications = () => {
    setNotifications([])
    setUnreadNotifications(0)
  }

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await apiFetch("/logout", {
        method: "POST",
      })
    } catch (error) {
      console.warn("LOGOUT ERROR:", error)
    } finally {
      // Clear all client-side auth data even if the API request fails.
      localStorage.removeItem("staff_token")
      localStorage.removeItem("staff_user")
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      navigate("/admin/login", { replace: true })
    }
  }

  const navigation = [
    {
      label: "الرئيسية",
      path: "/admin",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12 12 3l9 9M5 10v10h14V10M9 20v-6h6v6"
          />
        </svg>
      ),
    },

    {
      label: "الطلبات",
      path: "/admin/orders",
      badge: pendingOrdersCount,
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h18M5 5v14h14V5M8 9h8M8 13h5M8 17h3"
          />
        </svg>
      ),
    },

    {
      label: "المنتجات",
      path: "/admin/products",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m7 3 10 0 4 4v14H3V7l4-4ZM7 3v5h10V3M7 13h10M7 17h6"
          />
        </svg>
      ),
    },

    {
      label: "الدليفري",
      path: "/admin/deliveries",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7h11v10H3V7Zm11 4h4l3 3v3h-7v-6Zm-7 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
          />
        </svg>
      ),
    },

    {
      label: "الملف الشخصي",
      path: "/admin/profile",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 11h5M18.5 8.5v5"
          />
        </svg>
      ),
    },

    
  ]

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      {/* Admin page transition loading bar */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-1 overflow-hidden transition-opacity duration-200 ${
          pageLoading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="h-full w-1/3 rounded-full bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.55)]"
          style={{
            animation: pageLoading
              ? "adminPageLoading 0.9s ease-in-out infinite"
              : "none",
          }}
        />
      </div>

      <style>{`
        @keyframes adminPageLoading {
          0% { transform: translateX(-130%); }
          50% { transform: translateX(180%); }
          100% { transform: translateX(420%); }
        }
      `}</style>
      {/* =====================================
          Full Page Loading Screen
      ===================================== */}
      <div
        className={`fixed inset-0 z-[9998] flex items-center justify-center bg-white/95 backdrop-blur-sm transition-all duration-300 ${
          showPageLoader
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!showPageLoader}
      >
        <div className="flex flex-col items-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-indigo-600 border-r-indigo-400" />

            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
              <img
                src="/main_logo.png"
                alt="أولاد حكيم"
                className="h-full w-full object-contain p-1"
              />
            </div>
          </div>

          <p className="mt-5 text-sm font-black text-slate-800">
            جاري تحميل الصفحة...
          </p>

          <div className="mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-[adminLoaderProgress_1s_ease-in-out_infinite] rounded-full bg-indigo-600" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes adminLoaderProgress {
          0% { transform: translateX(-180%); }
          100% { transform: translateX(380%); }
        }
      `}</style>
      {/* =====================================
          Mobile Overlay
      ===================================== */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================
          Sidebar
      ===================================== */}

      <aside
        className={`
          fixed inset-y-0 right-0 z-50 flex w-[280px]
          flex-col border-l border-slate-200 bg-white
          shadow-xl transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Logo */}
        <div className="flex h-[82px] items-center border-b border-slate-100 px-5">
          <NavLink
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white">
              <img
                src="/main_logo.png"
                alt="أولاد حكيم"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-lg font-black text-slate-950">
                أولاد حكيم
              </h1>

              <p className="mt-1 text-[10px] font-bold text-slate-400">
                لوحة التحكم
              </p>
            </div>
          </NavLink>

          {/* Close Mobile */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="mr-auto flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
            الإدارة
          </p>

          <div className="space-y-1.5">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                onClick={() => {
                  setPageLoading(true)
                  setShowPageLoader(true)
                  setSidebarOpen(false)
                }}
                className={({ isActive }) => `
                  group flex items-center gap-3 rounded-2xl
                  px-4 py-3.5 text-sm font-bold transition
                  ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`
                        flex h-9 w-9 items-center justify-center
                        rounded-xl transition
                        ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                        }
                      `}
                    >
                      {item.icon}
                    </span>

                    <span className="flex-1">
                      {item.label}
                    </span>

                    {item.badge !== undefined &&
                      item.badge > 0 && (
                        <span
                          className={`
                            flex min-w-6 items-center justify-center
                            rounded-full px-1.5 py-1 text-[10px]
                            font-black
                            ${
                              isActive
                                ? "bg-white text-indigo-600"
                                : "bg-red-500 text-white"
                            }
                          `}
                        >
                          {item.badge > 99
                            ? "99+"
                            : item.badge}
                        </span>
                      )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-100 p-4 space-y-2">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </span>

            العودة للموقع
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              {loggingOut ? (
                <span className="animate-spin text-base">⏳</span>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12H3m0 0 4-4m-4 4 4 4M21 5v14a2 2 0 0 1-2 2h-5"
                  />
                </svg>
              )}
            </span>

            {loggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
          </button>
        </div>
      </aside>

      {/* =====================================
          Main Area
      ===================================== */}

      <div className="min-h-screen lg:mr-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile Menu */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
              aria-label="فتح القائمة"
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
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Page Header */}
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-slate-400">
                لوحة الإدارة
              </p>

              <h2 className="mt-0.5 text-lg font-black text-slate-950">
                أهلاً بك في لوحة التحكم 👋
              </h2>
            </div>

            {/* Right Actions */}
            <div className="mr-auto flex items-center gap-2">
              {/* Notifications */}
              <div ref={notificationMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((current) => !current)
                    setUnreadNotifications(0)
                  }}
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                  title="الإشعارات"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                  </svg>

                  {unreadNotifications > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute left-0 top-14 z-[100] w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">الإشعارات</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                          أحدث طلبات المتجر
                        </p>
                      </div>

                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={clearNotifications}
                          className="text-[10px] font-bold text-slate-400 hover:text-red-500"
                        >
                          مسح الكل
                        </button>
                      )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                            🔔
                          </div>
                          <p className="mt-4 text-sm font-black text-slate-700">
                            لا توجد إشعارات
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            ستظهر هنا الطلبات الجديدة.
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => openNotification(notification)}
                            className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-right transition hover:bg-indigo-50"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg">
                              🛒
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-black text-indigo-700">
                                طلب جديد #{notification.id}
                              </span>
                              <span className="mt-1 block truncate text-xs font-bold text-slate-700">
                                {notification.customer_name || "عميل"}
                              </span>
                              <span className="mt-1 block text-[11px] font-bold text-emerald-600">
                                {Number(notification.total || 0).toLocaleString("ar-EG")} جنيه
                              </span>
                              {notification.created_at && (
                                <span className="mt-1 block text-[10px] text-slate-400">
                                  {new Date(notification.created_at).toLocaleString("ar-EG")}
                                </span>
                              )}
                            </span>

                            <span className="mt-1 text-slate-300">←</span>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="border-t border-slate-100 p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false)
                          setUnreadNotifications(0)
                          navigate("/admin/orders")
                        }}
                        className="w-full rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-100"
                      >
                        عرض كل الطلبات
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin / Profile */}
              <NavLink
                to="/admin/profile"
                className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 sm:flex"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 font-black text-indigo-700">
                  A
                </div>

                <div>
                  <p className="text-xs font-black text-slate-800">
                    Admin
                  </p>

                  <p className="text-[10px] font-semibold text-slate-400">
                    مدير المتجر
                  </p>
                </div>
              </NavLink>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex h-11 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-sm font-black text-red-600 shadow-sm transition hover:border-red-200 hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                title="تسجيل الخروج"
              >
                {loggingOut ? (
                  <span className="animate-spin text-base">⏳</span>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12H3m0 0 4-4m-4 4 4 4M21 5v14a2 2 0 0 1-2 2h-5"
                    />
                  </svg>
                )}
                <span className="hidden sm:inline">
                  {loggingOut ? "جاري الخروج..." : "خروج"}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-76px)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout