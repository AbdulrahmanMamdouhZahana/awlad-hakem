import { useState } from "react"
import toast from "react-hot-toast"

import {
  createOrder,
} from "../services/orderService"

interface iProducts {
  id: number
  name: string
  category: string
  price: number
  unit: string
  image: string
  stock: number
  created_at?: string
}

interface CartItem {
  product: iProducts
  quantity: number
}

interface IProps {
  cart: CartItem[]
  onClose: () => void
  onSuccess: () => void
}

const Checkout = ({
  cart,
  onClose,
  onSuccess,
}: IProps) => {

  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    notes: "",
    paymentMethod: "الدفع عند الاستلام",
  })

  const total = cart.reduce(
    (sum, item) =>
      sum + item.product.price * item.quantity,
    0
  )

  // =========================
  // Get Customer Location
  // =========================

  const getMyLocation = () => {

    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع")
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {

        const lat = position.coords.latitude
        const lng = position.coords.longitude

        setLatitude(lat)
        setLongitude(lng)

        setLocationLoading(false)

        toast.success("تم تحديد موقعك بنجاح 📍")
      },

      (error) => {

        console.error("LOCATION ERROR:", error)

        setLocationLoading(false)

        if (error.code === error.PERMISSION_DENIED) {
          toast.error(
            "من فضلك اسمح للموقع من إعدادات المتصفح"
          )
        } else if (error.code === error.TIMEOUT) {
          toast.error(
            "استغرق تحديد الموقع وقتاً طويلاً"
          )
        } else {
          toast.error(
            "تعذر تحديد موقعك"
          )
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  // =========================
  // Submit Order
  // =========================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    if (!form.customerName.trim()) {
      toast.error("من فضلك اكتب الاسم")
      return
    }

    if (!form.phone.trim()) {
      toast.error("من فضلك اكتب رقم الموبايل")
      return
    }

    if (!form.address.trim()) {
      toast.error("من فضلك اكتب العنوان")
      return
    }

    if (cart.length === 0) {
      toast.error("السلة فارغة")
      return
    }

    // Location is required
    if (latitude === null || longitude === null) {
      toast.error("من فضلك حدد موقعك على الخريطة")
      return
    }

    try {

      setLoading(true)

      await createOrder({

        customerName:
          form.customerName.trim(),

        phone:
          form.phone.trim(),

        address:
          form.address.trim(),

        notes:
          form.notes.trim(),

        paymentMethod:
          form.paymentMethod,

        total,

        latitude,
        longitude,

        items: cart.map((item) => ({
          productId:
            item.product.id,

          productName:
            item.product.name,

          price:
            item.product.price,

          quantity:
            item.quantity,
        })),

      })

      toast.success(
        "تم إرسال طلبك بنجاح 🎉"
      )

      onSuccess()

    } catch (error) {

      console.error(
        "CREATE ORDER ERROR:",
        error
      )

      toast.error(
        "حدث خطأ أثناء إرسال الطلب"
      )

    } finally {

      setLoading(false)

    }
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

        {/* =========================
            Header
        ========================= */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div>

            <h2 className="text-2xl font-bold text-slate-900">
              إتمام الطلب
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              أدخل بياناتك وموقع التوصيل
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>

        </div>

        {/* =========================
            Form
        ========================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >

          {/* Name */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              الاسم *
            </label>

            <input
              type="text"
              value={form.customerName}
              onChange={(e) =>
                setForm({
                  ...form,
                  customerName:
                    e.target.value,
                })
              }
              placeholder="اكتب اسمك"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />

          </div>

          {/* Phone */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              رقم الموبايل *
            </label>

            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              placeholder="01xxxxxxxxx"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />

          </div>

          {/* Address */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              العنوان *
            </label>

            <textarea
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value,
                })
              }
              placeholder="اكتب عنوان التوصيل بالتفصيل"
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />

          </div>

          {/* =========================
              Location
          ========================= */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              موقع التوصيل *
            </label>

            <button
              type="button"
              onClick={getMyLocation}
              disabled={locationLoading || loading}
              className={`w-full rounded-2xl border px-4 py-4 font-semibold transition ${
                latitude !== null && longitude !== null
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >

              {locationLoading
                ? "📍 جاري تحديد موقعك..."
                : latitude !== null &&
                  longitude !== null
                ? "✓ تم تحديد موقع التوصيل"
                : "📍 تحديد موقعي الحالي"}

            </button>

            {latitude !== null &&
              longitude !== null && (

              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">

                <p>
                  تم حفظ موقعك بنجاح
                </p>

                <p className="mt-1">
                  Latitude: {latitude.toFixed(6)}
                </p>

                <p>
                  Longitude: {longitude.toFixed(6)}
                </p>

              </div>

            )}

          </div>

          {/* Payment */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              طريقة الدفع *
            </label>

            <div className="grid gap-3 sm:grid-cols-2">

              <label
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  form.paymentMethod ===
                  "الدفع عند الاستلام"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200"
                }`}
              >

                <input
                  type="radio"
                  name="payment"
                  value="الدفع عند الاستلام"
                  checked={
                    form.paymentMethod ===
                    "الدفع عند الاستلام"
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentMethod:
                        e.target.value,
                    })
                  }
                  className="ml-2"
                />

                الدفع عند الاستلام

              </label>

              <label
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  form.paymentMethod ===
                  "الدفع إلكتروني"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200"
                }`}
              >

                <input
                  type="radio"
                  name="payment"
                  value="الدفع إلكتروني"
                  checked={
                    form.paymentMethod ===
                    "الدفع إلكتروني"
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentMethod:
                        e.target.value,
                    })
                  }
                  className="ml-2"
                />

                الدفع إلكتروني

              </label>

            </div>

          </div>

          {/* Notes */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              ملاحظات
            </label>

            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
              }
              placeholder="أي ملاحظات إضافية..."
              rows={2}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />

          </div>

          {/* Summary */}

          <div className="rounded-2xl bg-slate-50 p-5">

            <div className="mb-3 flex justify-between text-sm text-slate-500">

              <span>
                عدد المنتجات
              </span>

              <span>
                {cart.reduce(
                  (sum, item) =>
                    sum + item.quantity,
                  0
                )}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="font-semibold text-slate-700">
                الإجمالي
              </span>

              <span className="text-2xl font-bold text-slate-900">
                {total} جنيه
              </span>

            </div>

          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading
              ? "جاري إرسال الطلب..."
              : "تأكيد الطلب"}

          </button>

        </form>

      </div>

    </div>
  )
}

export default Checkout