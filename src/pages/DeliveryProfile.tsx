import { type FormEvent, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useOutletContext, useNavigate } from "react-router-dom"
import { apiFetch } from "../services/api"
import { confirmAction } from "../utils/alerts"
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline"

interface DeliveryUser {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  is_active?: boolean
}

export default function DeliveryProfile() {
  const { user } = useOutletContext<{ user: DeliveryUser }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.name ?? "")
      setEmail(user.email ?? "")
      setPhone(user.phone ?? "")
      setLoading(false)
    }
  }, [user])

  const updateProfile = async (e: FormEvent) => {
    e.preventDefault()

    // Validate phone - exactly 11 digits
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length > 0 && phoneDigits.length !== 11) {
      toast.error("رقم الهاتف يجب أن يتكون من 11 رقم")
      return
    }

    try {
      setSaving(true)
      const response = await apiFetch("/delivery/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, email, phone: phone || null }),
      })
      const data = response?.user ?? response?.data ?? response
      localStorage.setItem("staff_user", JSON.stringify(data))
      setName(data.name ?? "")
      setEmail(data.email ?? "")
      setPhone(data.phone ?? "")
      toast.success("تم تحديث بياناتك بنجاح")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث البيانات")
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) return toast.error("كلمة المرور لازم تكون 8 أحرف على الأقل")
    if (newPassword !== confirmPassword) return toast.error("كلمة المرور الجديدة غير متطابقة")

    try {
      setChangingPassword(true)
      await apiFetch("/delivery/profile/password", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("تم تغيير كلمة المرور بنجاح")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء تغيير كلمة المرور")
    } finally {
      setChangingPassword(false)
    }
  }

  const logout = async () => {
    const confirmed = await confirmAction(
      "تسجيل الخروج",
      "هل أنت متأكد من تسجيل الخروج؟",
      {
        confirmText: "نعم، خروج",
        confirmColor: "#ef4444",
        icon: "warning",
      }
    )
    if (!confirmed) return

    try {
      setLoggingOut(true)
      await apiFetch("/delivery/logout", { method: "POST" })
    } catch (error) {
      console.error("LOGOUT ERROR:", error)
    } finally {
      localStorage.removeItem("staff_token")
      localStorage.removeItem("staff_user")
      setLoggingOut(false)
      navigate("/admin/login", { replace: true })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-indigo-600">حساب الدليفري</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">بياناتي الشخصية</h1>
        <p className="mt-1 text-sm text-slate-500">عدّل بياناتك أو غيّر كلمة المرور</p>
      </div>

      {/* Status Badge */}
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-3xl text-white shadow-lg shadow-indigo-600/20">
            {name?.charAt(0) || "D"}
          </div>
          <div>
            <p className="text-xl font-black text-slate-900">{name || "دليفري"}</p>
            <p className="text-sm text-slate-500">{email || ""}</p>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                user?.is_active === false
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {user?.is_active === false ? (
                <>
                  <XCircleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>الحساب معطل</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>الحساب مفعل</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Update Profile */}
      <form onSubmit={updateProfile} className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">المعلومات الشخصية</h2>
        <p className="mt-1 text-sm text-slate-500">قم بتحديث بياناتك الشخصية</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-slate-700">الاسم</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              placeholder="أدخل اسمك"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
              <span>رقم الهاتف</span>
              <span className="text-xs font-normal text-slate-400">
                {phone.replace(/\D/g, '').length}/11
              </span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                setPhone(value)
              }}
              maxLength={11}
              className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              placeholder="مثال: 01012345678"
              dir="ltr"
            />
            {phone.length > 0 && phone.length < 11 && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>يجب إدخال {11 - phone.length} أرقام إضافية</span>
              </p>
            )}
            {phone.length === 11 && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
                <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>رقم هاتف صحيح</span>
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              placeholder="أدخل بريدك الإلكتروني"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-3.5 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:scale-[1.02] hover:shadow-indigo-600/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <span className="inline-flex items-center justify-center gap-2">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              جاري الحفظ...
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <CheckIcon className="h-5 w-5" />
              حفظ البيانات
            </span>
          )}
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={changePassword} className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="inline-flex items-center gap-2 text-lg font-black text-slate-900">
          <LockClosedIcon className="h-5 w-5 text-indigo-600" />
          تغيير كلمة المرور
        </h2>
        <p className="mt-1 text-sm text-slate-500">غير كلمة المرور الخاصة بحسابك</p>

        <div className="mt-5 space-y-4">
          <input
            type="password"
            placeholder="كلمة المرور الحالية"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
          <input
            type="password"
            placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
          <input
            type="password"
            placeholder="تأكيد كلمة المرور الجديدة"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>

        <button
          type="submit"
          disabled={changingPassword}
          className="mt-6 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-3.5 font-bold text-white shadow-lg shadow-slate-900/20 transition hover:scale-[1.02] hover:shadow-slate-900/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {changingPassword ? (
            <span className="inline-flex items-center justify-center gap-2">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              جاري التغيير...
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <LockClosedIcon className="h-5 w-5" />
              تغيير كلمة المرور
            </span>
          )}
        </button>
      </form>

      {/* =====================================
          Logout Button
      ===================================== */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="inline-flex items-center gap-2 text-lg font-black text-red-600">
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          تسجيل الخروج
        </h2>
        <p className="mt-1 text-sm text-slate-500">قم بتسجيل الخروج من حساب الدليفري</p>
        
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loggingOut}
          className="mt-4 w-full rounded-2xl border-2 border-red-200 bg-red-50 px-8 py-4 font-bold text-red-600 transition hover:bg-red-100 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              جاري تسجيل الخروج...
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              تسجيل الخروج
            </span>
          )}
        </button>
      </div>
    </div>
  )
}