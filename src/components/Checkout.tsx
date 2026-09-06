import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { supabase } from "../lib/supabase"
import { apiFetch } from "../services/api" // ✅ إضافة apiFetch

import {
  createOrder,
} from "../services/orderService"

interface iProducts {
  id: number
  name: string
  category: string
  price: number
  tax_rate?: number | null
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

interface BankAccount {
  id: number
  bank_name: string
  account_name: string
  account_number: string
  account_type: string
  is_active: boolean
}

const Checkout = ({
  cart,
  onClose,
  onSuccess,
}: IProps) => {

  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  // =========================
  // Bank Transfer State
  // =========================

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [transferImage, setTransferImage] = useState<File | null>(null)
  const [transferImagePreview, setTransferImagePreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    notes: "",
    paymentMethod: "الدفع عند الاستلام",
  })

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + item.product.price * item.quantity,
    0
  )

  const tax = cart.reduce(
    (sum, item) => {
      const rate = Number(item.product.tax_rate || 0)
      if (rate <= 0) return sum
      return sum + (item.product.price * item.quantity * (rate / 100))
    },
    0
  )

  const total = Math.round((subtotal + tax) * 100) / 100

  // =========================
  // Load Bank Accounts from Laravel API
  // =========================

  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        setLoadingAccounts(true)
        
        // console.log("🔍 Loading bank accounts from Laravel API...")

        // ✅ استخدام apiFetch لجلب البيانات من Laravel
        const response = await apiFetch("/bank-accounts")

        // console.log("📦 API Response:", response)

        if (response && response.data && response.data.length > 0) {
          setBankAccounts(response.data)
          setSelectedBankId(response.data[0].id)
          // console.log("✅ Bank accounts loaded from API:", response.data)
        } else {
          console.warn("⚠️ No bank accounts found in API")
          toast.error("لا توجد حسابات بنكية متاحة حالياً")
        }
      } catch (error) {
        console.error("❌ LOAD BANK ACCOUNTS ERROR:", error)
        toast.error(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل الحسابات البنكية"
        )
      } finally {
        setLoadingAccounts(false)
      }
    }
    loadBankAccounts()
  }, [])

  // =========================
  // Upload Transfer Image to Supabase
  // =========================

  const uploadTransferImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `transfer_${Date.now()}.${fileExt}`
    const filePath = `transfer_images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("transfer-images")
      .upload(filePath, file)

    if (uploadError) {
      console.error("UPLOAD ERROR:", uploadError)
      throw new Error("فشل رفع صورة التحويل")
    }

    const { data: urlData } = supabase.storage
      .from("transfer-images")
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

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
  // Handle Image Selection
  // =========================

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("من فضلك اختر ملف صورة صحيح")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت")
      return
    }

    setTransferImage(file)
    setTransferImagePreview(URL.createObjectURL(file))
  }

  // =========================
  // Copy to Clipboard
  // =========================

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`تم نسخ ${label} 📋`)
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      toast.success(`تم نسخ ${label} 📋`)
    })
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

  

    if (!/^01\d{9}$/.test(form.phone)) {
  toast.error("رقم الموبايل يجب أن يكون 11 رقم ويبدأ بـ 01")
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

    // ✅ التحقق من صورة التحويل للدفع الإلكتروني
    if (form.paymentMethod === "الدفع إلكتروني") {
      if (!transferImage) {
        toast.error("من فضلك ارفع صورة التحويل الإلكتروني")
        return
      }
      if (!selectedBankId) {
        toast.error("من فضلك اختر الحساب المحول إليه")
        return
      }
    }

    try {

      setLoading(true)

      let transferImageUrl = ""
      
      // ✅ رفع صورة التحويل إذا كانت موجودة
      if (transferImage) {
        toast.loading("جاري رفع صورة التحويل...", { id: "upload-image" })
        transferImageUrl = await uploadTransferImage(transferImage)
        toast.dismiss("upload-image")
      }

      // ✅ تحديد حالة الطلب بناءً على طريقة الدفع
      const orderStatus = form.paymentMethod === "الدفع إلكتروني" 
        ? "pending_approval" 
        : "pending"

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

        // ✅ إضافة بيانات التحويل
        transferImage: transferImageUrl,
        bankAccountId: selectedBankId,
        status: orderStatus,

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
        form.paymentMethod === "الدفع إلكتروني"
          ? "تم إرسال طلبك بنجاح، في انتظار تأكيد الدفع 🎉"
          : "تم إرسال طلبك بنجاح 🎉"
      )

      onSuccess()

    } catch (error) {

      console.error(
        "CREATE ORDER ERROR:",
        error
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إرسال الطلب"
      )

    } finally {

      setLoading(false)

    }
  }

  // =========================
  // Render
  // =========================

  // ✅ الحصول على الحساب المحدد
  const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankId)

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
  maxLength={11}
  inputMode="numeric"
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11)

    setForm({
      ...form,
      phone: value,
    })
  }}
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

          {/* =========================
              Payment Method
          ========================= */}

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

                <span className="text-xl">💵</span> الدفع عند الاستلام

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

                <span className="text-xl">🏦</span> الدفع إلكتروني

              </label>

            </div>

          </div>

          {/* =========================
              Bank Transfer Details
          ========================= */}

          {form.paymentMethod === "الدفع إلكتروني" && (
            <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-5 space-y-4">

              <h3 className="text-lg font-black text-amber-800 flex items-center gap-2">
                <span>🏦</span> بيانات التحويل الإلكتروني
              </h3>

              {/* ✅ عرض الحسابات من Laravel API */}
              {loadingAccounts ? (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                    <span className="text-sm text-amber-700">جاري تحميل الحسابات...</span>
                  </div>
                </div>
              ) : bankAccounts.length === 0 ? (
                <div className="rounded-xl bg-amber-100 p-4 text-center">
                  <p className="text-amber-800">⚠️ لا توجد حسابات بنكية متاحة حالياً</p>
                  <p className="text-sm text-amber-700 mt-1">برجاء التواصل مع الدعم الفني</p>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-bold text-amber-700">
                    اختر الحساب المحول إليه:
                  </label>
                  <div className="space-y-2">
                    {bankAccounts.map((account) => (
                      <label
                        key={account.id}
                        className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition ${
                          selectedBankId === account.id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="bank_account"
                          value={account.id}
                          checked={selectedBankId === account.id}
                          onChange={() => setSelectedBankId(account.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">
                              {account.account_type === "instapay" ? "📱" : "📱"} {account.bank_name}
                            </p>
                            <span className="text-xs bg-amber-100 px-2 py-0.5 rounded-full text-amber-700">
                              {account.account_type === "instapay" ? "إنستاباي" : "فودافون كاش"}
                            </span>
                          </div>
                          <p 
                            className="text-lg font-bold text-indigo-600 cursor-pointer hover:text-indigo-800 transition"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(account.account_number, `رقم ${account.bank_name}`)
                            }}
                          >
                            {account.account_number}
                          </p>
                          <p className="text-sm text-slate-600">باسم: {account.account_name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(account.account_number, `رقم ${account.bank_name}`)
                          }}
                          className="shrink-0 rounded-xl bg-indigo-100 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-200 transition"
                        >
                          📋 نسخ
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ عرض الحساب المحدد */}
              {selectedAccount && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-sm font-bold text-emerald-700">✓ ستحول إلى:</p>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <p className="font-bold text-slate-900">{selectedAccount.bank_name}</p>
                      <p className="text-lg font-bold text-emerald-700">{selectedAccount.account_number}</p>
                      <p className="text-sm text-slate-600">باسم: {selectedAccount.account_name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedAccount.account_number, `رقم ${selectedAccount.bank_name}`)}
                      className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition"
                    >
                      📋 نسخ
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Notice */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-800">
                ℹ️ تنبيه: المبلغ المحول الآن ({total.toFixed(2)} ج.م) يغطي المنتجات والضريبة. سيتم تحديد مصاريف التوصيل بواسطة الإدارة لاحقاً بناءً على المسافة.
              </div>

              {/* Upload Image */}
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  صورة التحويل *
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 transition hover:border-indigo-400">
                  {transferImagePreview ? (
                    <div className="w-full">
                      <img
                        src={transferImagePreview}
                        alt="صورة التحويل"
                        className="mx-auto max-h-48 rounded-lg object-cover"
                      />
                      <p className="mt-2 text-sm font-bold text-green-600">✓ تم اختيار الصورة</p>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl">📸</span>
                      <span className="mt-2 text-sm font-bold text-slate-700">
                        اختر صورة التحويل
                      </span>
                      <span className="mt-1 text-xs text-slate-400">
                        JPG, PNG, WEBP - حتى 5MB
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>

             

            </div>
          )}

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
          <div className="rounded-2xl bg-slate-50 p-5 space-y-2.5">
            <div className="flex justify-between text-sm text-slate-500 font-bold">
              <span>عدد المنتجات</span>
              <span>
                {cart.reduce(
                  (sum, item) =>
                    sum + item.quantity,
                  0
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm text-slate-600 font-bold">
              <span>المجموع الفرعي (المنتجات)</span>
              <span>{subtotal.toFixed(2)} ج.م</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600 font-bold">
              <span>ضريبة القيمة المضافة (Tax)</span>
              <span>{tax.toFixed(2)} ج.م</span>
            </div>

            <div className="flex items-center justify-between text-xs rounded-xl bg-amber-50 border border-amber-200 p-2.5">
              <span className="font-bold text-amber-800">🚚 مصاريف التوصيل:</span>
              <span className="font-black text-amber-700">جاري تحديدها بواسطة الإدارة</span>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <div>
                <span className="font-black text-slate-800 block text-base">
                  المجموع قبل التوصيل
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  (سيتم تحديد وإضافة مصاريف التوصيل من الإدارة)
                </span>
              </div>

              <span className="text-2xl font-black text-indigo-700">
                {total.toFixed(2)} ج.م
              </span>
            </div>
          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-4 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading
              ? "جاري إرسال الطلب..."
              : form.paymentMethod === "الدفع إلكتروني"
              ? `🏦 تأكيد التحويل إلى ${selectedAccount?.bank_name || ''}`
              : "تأكيد الطلب"}

          </button>

        </form>

      </div>

    </div>
  )
}

export default Checkout