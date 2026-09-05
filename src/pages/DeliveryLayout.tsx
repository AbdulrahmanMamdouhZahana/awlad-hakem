import { useEffect, useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { apiFetch } from "../services/api"

interface DeliveryUser {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  is_active?: boolean
}

export default function DeliveryLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<DeliveryUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch("/delivery/me")
        const data = response?.user ?? response?.data ?? response
        setUser(data)
        localStorage.setItem("staff_user", JSON.stringify(data))
      } catch (error) {
        console.error("LOAD DELIVERY ERROR:", error)
        toast.error("حدث خطأ أثناء تحميل بيانات الدليفري")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const logout = async () => {
    try {
      await apiFetch("/delivery/logout", { method: "POST" })
    } catch (error) {
      console.error(error)
    } finally {
      localStorage.removeItem("staff_token")
      localStorage.removeItem("staff_user")
      navigate("/admin/login", { replace: true })
    }
  }

  const navItems = [
    { path: "/delivery", label: " الطلبات", icon: "📋" },
    { path: "/delivery/profile", label: " البروفايل", icon: "👤" },
  ]

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">جاري تحميل لوحة الدليفري...</p>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-slate-50">
      {/* =====================================
          Mobile Overlay
      ===================================== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================
          Sidebar
      ===================================== */}
      <aside
        className={`
          fixed inset-y-0 right-0 z-50 w-72 transform bg-white shadow-2xl transition-all duration-300 lg:relative lg:translate-x-0 lg:shadow-sm
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-2xl text-white shadow-lg shadow-indigo-600/20">
                {user?.name?.charAt(0) || "D"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-slate-900">
                  {user?.name || "دليفري"}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {user?.email || ""}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    user?.is_active === false
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {user?.is_active === false ? "معطل" : "نشط"}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all
                    ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <span className="mr-auto h-1.5 w-1.5 rounded-full bg-white/70" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-slate-100 p-4">
            <button
              onClick={() => void logout()}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
            >
              <span className="text-xl">🚪</span>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================
          Main Content
      ===================================== */}
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-lg lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 hover:bg-slate-100"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-indigo-600">أولاد الحكيم</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {user?.name?.charAt(0) || "D"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-5 lg:p-8">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  )
}