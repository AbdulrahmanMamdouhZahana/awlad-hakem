import { type FormEvent, useEffect, useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL

interface Customer {
  id: number
  name: string
  email: string
  phone?: string | null
  role?: string
  email_verified?: boolean
  email_verified_at?: string | null
}

export default function CustomerProfile() {
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<Customer | null>(null)

  // Profile
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [originalEmail, setOriginalEmail] = useState("")

  // Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

  // Loading
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Messages
  const [profileMessage, setProfileMessage] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [error, setError] = useState("")

  // Email verification
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // Phone validation
  const [phoneError, setPhoneError] = useState("")

  // =====================================
  // SPLASH SCREEN (like in App.tsx)
  // =====================================

  const [showLoader, setShowLoader] = useState(true)
  const [minimumTimePassed, setMinimumTimePassed] = useState(false)
  const [splashPhase, setSplashPhase] = useState<"loading" | "moving" | "done">("loading")
  const splashLogoRef = useRef<HTMLDivElement | null>(null)

  // Minimum 2 seconds splash
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinimumTimePassed(true)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [])

  // Start splash transition after minimum time AND loading is done
  useEffect(() => {
    if (!minimumTimePassed || loading) {
      return
    }

    setSplashPhase("moving")
  }, [minimumTimePassed, loading])

  // Finish splash transition
  useEffect(() => {
    if (splashPhase !== "moving") {
      return
    }

    const timer = window.setTimeout(() => {
      setSplashPhase("done")
    }, 900)

    return () => window.clearTimeout(timer)
  }, [splashPhase])

  // Remove splash
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

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("customer_token")
  }

  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const authHeaders = () => {
    const token = getToken()

    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {
    const token = getToken()

    try {
      if (token) {
        await fetch(`${API_URL}/customer/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch {
      // Logout locally even if API fails
    }

    localStorage.removeItem("customer_token")
    localStorage.removeItem("customer_user")

    window.dispatchEvent(new Event("customer-auth-changed"))

    navigate("/customer/login", {
      replace: true,
    })
  }

  // =====================================================
  // LOAD CUSTOMER
  // =====================================================

  const loadCustomer = async () => {
    const token = getToken()

    if (!token) {
      navigate("/customer/login", {
        replace: true,
      })
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(`${API_URL}/customer/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem("customer_token")
        localStorage.removeItem("customer_user")
        navigate("/customer/login", { replace: true })
        return
      }

      if (!response.ok) {
        throw new Error(data?.message || "فشل تحميل بيانات الحساب")
      }

      const user: Customer = data.user

      setCustomer(user)
      setName(user.name || "")
      setEmail(user.email || "")
      setOriginalEmail(user.email || "")
      setPhone(user.phone || "")

      localStorage.setItem("customer_user", JSON.stringify(user))
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل الحساب"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomer()
  }, [])

  // =====================================================
  // SEND VERIFICATION OTP
  // =====================================================

  const sendVerificationOTP = async (emailToVerify: string) => {
    const response = await fetch(
      `${API_URL}/customer/verify-email/send`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          email: emailToVerify,
        }),
      }
    )

    const data = await response.json()

    if (response.status === 401) {
      await logout()
      throw new Error("انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.")
    }

    if (!response.ok) {
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0]

        if (Array.isArray(firstError) && firstError.length > 0) {
          throw new Error(String(firstError[0]))
        }
      }

      throw new Error(
        data?.message || "فشل إرسال رمز التحقق."
      )
    }

    return true
  }

  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const updateProfile = async (profileEmail: string) => {
    const response = await fetch(
      `${API_URL}/customer/profile`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          email: profileEmail.trim(),
          phone: phone.trim() || null,
        }),
      }
    )

    const data = await response.json()

    if (response.status === 401) {
      await logout()
      throw new Error("انتهت جلسة تسجيل الدخول.")
    }

    if (!response.ok) {
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0]

        if (Array.isArray(firstError) && firstError.length > 0) {
          throw new Error(String(firstError[0]))
        }
      }

      throw new Error(
        data?.message || "فشل تحديث بيانات الحساب"
      )
    }

    return data
  }

  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const handleProfileSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    const token = getToken()

    if (!token) {
      navigate("/customer/login", { replace: true })
      return
    }

    // Validate phone number - must be exactly 11 digits
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length > 0 && phoneDigits.length !== 11) {
      setPhoneError("رقم الهاتف يجب أن يتكون من 11 رقم")
      return
    }
    setPhoneError("")

    const newEmail = email.trim().toLowerCase()
    const currentEmail = originalEmail.trim().toLowerCase()
    const emailChanged = newEmail !== currentEmail

    setSavingProfile(true)
    setProfileMessage("")
    setError("")

    try {
      if (emailChanged) {
        setPendingEmail(newEmail)

        await sendVerificationOTP(newEmail)

        setVerificationCode("")
        setVerificationError("")
        setVerificationSuccess(false)
        setShowVerificationModal(true)

        setProfileMessage(
          "تم إرسال رمز التحقق إلى بريدك الإلكتروني الجديد."
        )

        return
      }

      const data = await updateProfile(currentEmail)

      const updatedUser: Customer = data.user

      setCustomer(updatedUser)
      setName(updatedUser.name || "")
      setEmail(updatedUser.email || "")
      setOriginalEmail(updatedUser.email || "")
      setPhone(updatedUser.phone || "")

      localStorage.setItem(
        "customer_user",
        JSON.stringify(updatedUser)
      )

      window.dispatchEvent(
        new Event("customer-auth-changed")
      )

      setProfileMessage("تم تحديث بيانات حسابك بنجاح ✓")
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحديث الحساب"
      )
    } finally {
      setSavingProfile(false)
    }
  }

  // =====================================================
  // VERIFY NEW EMAIL
  // =====================================================

  const handleVerifyEmail = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!pendingEmail) {
      setVerificationError(
        "لم يتم تحديد البريد الإلكتروني المطلوب التحقق منه."
      )
      return
    }

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setVerificationError(
        "يرجى إدخال رمز تحقق مكون من 6 أرقام."
      )
      return
    }

    const token = getToken()

    if (!token) {
      await logout()
      return
    }

    setVerificationError("")
    setVerifying(true)

    try {
      const response = await fetch(
        `${API_URL}/customer/verify-profile-email`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            email: pendingEmail,
            code: verificationCode.trim(),
          }),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        await logout()
        return
      }

      if (!response.ok) {
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0]

          if (Array.isArray(firstError) && firstError.length > 0) {
            throw new Error(String(firstError[0]))
          }
        }

        throw new Error(
          data?.message || "رمز التحقق غير صحيح."
        )
      }

      const updatedUser: Customer = data.user

      setCustomer(updatedUser)
      setName(updatedUser.name || "")
      setEmail(updatedUser.email || "")
      setOriginalEmail(updatedUser.email || "")
      setPhone(updatedUser.phone || "")

      localStorage.setItem(
        "customer_user",
        JSON.stringify(updatedUser)
      )

      if (data.token) {
        localStorage.setItem(
          "customer_token",
          data.token
        )
      }

      window.dispatchEvent(
        new Event("customer-auth-changed")
      )

      setVerificationSuccess(true)
      setProfileMessage(
        "تم تأكيد البريد الإلكتروني وتحديث بيانات الحساب بنجاح ✓"
      )

      setTimeout(() => {
        setShowVerificationModal(false)
        setVerificationSuccess(false)
        setVerificationCode("")
        setPendingEmail(null)
      }, 1800)
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء التحقق من البريد الإلكتروني."
      )
    } finally {
      setVerifying(false)
    }
  }

  // =====================================================
  // RESEND VERIFICATION CODE
  // =====================================================

  const handleResendCode = async () => {
    if (!pendingEmail) {
      return
    }

    setResendLoading(true)
    setVerificationError("")

    try {
      await sendVerificationOTP(pendingEmail)

      setVerificationCode("")
      setProfileMessage(
        "تم إعادة إرسال رمز التحقق إلى بريدك الإلكتروني."
      )
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إعادة إرسال رمز التحقق."
      )
    } finally {
      setResendLoading(false)
    }
  }

  // =====================================================
  // CLOSE VERIFICATION MODAL
  // =====================================================

  const handleCloseModal = () => {
    setShowVerificationModal(false)
    setVerificationError("")
    setVerificationCode("")
    setPendingEmail(null)

    setEmail(originalEmail)

    setProfileMessage("")
  }

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handlePasswordSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setPasswordMessage("")
    setError("")

    if (password !== passwordConfirmation) {
      setPasswordMessage("كلمة المرور الجديدة غير متطابقة.")
      return
    }

    if (password.length < 8) {
      setPasswordMessage(
        "كلمة المرور يجب أن تكون 8 أحرف على الأقل."
      )
      return
    }

    if (password === currentPassword) {
      setPasswordMessage(
        "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية."
      )
      return
    }

    const token = getToken()

    if (!token) {
      navigate("/customer/login", { replace: true })
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch(
        `${API_URL}/customer/profile/password`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            current_password: currentPassword,
            password: password,
            password_confirmation: passwordConfirmation,
          }),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        await logout()
        return
      }

      if (!response.ok) {
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0]

          if (Array.isArray(firstError) && firstError.length > 0) {
            throw new Error(String(firstError[0]))
          }
        }

        throw new Error(
          data?.message || "فشل تغيير كلمة المرور"
        )
      }

      if (data.token) {
        localStorage.setItem(
          "customer_token",
          data.token
        )
      }

      if (data.user) {
        setCustomer(data.user)

        localStorage.setItem(
          "customer_user",
          JSON.stringify(data.user)
        )
      }

      setCurrentPassword("")
      setPassword("")
      setPasswordConfirmation("")
      setShowCurrentPassword(false)
      setShowPassword(false)
      setShowPasswordConfirmation(false)

      setPasswordMessage(
        "تم تغيير كلمة المرور بنجاح ✓"
      )

      window.dispatchEvent(
        new Event("customer-auth-changed")
      )
    } catch (error) {
      setPasswordMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تغيير كلمة المرور"
      )
    } finally {
      setChangingPassword(false)
    }
  }

  // =====================================================
  // PASSWORD INPUT
  // =====================================================

  const PasswordToggle = ({
    show,
    setShow,
  }: {
    show: boolean
    setShow: (value: boolean) => void
  }) => {
    return (
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="
          absolute
          left-3
          top-1/2
          -translate-y-1/2
          text-slate-400
          transition
          hover:text-[#17656b]
          focus:outline-none
        "
        aria-label={
          show
            ? "إخفاء كلمة المرور"
            : "إظهار كلمة المرور"
        }
      >
        {show ? (
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
              d="M3 3l18 18 M10.6 10.6 a2 2 0 0 0 2.8 2.8 M9.9 4.3 A10.5 10.5 0 0 1 12 4 c5 0 8.5 4.5 9.5 6 -.4.6-1.2 1.7-2.5 2.8 M6.2 6.2 C4.1 7.6 2.9 9.5 2.5 10 c1 1.5 4.5 6 9.5 6 1 0 2-.2 2.9-.5"
            />
          </svg>
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
              d="M2.5 12 C3.5 10.5 7 6 12 6 s8.5 4.5 9.5 6 c-1 1.5-4.5 6-9.5 6 S3.5 13.5 2.5 12Z M12 15 a3 3 0 1 0 0-6 a3 3 0 0 0 0 6Z"
            />
          </svg>
        )}
      </button>
    )
  }

  // =====================================================
  // PAGE CONTENT
  // =====================================================

  return (
    <>
      {/* =====================================
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
                border-t-[#17656b]
                border-r-[#17656b]/60
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
                border-[#17656b]/10
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
                alt="أولاد حكيم"
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
              أولاد حكيم
            </h1>

            <p
              className="
                mt-2
                text-sm
                font-medium
                text-slate-500
              "
            >
              حسابي الشخصي
            </p>

            <p
              className="
                mt-2
                text-xs
                text-slate-400
              "
            >
              جاري تحميل بيانات حسابك...
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
                  bg-[#17656b]
                  [animation-delay:-0.3s]
                "
              />
              <span
                className="
                  h-1.5
                  w-1.5
                  animate-bounce
                  rounded-full
                  bg-[#17656b]/70
                  [animation-delay:-0.15s]
                "
              />
              <span
                className="
                  h-1.5
                  w-1.5
                  animate-bounce
                  rounded-full
                  bg-[#17656b]/40
                "
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      {!showLoader && (
        <div
          dir="rtl"
          className="min-h-screen bg-[#fff] px-4 py-8 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            {/* HEADER */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black">
                  <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse" />
                  حسابي
                </span>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  أهلاً {customer?.name || "بك"} 
                </h1>

                <p className="mt-1.5 text-sm text-slate-500">
                  إدارة بيانات حسابك الشخصية
                </p>
              </div>

              <Link
                to="/"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-[#17656b]/30 hover:bg-[#17656b]/5 hover:text-[#17656b] hover:shadow-lg"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                العودة للمتجر
              </Link>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/90 px-5 py-4 text-sm font-bold text-red-600 shadow-sm animate-shake">
                <span className="inline-block ml-2">⚠️</span>
                {error}
              </div>
            )}

            {/* PROFILE MESSAGE */}
            {profileMessage && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50/90 px-5 py-4 text-sm font-bold text-green-600 shadow-sm">
                <span className="inline-block ml-2">✓</span>
                {profileMessage}
              </div>
            )}

            {/* MAIN GRID */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* CUSTOMER INFO CARD */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl">
                {/* Decorative gradient */}
                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full  opacity-0 transition-opacity group-hover:opacity-100" />

                {/* Avatar */}
                <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full ring-4 ring-white shadow-lg">
                  <svg
                    className="h-14 w-14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 21v-2 a4 4 0 0 0-4-4H7 a4 4 0 0 0-4 4v2 M9 11 a4 4 0 1 0 0-8 a4 4 0 0 0 0 8Z"
                    />
                  </svg>
                </div>

                {/* Customer data */}
                <div className="relative mt-5 text-center">
                  <h2 className="text-xl font-black text-slate-900">
                    {customer?.name}
                  </h2>

                  <p className="mt-2 break-all text-sm text-slate-500">
                    {customer?.email}
                  </p>

                  {customer?.phone && (
                    <p className="mt-1 text-sm text-slate-500">
                       {customer.phone}
                    </p>
                  )}

                  <div className="mt-3">
                    {customer?.email_verified === false && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        غير موثق
                      </span>
                    )}

                    {customer?.email_verified === true && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                        موثق ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="relative mt-6 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-2 w-full rounded-xl px-4 py-3 text-right text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    🚪 تسجيل الخروج
                  </button>
                </div>
              </div>

              {/* PROFILE */}
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm lg:col-span-2">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-slate-900">
                    البيانات الشخصية
                  </h2>

                  <p className="mt-1.5 text-sm text-slate-500">
                    عدّل بياناتك الشخصية واحفظ التغييرات.
                  </p>

                  {email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() && (
                    <div className="mt-3 rounded-xl bg-amber-50/80 px-4 py-3 text-sm font-bold text-amber-700 border border-amber-200">
                      ⚠️ سيتم إرسال رمز تحقق إلى البريد الإلكتروني الجديد قبل حفظه
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleProfileSubmit}
                  className="space-y-5"
                >
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-black text-slate-700"
                    >
                      الاسم
                    </label>

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={255}
                      autoComplete="name"
                      className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm outline-none transition-all focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/10"
                      placeholder="أدخل اسمك"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-black text-slate-700"
                    >
                      البريد الإلكتروني
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={255}
                      autoComplete="email"
                      className={`w-full rounded-2xl border-2 px-4 py-3.5 text-sm outline-none transition-all focus:ring-4 ${
                        email.trim().toLowerCase() !== originalEmail.trim().toLowerCase()
                          ? "border-amber-300 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500/10"
                          : "border-slate-200 bg-slate-50/50 focus:border-[#17656b] focus:bg-white focus:ring-[#17656b]/10"
                      }`}
                      placeholder="أدخل بريدك الإلكتروني"
                    />

                    {email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() && (
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                        <span>📧</span>
                        سيتم إرسال رمز تحقق إلى هذا البريد الإلكتروني
                      </p>
                    )}
                  </div>

                  {/* Phone - ENFORCED 11 DIGITS */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 flex items-center justify-between text-sm font-black text-slate-700"
                    >
                      <span>رقم الهاتف</span>
                      <span className="text-xs font-normal text-slate-400">
                        {phone.replace(/\D/g, '').length}/11
                      </span>
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        // Only allow digits and limit to 11 characters
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                        setPhone(value)
                        if (value.length > 0 && value.length !== 11) {
                          setPhoneError("رقم الهاتف يجب أن يكون 11 رقم")
                        } else {
                          setPhoneError("")
                        }
                      }}
                      maxLength={11}
                      autoComplete="tel"
                      placeholder="مثال: 01012345678"
                      className={`w-full rounded-2xl border-2 px-4 py-3.5 text-sm outline-none transition-all focus:ring-4 ${
                        phoneError
                          ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                          : phone.length === 11
                          ? "border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500/10"
                          : phone.length > 0
                          ? "border-amber-300 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500/10"
                          : "border-slate-200 bg-slate-50/50 focus:border-[#17656b] focus:bg-white focus:ring-[#17656b]/10"
                      }`}
                      dir="ltr"
                    />

                    {phoneError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <span>❌</span>
                        {phoneError}
                      </p>
                    )}

                    {phone.length === 11 && !phoneError && phone.length > 0 && (
                      <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                        <span>✓</span>
                        رقم هاتف صحيح
                      </p>
                    )}

                    {phone.length > 0 && phone.length < 11 && (
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                        <span>⚠️</span>
                        يجب إدخال {11 - phone.length} أرقام إضافية
                      </p>
                    )}
                  </div>

                  {/* Save */}
                  <button
                    type="submit"
                    disabled={savingProfile || !!phoneError}
                    className="group w-full rounded-2xl  px-4 py-4 text-sm font-black text-white shadow-lg shadow-[#17656b]/20 transition-all hover:scale-[1.02] hover:shadow-[#17656b]/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {savingProfile ? (
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
                        جاري حفظ التعديلات...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        حفظ التعديلات
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* CHANGE PASSWORD */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
              <div className="mb-6">
                <h2 className="text-xl font-black text-slate-900">
                  تغيير كلمة المرور
                </h2>

                <p className="mt-1.5 text-sm text-slate-500">
                  يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل.
                </p>
              </div>

              {passwordMessage && (
                <div
                  className={`mb-5 rounded-2xl border px-5 py-4 text-sm font-bold shadow-sm ${
                    passwordMessage.includes("بنجاح")
                      ? "border-green-200 bg-green-50/90 text-green-600"
                      : "border-red-200 bg-red-50/90 text-red-600"
                  }`}
                >
                  {passwordMessage.includes("بنجاح") ? "✓" : "⚠️"} {passwordMessage}
                </div>
              )}

              <form
                onSubmit={handlePasswordSubmit}
                className="grid gap-5 sm:grid-cols-2"
              >
                {/* Current Password */}
                <div>
                  <label
                    htmlFor="current_password"
                    className="mb-2 block text-sm font-black text-slate-700"
                  >
                    كلمة المرور الحالية
                  </label>

                  <div className="relative">
                    <input
                      id="current_password"
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      value={currentPassword}
                      onChange={(e) =>
                        setCurrentPassword(e.target.value)
                      }
                      required
                      autoComplete="current-password"
                      className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3.5 pl-12 text-sm outline-none transition-all focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/10"
                      placeholder="••••••••"
                    />

                    <PasswordToggle
                      show={showCurrentPassword}
                      setShow={setShowCurrentPassword}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-black text-slate-700"
                  >
                    كلمة المرور الجديدة
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3.5 pl-12 text-sm outline-none transition-all focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/10"
                      placeholder="••••••••"
                    />

                    <PasswordToggle
                      show={showPassword}
                      setShow={setShowPassword}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="password_confirmation"
                    className="mb-2 block text-sm font-black text-slate-700"
                  >
                    تأكيد كلمة المرور
                  </label>

                  <div className="relative">
                    <input
                      id="password_confirmation"
                      type={
                        showPasswordConfirmation
                          ? "text"
                          : "password"
                      }
                      value={passwordConfirmation}
                      onChange={(e) =>
                        setPasswordConfirmation(e.target.value)
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3.5 pl-12 text-sm outline-none transition-all focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/10"
                      placeholder="••••••••"
                    />

                    <PasswordToggle
                      show={showPasswordConfirmation}
                      setShow={setShowPasswordConfirmation}
                    />
                  </div>
                </div>

                {/* Password Button */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] hover:shadow-slate-900/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {changingPassword ? (
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
                        جاري تغيير كلمة المرور...
                      </span>
                    ) : (
                      "تغيير كلمة المرور"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* VERIFICATION MODAL */}
          {showVerificationModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 animate-slideUp">
                {/* Modal Header */}
                <div className="relative  px-6 py-7 text-center text-white">
                  <div className="absolute inset-0 opacity-10" />

                  <div className="relative z-10">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 shadow-inner">
                      <svg
                        className="h-10 w-10 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A2 2 0 003.954 4h12.092a2 2 0 001.788.999 2 2 0 000-1.998A2 2 0 0016.046 2H3.954a2 2 0 00-1.788 1 2 2 0 000 2zm11.703 2.267l-5.167 3.19-5.167-3.19A2 2 0 012 7.947V14a2 2 0 002 2h12a2 2 0 002-2V7.948a2 2 0 01-2.13 1.318z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    <h2 className="text-2xl font-black">
                      تحقق من بريدك الإلكتروني
                    </h2>

                    <p className="mt-1.5 text-sm text-white/80">
                      تم إرسال رمز التحقق إلى
                    </p>

                    <p className="mt-1 break-all text-sm font-bold text-white bg-white/10 px-4 py-1.5 rounded-full inline-block">
                      {pendingEmail}
                    </p>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {verificationSuccess ? (
                    <div className="py-6 text-center animate-fadeIn">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                        <svg
                          className="h-10 w-10 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      <h3 className="text-xl font-bold text-green-600">
                        تم التحقق بنجاح! 🎉
                      </h3>

                      <p className="mt-1.5 text-sm text-slate-500">
                        تم تحديث بريدك الإلكتروني
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="mb-5 text-center text-sm text-slate-600">
                        أدخل رمز التحقق المكون من 6 أرقام الذي تم
                        إرساله إلى بريدك الإلكتروني الجديد
                      </p>

                      {verificationError && (
                        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-600 animate-shake">
                          ⚠️ {verificationError}
                        </div>
                      )}

                      <form
                        onSubmit={handleVerifyEmail}
                        className="space-y-5"
                      >
                        <div>
                          <label
                            htmlFor="verification-code"
                            className="mb-2 block text-sm font-black text-slate-700 text-center"
                          >
                            رمز التحقق
                          </label>

                          <input
                            id="verification-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(
                                e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 6)
                              )
                            }
                            placeholder="• • • • • •"
                            required
                            maxLength={6}
                            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-4 text-center text-3xl font-black tracking-[0.75em] text-slate-900 outline-none transition-all placeholder:text-slate-300 placeholder:tracking-normal focus:border-[#17656b] focus:bg-white focus:shadow-[0_0_0_4px_rgba(23,101,107,0.15)]"
                            dir="ltr"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={
                              verifying ||
                              verificationCode.length !== 6
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-[#17656b]/30 transition-all hover:scale-[1.02] hover:shadow-[#17656b]/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                          >
                            {verifying ? (
                              <>
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
                                جاري التحقق...
                              </>
                            ) : (
                              "✓ تحقق"
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleCloseModal}
                            disabled={verifying}
                            className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            إلغاء
                          </button>
                        </div>
                      </form>

                      <div className="mt-5 text-center">
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={
                            resendLoading ||
                            verifying ||
                            !pendingEmail
                          }
                          className="text-sm font-bold text-[#17656b] transition-all hover:text-[#0f4a4f] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {resendLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg
                                className="h-4 w-4 animate-spin"
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
                              جاري الإرسال...
                            </span>
                          ) : (
                            "🔄 إعادة إرسال رمز التحقق"
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }

        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}