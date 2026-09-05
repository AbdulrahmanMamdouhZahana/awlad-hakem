import { type FormEvent, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { apiFetch } from "../services/api"

export default function Login() {
  const navigate = useNavigate()

  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Performance & UX: If already logged in, redirect immediately without waiting
  useEffect(() => {
    const token = localStorage.getItem("staff_token")
    const userRaw = localStorage.getItem("staff_user")

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw)
        if (user?.role === "admin") {
          navigate("/admin", { replace: true })
        } else if (user?.role === "delivery") {
          navigate("/delivery", { replace: true })
        }
      } catch {
        // invalid stored user, proceed with login
      }
    }
  }, [navigate])

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedLogin = login.trim()

    if (!trimmedLogin) {
      setError("يرجى إدخال البريد الإلكتروني أو رقم الهاتف")
      return
    }

    if (!password) {
      setError("يرجى إدخال كلمة المرور")
      return
    }

    setError("")
    setLoading(true)

    try {
      const data = await apiFetch("/staff/login", {
        method: "POST",
        body: JSON.stringify({
          login: trimmedLogin,
          password,
        }),
      })

      if (!data?.user) {
        throw new Error("لم يتم استلام بيانات المستخدم من السيرفر")
      }

      const role = data.user.role

      if (role !== "admin" && role !== "delivery") {
        throw new Error("نوع الحساب غير مسموح له بالدخول إلى لوحة التحكم")
      }

      // Save staff session
      localStorage.setItem("staff_token", data.token)
      localStorage.setItem("staff_user", JSON.stringify(data.user))

      // Clean old auth remnants
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_user")

      if (role === "admin") {
        navigate("/admin", { replace: true })
      } else if (role === "delivery") {
        navigate("/delivery", { replace: true })
      }
    } catch (err) {
      console.error("STAFF LOGIN ERROR:", err)

      // Clear tokens only if failure occurred
      localStorage.removeItem("staff_token")
      localStorage.removeItem("staff_user")

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
          {/* Logo & Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-sm transition hover:scale-105">
              <img
                src="/main_logo.png"
                alt="أولاد حكيم"
                className="h-16 w-16 object-contain"
              />
            </div>

            <h1 className="text-2xl font-black text-slate-900">
              أولاد حكيم
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              تسجيل الدخول إلى لوحة التحكم
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm transition-all"
            >
              <span className="shrink-0 text-base">⚠️</span>
              <p className="flex-1 leading-6">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email / Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-700">
                البريد الإلكتروني أو رقم الهاتف
              </label>

              <input
                type="text"
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value)
                  if (error) setError("")
                }}
                disabled={loading}
                placeholder="admin@awlad-hakem.com أو 01012345678"
                required
                autoComplete="username"
                className="
                  w-full
                  rounded-xl
                  border border-slate-200
                  bg-slate-50
                  px-4 py-3
                  text-sm
                  font-medium
                  text-slate-900
                  outline-none
                  transition
                  focus:border-indigo-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-indigo-100
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-700">
                كلمة المرور
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError("")
                  }}
                  disabled={loading}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="
                    w-full
                    rounded-xl
                    border border-slate-200
                    bg-slate-50
                    px-4 py-3
                    pl-11
                    text-sm
                    font-medium
                    text-slate-900
                    outline-none
                    transition
                    focus:border-indigo-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-indigo-100
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                mt-2
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-indigo-600
                px-4 py-3.5
                text-sm
                font-black
                text-white
                shadow-lg
                shadow-indigo-600/25
                transition
                hover:bg-indigo-700
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <span>تسجيل الدخول</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs font-bold text-slate-400">
          لوحة تحكم أولاد حكيم • جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}