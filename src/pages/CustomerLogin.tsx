import { type FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL

export default function CustomerLogin() {
  const navigate = useNavigate()

  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/customer/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ login, password }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || "البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة."
        )
      }

   
localStorage.setItem("customer_token", data.token)
localStorage.setItem(
  "customer_user",
  JSON.stringify(data.user)
)

// Notify Navbar that customer logged in
window.dispatchEvent(
  new Event("customer-auth-changed")
)

navigate("/")
        
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تسجيل الدخول."
      )
    } finally {
      setLoading(false)
    }
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
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
      </div>
      <div className="absolute bottom-10 right-10 text-white/10 text-8xl hidden lg:block animate-pulse">
        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
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
                أهلاً بيك 
              </h1>
              <p className="mt-1 text-sm font-medium text-white/80">
                سجل دخولك عشان تكمل التسوق
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

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Login Field */}
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
                  البريد الإلكتروني أو رقم الهاتف
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="example@email.com أو 01012345678"
                    required
                    autoComplete="username"
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
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
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
                    autoComplete="current-password"
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
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                    تسجيل الدخول
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="
              mt-6
              border-t
              border-slate-200/70
              pt-6
              text-center
            ">
              <p className="text-sm text-slate-500">
                معندكش حساب؟
              </p>
              <Link
                to="/customer/register"
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
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                إنشاء حساب جديد
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Website */}
        <div className="mt-5 text-center">
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
              text-white
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
            العودة للموقع
          </Link>
        </div>
      </div>

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
      `}</style>
    </div>
  )
}