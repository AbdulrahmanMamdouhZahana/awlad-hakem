import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { apiFetch } from "../services/api"

interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
}

export default function Profile() {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Profile fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // =========================
  // Load Profile
  // =========================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiFetch("/me")

        const userData = response?.user ??
          response?.data ??
          response

        setUser(userData)

        setName(userData.name ?? "")
        setEmail(userData.email ?? "")
        setPhone(userData.phone ?? "")

        localStorage.setItem(
          "staff_user",
          JSON.stringify(userData)
        )
      } catch (error) {
        console.error("LOAD PROFILE ERROR:", error)

        toast.error(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل بيانات الحساب"
        )
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [])

  // =========================
  // Update Profile
  // =========================

  const handleUpdateProfile = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    try {
      setSavingProfile(true)

      const response = await apiFetch("/profile", {
        method: "PATCH",

        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
        }),
      })

      const updatedUser =
        response?.user ??
        response?.data ??
        response

      setUser(updatedUser)

      localStorage.setItem(
        "staff_user",
        JSON.stringify(updatedUser)
      )

      // Update displayed fields with server values
      setName(updatedUser.name ?? "")
      setEmail(updatedUser.email ?? "")
      setPhone(updatedUser.phone ?? "")

      toast.success("تم تحديث بيانات الحساب بنجاح")
    } catch (error) {
      console.error("UPDATE PROFILE ERROR:", error)

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحديث البيانات"
      )
    } finally {
      setSavingProfile(false)
    }
  }

  // =========================
  // Change Password
  // =========================

  const handleChangePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور الجديدة غير متطابقة")
      return
    }

    if (newPassword.length < 8) {
      toast.error(
        "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"
      )
      return
    }

    try {
      setChangingPassword(true)

      const response = await apiFetch(
        "/profile/password",
        {
          method: "PATCH",

          body: JSON.stringify({
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: confirmPassword,
          }),
        }
      )

      // Laravel invalidates the old tokens and returns
      // a new token after changing the password.
      if (response?.token) {
        localStorage.setItem(
          "staff_token",
          response.token
        )
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast.success("تم تغيير كلمة المرور بنجاح")
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تغيير كلمة المرور"
      )
    } finally {
      setChangingPassword(false)
    }
  }

  // =========================
  // Logout
  // =========================

  const handleLogout = async () => {
    try {
      setLoggingOut(true)

      await apiFetch("/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("LOGOUT ERROR:", error)
    } finally {
      localStorage.removeItem("staff_token")
      localStorage.removeItem("staff_user")

      navigate("/login", {
        replace: true,
      })
    }
  }

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[70vh] items-center justify-center"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm font-bold text-slate-500">
            جاري تحميل بيانات الحساب...
          </p>
        </div>
      </div>
    )
  }

  // =========================
  // No User
  // =========================

  if (!user) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[70vh] items-center justify-center"
      >
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <p className="font-bold text-slate-700">
            تعذر تحميل بيانات الحساب
          </p>

          <button
            onClick={() => navigate("/admin")}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    )
  }

  const roleLabel =
    user.role === "admin"
      ? "مدير"
      : user.role === "employee"
        ? "موظف"
        : user.role

  // =========================
  // Render
  // =========================

  return (
    <div
      dir="rtl"
      className="min-h-[70vh] bg-slate-50 p-4 md:p-8"
    >
      <div className="mx-auto max-w-4xl">

        {/* Header */}

        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">
            الملف الشخصي
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            إدارة بيانات حسابك في لوحة تحكم أولاد حكيم
          </p>
        </div>

        {/* User Card */}

        <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-xl">

          <div className="bg-gradient-to-l from-indigo-600 to-indigo-500 px-6 py-8 md:px-8">

            <div className="flex items-center gap-5">

              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-2xl font-black text-indigo-600 shadow-lg">
                {user.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div className="text-white">

                <h2 className="text-2xl font-black">
                  {user.name}
                </h2>

                <p className="mt-1 text-sm font-medium text-indigo-100">
                  {user.email}
                </p>

                {user.phone && (
                  <p className="mt-1 text-sm font-medium text-indigo-100">
                    {user.phone}
                  </p>
                )}

              </div>

            </div>

          </div>

          <div className="p-6 md:p-8">

            <div className="inline-flex rounded-full bg-indigo-100 px-4 py-2 text-sm font-black text-indigo-700">
              {roleLabel}
            </div>

          </div>

        </div>

        {/* Profile Information */}

        <div className="mb-6 rounded-3xl bg-white p-6 shadow-xl md:p-8">

          <div className="mb-6">

            <h2 className="text-xl font-black text-slate-900">
              بيانات الحساب
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              قم بتعديل بياناتك الشخصية
            </p>

          </div>

          <form
            onSubmit={handleUpdateProfile}
            className="space-y-5"
          >

            {/* Name */}

            <div>

              <label className="mb-2 block text-sm font-black text-slate-700">
                الاسم
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

            </div>

            {/* Email */}

            <div>

              <label className="mb-2 block text-sm font-black text-slate-700">
                البريد الإلكتروني
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

            </div>

            {/* Phone */}

            <div>

              <label className="mb-2 block text-sm font-black text-slate-700">
                رقم الهاتف
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="01012345678"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile
                ? "جاري الحفظ..."
                : "حفظ البيانات"}
            </button>

          </form>

        </div>

        {/* Change Password */}

        <div className="mb-6 rounded-3xl bg-white p-6 shadow-xl md:p-8">

          <div className="mb-6">

            <h2 className="text-xl font-black text-slate-900">
              تغيير كلمة المرور
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              استخدم كلمة مرور قوية لا تقل عن 8 أحرف
            </p>

          </div>

          <form
            onSubmit={handleChangePassword}
            className="space-y-5"
          >

            {/* Current */}

            <div>

              <label className="mb-2 block text-sm font-black text-slate-700">
                كلمة المرور الحالية
              </label>

              <input
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(
                    e.target.value
                  )
                }
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

            </div>

            {/* New */}

            <div>

              <label className="mb-2 block text-sm font-black text-slate-700">
                كلمة المرور الجديدة
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

            </div>

            {/* Confirm */}

            <div>

              <label className="mb-2 block text-sm font-black text-slate-700">
                تأكيد كلمة المرور الجديدة
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword
                ? "جاري تغيير كلمة المرور..."
                : "تغيير كلمة المرور"}
            </button>

          </form>

        </div>

       

      </div>
    </div>
  )
}