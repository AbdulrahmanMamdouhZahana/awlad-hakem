import { useEffect, useState } from "react"

interface LoadingScreenProps {
  isLoading: boolean
}

const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  const [minimumTimePassed, setMinimumTimePassed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumTimePassed(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // يفضل ظاهر لو:
  // 1. لسه أول 3 ثواني
  // أو
  // 2. الداتا لسه ماوصلتش
  const showLoading = !minimumTimePassed || isLoading

  if (!showLoading) {
    return null
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[99999]
        flex
        items-center
        justify-center
        bg-white
      "
      dir="rtl"
    >
      <div className="flex flex-col items-center">

        {/* Logo */}

        <div
          className="
            mb-6
            flex
            h-24
            w-24
            items-center
            justify-center
            rounded-3xl
            bg-white
            shadow-xl
            animate-[loaderLogo_1.5s_ease-in-out_infinite]
          "
        >
          <img
            src="/main_logo.png"
            alt="أولاد الحكيم"
            className="h-20 w-20 object-contain"
          />
        </div>

        {/* Spinner */}

        <div
          className="
            h-9
            w-9
            animate-spin
            rounded-full
            border-[3px]
            border-slate-200
            border-t-indigo-600
          "
        />

        {/* Text */}

        <p className="mt-5 text-sm font-bold text-slate-700">
          جاري تحميل المتجر...
        </p>

        <p className="mt-1 text-xs text-slate-400">
          لحظات ونكون جاهزين
        </p>

      </div>
    </div>
  )
}

export default LoadingScreen