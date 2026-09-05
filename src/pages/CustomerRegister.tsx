import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL


interface RegisterResponse {
  success: boolean
  message?: string
}

interface VerifyResponse {
  success: boolean
  message?: string
  token?: string
  user?: {
    id: number
    name: string
    email: string
    phone: string
    role: string
    email_verified?: boolean
    email_verified_at?: string | null
  }
}

export default function CustomerRegister() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Verification modal states
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  // Store registration data for verification
  const [registrationData, setRegistrationData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: ""
  })

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.")
      return
    }

    if (password !== passwordConfirmation) {
      setError("كلمة المرور وتأكيد كلمة المرور غير متطابقين.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/customer/register`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          password_confirmation: passwordConfirmation,
        }),
      })

      const data: RegisterResponse = await response.json().catch(() => ({
        success: false,
      }))

      if (!response.ok) {
        throw new Error(data.message || "حدث خطأ أثناء إنشاء الحساب.")
      }

      // Store registration data for verification
      setRegistrationData({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: passwordConfirmation,
      })

      // Show verification modal
      setVerificationEmail(email.trim())
      setShowVerificationModal(true)

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إنشاء الحساب."
      )
    } finally {
      setLoading(false)
    }
  }

  // Handle verification code submission - THIS CREATES THE ACCOUNT
  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setVerificationError("")
    setVerifying(true)

    try {
      const response = await fetch(`${API_URL}/customer/verify-email`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registrationData.email,
          code: verificationCode.trim(),
        }),
      })

      const data: VerifyResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "رمز التحقق غير صحيح.")
      }

      if (!data.token || !data.user) {
        throw new Error("تم التحقق ولكن حدث خطأ في تسجيل الدخول.")
      }

      // Account is now created in the database
      // Store customer session
      localStorage.setItem("customer_token", data.token)
      localStorage.setItem("customer_user", JSON.stringify(data.user))
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_user")

      setVerificationSuccess(true)

      // Navigate to store after short delay
      setTimeout(() => {
        setShowVerificationModal(false)
        navigate("/", { replace: true })
      }, 2000)

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

  // Resend verification code
  const handleResendCode = async () => {
    setResendLoading(true)
    setVerificationError("")

    try {
      // Resend OTP using the registration endpoint again
      const response = await fetch(`${API_URL}/customer/register`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registrationData.name,
          email: registrationData.email,
          phone: registrationData.phone,
          password: registrationData.password,
          password_confirmation: registrationData.password_confirmation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "فشل إعادة إرسال رمز التحقق.")
      }

      // Clear any previous errors
      setVerificationError("")

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

  // Close modal - NO ACCOUNT CREATED, user can try again
  const handleCloseModal = () => {
    setShowVerificationModal(false)
    // Optionally clear the form or keep it filled for retry
  }

  return (
    <div
      dir="rtl"
      className="
        min-h-screen
        w-full
        flex
        items-center
        justify-center
        px-4
        py-10
        relative
        bg-gradient-to-br
        from-[#17656b]/90
        via-[#17656b]/70
        to-[#0f4a4f]/90
      "
      style={{
        backgroundImage: `
          url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&auto=format&fit=crop'),
          linear-gradient(135deg, rgba(23, 101, 107, 0.85) 0%, rgba(15, 74, 79, 0.9) 100%)
        `,
        backgroundBlendMode: 'overlay',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Decorative floating elements */}
      <div className="absolute top-10 left-10 text-white/10 text-8xl hidden lg:block animate-bounce">
        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      </div>
      <div className="absolute bottom-10 right-10 text-white/10 text-8xl hidden lg:block animate-pulse">
        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="
          overflow-hidden
          rounded-3xl
          bg-white/95
          backdrop-blur-xl
          shadow-2xl
          border
          transition-all
          duration-300
          hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]
        ">
          {/* Header */}
          <div className="
            relative
            bg-gradient-to-br
            from-[#17656b]
            to-[#0f4a4f]
            px-6
            py-8
            text-center
            text-white
            overflow-hidden
          ">
            {/* Decorative pattern */}
            <div className="
              absolute
              inset-0
              opacity-10
              bg-[radial-gradient(circle_at_20%_30%,_white_1px,_transparent_1px)]
              bg-[length:20px_20px]
            "></div>

            <div className="relative z-10">
              <div className="
                mx-auto
                mb-4
                flex
                h-22
                w-40
                items-center
                justify-center
                rounded-2xl
                bg-white
                shadow-2xl
                transform
                transition-transform
                duration-300
                hover:scale-105
              ">
                <img
                  src="/main_logo.png"
                  alt="أولاد الحكيم"
                  className="h-full w-full object-contain "
                />
              </div>

              <h1 className="text-3xl font-black tracking-tight">
                إنشاء حساب جديد
              </h1>
              <p className="mt-1 text-sm font-medium text-white/80">
                أنشئ حسابك وابدأ التسوق بسهولة
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            {error && (
              <div className="
                mb-5
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-red-200
                bg-red-50/90
                backdrop-blur-sm
                px-4
                py-3
                text-sm
                font-bold
                text-red-600
                animate-shake
              ">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="
                  mb-1.5
                  block
                  text-sm
                  font-black
                  text-slate-700
                  flex
                  items-center
                  gap-2
                ">
                  <svg className="w-4 h-4 text-[#17656b]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  الاسم
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اكتب اسمك"
                    required
                    autoComplete="name"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50/80
                      px-4
                      py-3
                      pr-10
                      text-sm
                      text-slate-900
                      transition-all
                      duration-200
                      placeholder:text-slate-400
                      focus:border-[#17656b]
                      focus:bg-white
                      focus:shadow-[0_0_0_4px_rgba(23,101,107,0.15)]
                      outline-none
                    "
                  />
                  <svg className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    w-4
                    h-4
                    text-slate-400
                  " fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="
                  mb-1.5
                  block
                  text-sm
                  font-black
                  text-slate-700
                  flex
                  items-center
                  gap-2
                ">
                  <svg className="w-4 h-4 text-[#17656b]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    autoComplete="email"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50/80
                      px-4
                      py-3
                      pr-10
                      text-sm
                      text-slate-900
                      transition-all
                      duration-200
                      placeholder:text-slate-400
                      focus:border-[#17656b]
                      focus:bg-white
                      focus:shadow-[0_0_0_4px_rgba(23,101,107,0.15)]
                      outline-none
                    "
                  />
                  <svg className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    w-4
                    h-4
                    text-slate-400
                  " fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  </svg>
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="
                  mb-1.5
                  block
                  text-sm
                  font-black
                  text-slate-700
                  flex
                  items-center
                  gap-2
                ">
                  <svg className="w-4 h-4 text-[#17656b]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  رقم الهاتف
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01012345678"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50/80
                      px-4
                      py-3
                      pr-10
                      text-sm
                      text-slate-900
                      transition-all
                      duration-200
                      placeholder:text-slate-400
                      focus:border-[#17656b]
                      focus:bg-white
                      focus:shadow-[0_0_0_4px_rgba(23,101,107,0.15)]
                      outline-none
                    "
                  />
                  <svg className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    w-4
                    h-4
                    text-slate-400
                  " fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="
                  mb-1.5
                  block
                  text-sm
                  font-black
                  text-slate-700
                  flex
                  items-center
                  gap-2
                ">
                  <svg className="w-4 h-4 text-[#17656b]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50/80
                      px-4
                      py-3
                      pr-10
                      text-sm
                      text-slate-900
                      transition-all
                      duration-200
                      placeholder:text-slate-400
                      focus:border-[#17656b]
                      focus:bg-white
                      focus:shadow-[0_0_0_4px_rgba(23,101,107,0.15)]
                      outline-none
                    "
                  />
                  <svg className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    w-4
                    h-4
                    text-slate-400
                  " fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="
                  mb-1.5
                  block
                  text-sm
                  font-black
                  text-slate-700
                  flex
                  items-center
                  gap-2
                ">
                  <svg className="w-4 h-4 text-[#17656b]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50/80
                      px-4
                      py-3
                      pr-10
                      text-sm
                      text-slate-900
                      transition-all
                      duration-200
                      placeholder:text-slate-400
                      focus:border-[#17656b]
                      focus:bg-white
                      focus:shadow-[0_0_0_4px_rgba(23,101,107,0.15)]
                      outline-none
                    "
                  />
                  <svg className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    w-4
                    h-4
                    text-slate-400
                  " fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="
                  relative
                  w-full
                  rounded-xl
                  bg-gradient-to-r
                  from-[#17656b]
                  to-[#0f4a4f]
                  px-4
                  py-3.5
                  text-sm
                  font-black
                  text-white
                  shadow-lg
                  shadow-[#17656b]/30
                  transition-all
                  duration-300
                  hover:shadow-[#17656b]/50
                  hover:scale-[1.02]
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  disabled:hover:scale-100
                  flex
                  items-center
                  justify-center
                  gap-2
                  overflow-hidden
                "
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    إنشاء الحساب
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="
              mt-6
              border-t
              border-slate-200/70
              pt-6
              text-center
            ">
              <p className="text-sm text-slate-500">
                لديك حساب بالفعل؟
              </p>
              <Link
                to="/customer/login"
                className="
                  mt-1
                  inline-flex
                  items-center
                  gap-1.5
                  text-sm
                  font-black
                  text-[#17656b]
                  transition-all
                  duration-200
                  hover:text-[#0f4a4f]
                  hover:underline
                  group
                "
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                تسجيل الدخول
              </Link>
            </div>

            {/* Back to Store */}
            <div className="mt-4 text-center">
              <Link
                to="/"
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-5
                  py-2.5
                  rounded-full
                  bg-white/20
                  backdrop-blur-sm
                  text-xs
                  font-semibold
                  text-black
                  border
                  border-white/30
                  transition-all
                  duration-300
                  hover:bg-white/30
                  hover:scale-105
                  hover:shadow-lg
                  hover:shadow-black/20
                "
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                العودة إلى المتجر
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal - NO SKIP BUTTON */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="
            w-full max-w-md
            bg-white rounded-3xl shadow-2xl
            overflow-hidden
            transform transition-all duration-300
            animate-slideUp
          ">
            {/* Modal Header */}
            <div className="
              relative
              bg-gradient-to-br
              from-[#17656b]
              to-[#0f4a4f]
              px-6
              py-6
              text-center
              text-white
            ">
              <div className="
                absolute
                inset-0
                opacity-10
                bg-[radial-gradient(circle_at_20%_30%,_white_1px,_transparent_1px)]
                bg-[length:20px_20px]
              "></div>

              <div className="relative z-10">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A2 2 0 003.954 4h12.092a2 2 0 001.788.999 2 2 0 000-1.998A2 2 0 0016.046 2H3.954a2 2 0 00-1.788 1 2 2 0 000 2zm11.703 2.267l-5.167 3.19-5.167-3.19A2 2 0 012 7.947V14a2 2 0 002 2h12a2 2 0 002-2V7.948a2 2 0 01-2.13 1.318z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-black">تحقق من بريدك الإلكتروني</h2>
                <p className="mt-1 text-sm text-white/80">
                  تم إرسال رمز التحقق إلى
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {verificationEmail}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {verificationSuccess ? (
                <div className="text-center py-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-green-600">تم التحقق بنجاح!</h3>
                  <p className="mt-1 text-sm text-slate-500">جاري تحويلك إلى المتجر...</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 text-center mb-4">
                    أدخل رمز التحقيق المكون من 6 أرقام الذي تم إرساله إلى بريدك الإلكتروني
                  </p>

                  {verificationError && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-600 animate-shake">
                      {verificationError}
                    </div>
                  )}

                  <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-black text-slate-700">
                        رمز التحقق
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="أدخل الرمز المكون من 6 أرقام"
                        required
                        maxLength={6}
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-200
                          bg-slate-50/80
                          px-4
                          py-3
                          text-center
                          text-2xl
                          font-bold
                          tracking-[0.5em]
                          text-slate-900
                          transition-all
                          duration-200
                          placeholder:text-slate-400
                          placeholder:tracking-normal
                          focus:border-[#17656b]
                          focus:bg-white
                          focus:shadow-[0_0_0_4px_rgba(23,101,107,0.15)]
                          outline-none
                        "
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifying}
                      className="
                        w-full
                        rounded-xl
                        bg-gradient-to-r
                        from-[#17656b]
                        to-[#0f4a4f]
                        px-4
                        py-3
                        text-sm
                        font-black
                        text-white
                        shadow-lg
                        shadow-[#17656b]/30
                        transition-all
                        duration-300
                        hover:shadow-[#17656b]/50
                        hover:scale-[1.02]
                        disabled:opacity-60
                        disabled:cursor-not-allowed
                        disabled:hover:scale-100
                        flex
                        items-center
                        justify-center
                        gap-2
                      "
                    >
                      {verifying ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          جاري التحقق...
                        </>
                      ) : (
                        "تحقق من البريد الإلكتروني"
                      )}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      onClick={handleResendCode}
                      disabled={resendLoading}
                      className="
                        text-sm
                        font-bold
                        text-[#17656b]
                        transition-all
                        duration-200
                        hover:text-[#0f4a4f]
                        hover:underline
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                      "
                    >
                      {resendLoading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          جاري الإرسال...
                        </span>
                      ) : (
                        "إعادة إرسال رمز التحقق"
                      )}
                    </button>
                  </div>

                  {/* Close button - NO ACCOUNT CREATED */}
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleCloseModal}
                      className="
                        text-sm
                        font-medium
                        text-slate-500
                        transition-all
                        duration-200
                        hover:text-slate-700
                        hover:underline
                      "
                    >
                      إلغاء وإنشاء حساب جديد
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add animation keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce {
          animation: bounce 4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
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
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}