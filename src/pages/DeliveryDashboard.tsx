import { useEffect, useMemo, useState, useRef } from "react"
import toast from "react-hot-toast"
import { supabase } from "../lib/supabase"
import { useOutletContext } from "react-router-dom"

interface DeliveryUser {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  is_active?: boolean
}

interface OrderItem {
  id: number
  product_name: string
  price: number
  quantity: number
}

interface Order {
  id: number
  customer_name: string
  phone: string
  address: string
  notes?: string
  payment_method: string
  total: number
  status: string
  latitude?: number | null
  longitude?: number | null
  created_at?: string
  assigned_at?: string | null
  picked_up_at?: string | null
  delivered_at?: string | null
  delivery_id?: number | null
  order_items?: OrderItem[]
  delivery_proof_image?: string | null
}

const statusLabel = (status: string) => {
  switch (status) {
    case "assigned": return "جاهز للتوصيل"
    case "out_for_delivery": return "🚚 خارج للتوصيل"
    case "delivered": return "✅ تم التوصيل"
    case "confirmed": return "تم التأكيد"
    default: return status || "غير محدد"
  }
}

const statusClass = (status: string) => {
  switch (status) {
    case "assigned": return "bg-violet-100 text-violet-700"
    case "out_for_delivery": return "bg-blue-100 text-blue-700"
    case "delivered": return "bg-emerald-100 text-emerald-700"
    default: return "bg-amber-100 text-amber-700"
  }
}

export default function DeliveryDashboard() {
  const { user } = useOutletContext<{ user: DeliveryUser }>()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // =====================================
  // Delivery Confirmation Modal State
  // =====================================

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmOrderId, setConfirmOrderId] = useState<number | null>(null)
  const [deliveryImage, setDeliveryImage] = useState<File | null>(null)
  const [deliveryImagePreview, setDeliveryImagePreview] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // =====================================
  // Notifications State
  // =====================================

  const knownOrderIdsRef = useRef<Set<number>>(new Set())
  const firstLoadRef = useRef(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [newOrderCount, setNewOrderCount] = useState(0)

  // =====================================
  // Play Notification Sound
  // =====================================

  const playNotificationSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext
        }).webkitAudioContext

      if (!AudioContextClass) return

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      const context = audioContextRef.current

      if (context.state === "suspended") {
        void context.resume()
      }

      const now = context.currentTime

      ;[0, 0.25].forEach((offset, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()

        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(
          index === 0 ? 880 : 1175,
          now + offset
        )

        gain.gain.setValueAtTime(0.0001, now + offset)
        gain.gain.exponentialRampToValueAtTime(
          0.25,
          now + offset + 0.02
        )
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + offset + 0.2
        )

        oscillator.connect(gain)
        gain.connect(context.destination)

        oscillator.start(now + offset)
        oscillator.stop(now + offset + 0.22)
      })
    } catch (error) {
      console.warn("DELIVERY NOTIFICATION SOUND ERROR:", error)
    }
  }

  // =====================================
  // Show Notification Toast
  // =====================================

  const showNotification = (order: Order) => {
    playNotificationSound()

    toast.custom(
      (toastInstance) => (
        <div
          className="w-[min(92vw,420px)] rounded-2xl border border-indigo-200 bg-white p-4 text-right shadow-2xl ring-1 ring-black/5 animate-slideUp"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
              🚚
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-indigo-700">
                طلب جديد مسند إليك 🎉
              </p>

              <p className="mt-1 text-sm font-black text-slate-900">
                الطلب #{order.id}
              </p>

              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                العميل: {order.customer_name}
              </p>

              <p className="mt-1 text-xs font-bold text-emerald-600">
                الإجمالي: {Number(order.total || 0).toLocaleString("ar-EG")} جنيه
              </p>

              <button
                type="button"
                onClick={() => toast.dismiss(toastInstance.id)}
                className="mt-2 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
              >
                عرض الطلب
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: "top-center",
      }
    )
  }

  // =====================================
  // Upload Image to Laravel API
  // =====================================

  const uploadDeliveryImage = async (file: File, orderId: number): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('order_id', String(orderId))

      const token = localStorage.getItem("staff_token")

      console.log("📤 UPLOADING IMAGE...")
      console.log("Order ID:", orderId)
      console.log("File:", file.name, file.size, "bytes")

      const response = await fetch(`${import.meta.env.VITE_API_URL}/delivery/upload-delivery-image`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      console.log("📥 UPLOAD RESPONSE:", data)

      if (!response.ok) {
        throw new Error(data?.message || "فشل رفع الصورة")
      }

      const imageUrl = data.image_url || data.url || data.path

      if (!imageUrl) {
        throw new Error("لم يتم استلام رابط الصورة من الخادم")
      }

      console.log("✅ IMAGE UPLOADED:", imageUrl)
      return imageUrl

    } catch (error) {
      console.error("❌ UPLOAD IMAGE ERROR:", error)
      throw error
    }
  }

  // =====================================
  // Confirm Delivery with Image
  // =====================================

  const confirmDeliveryWithImage = async (orderId: number) => {
    if (!deliveryImage) {
      toast.error("من فضلك اختر صورة تأكيد التوصيل")
      return
    }

    try {
      setConfirming(true)

      // رفع الصورة
      toast.loading("جاري رفع صورة التأكيد...", { id: "upload-image" })
      const imageUrl = await uploadDeliveryImage(deliveryImage, orderId)
      toast.dismiss("upload-image")

      console.log("✅ Image uploaded, URL:", imageUrl)

      // تحديث الطلب مع حفظ رابط الصورة في Supabase
      const updateData = {
        status: "delivered",
        delivered_at: new Date().toISOString(),
        delivery_proof_image: imageUrl,
      }

      console.log("📝 Updating order with:", updateData)

      const { data, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select("*")
        .single()

      if (error) {
        console.error("❌ UPDATE ORDER ERROR:", error)
        throw error
      }

      console.log("✅ Order updated:", data)

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...data,
              }
            : order
        )
      )

      toast.success("✅ تم تأكيد التوصيل بنجاح مع صورة التأكيد")

      // Reset modal
      setShowConfirmModal(false)
      setDeliveryImage(null)
      setDeliveryImagePreview(null)
      setConfirmOrderId(null)

    } catch (error) {
      console.error("❌ CONFIRM DELIVERY ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تأكيد التوصيل"
      )
    } finally {
      setConfirming(false)
    }
  }

  // =====================================
  // Delete Delivered Order
  // =====================================

  // =====================================
// Delete Delivered Order
// =====================================

const deleteOrder = async (orderId: number) => {
  const confirmed = window.confirm(
    `هل أنت متأكد من حذف الطلب #${orderId}؟\nهذا الإجراء لا يمكن التراجع عنه.`
  )

  if (!confirmed) return

  try {
    setDeletingId(orderId)

    console.log("🗑️ DELETING ORDER:", orderId)

    // ✅ 1. حذف عناصر الطلب أولاً (order_items)
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId)

    if (itemsError) {
      console.error("❌ DELETE ORDER ITEMS ERROR:", itemsError)
      throw new Error("فشل حذف عناصر الطلب: " + itemsError.message)
    }

    console.log("✅ Order items deleted")

    // ✅ 2. حذف الطلب نفسه
    const { error: orderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId)

    if (orderError) {
      console.error("❌ DELETE ORDER ERROR:", orderError)
      throw new Error("فشل حذف الطلب: " + orderError.message)
    }

    console.log("✅ Order deleted successfully")

    // ✅ 3. تحديث الـ state - إزالة الطلب
    setOrders((prev) => {
      const newOrders = prev.filter((order) => order.id !== orderId)
      console.log("📝 Orders after deletion:", newOrders.length)
      return newOrders
    })

    // ✅ 4. إزالة الـ ID من الـ known IDs عشان ما يرجعش تاني
    knownOrderIdsRef.current.delete(orderId)

    // ✅ 5. تحديث العداد
    setNewOrderCount(0)

    toast.success(`✅ تم حذف الطلب #${orderId} بنجاح`)

  } catch (error) {
    console.error("❌ DELETE ORDER ERROR:", error)
    toast.error(
      error instanceof Error
        ? error.message
        : "حدث خطأ أثناء حذف الطلب"
    )
    
    // ✅ لو فشل الحذف، نعيد تحميل الطلبات عشان نتأكد من الحالة
    await load(false, false)
    
  } finally {
    setDeletingId(null)
  }
}

  // =====================================
  // Open Confirm Modal
  // =====================================

  const openConfirmModal = (orderId: number) => {
    setConfirmOrderId(orderId)
    setDeliveryImage(null)
    setDeliveryImagePreview(null)
    setShowConfirmModal(true)
  }

  // =====================================
  // Handle Image Selection
  // =====================================

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

    setDeliveryImage(file)
    setDeliveryImagePreview(URL.createObjectURL(file))
  }

  // =====================================
  // Load Orders
  // =====================================

  const load = async (showLoading = false, isBackground = false) => {
    try {
      if (showLoading) setLoading(true)

      const deliveryId = Number(user?.id)

      if (!deliveryId) {
        throw new Error("لم يتم العثور على معرف الدليفري")
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            order_id,
            product_id,
            product_name,
            price,
            quantity
          )
        `)
        .eq("delivery_id", deliveryId)
        .in("status", [
          "confirmed",
          "assigned",
          "out_for_delivery",
          "delivered",
        ])
        .order("created_at", {
          ascending: false,
        })

      if (error) {
        console.error("SUPABASE DELIVERY ORDERS ERROR:", error)
        throw error
      }

      const fetchedOrders = (data ?? []) as Order[]

      if (!isBackground) {
        setOrders(fetchedOrders)
        knownOrderIdsRef.current = new Set(
          fetchedOrders.map((order) => order.id)
        )
        firstLoadRef.current = false
        setNewOrderCount(0)
      } else {
        const currentIds = new Set(fetchedOrders.map((order) => order.id))
        const knownIds = knownOrderIdsRef.current

        const newOrders = fetchedOrders.filter(
          (order) => !knownIds.has(order.id)
        )

        const allKnownIds = new Set([...knownIds, ...currentIds])
        
        if (newOrders.length > 0) {
          setNewOrderCount((prev) => prev + newOrders.length)

          newOrders.forEach((order) => {
            if (order.status === "confirmed" || order.status === "assigned") {
              showNotification(order)
            }
          })
        }

        knownOrderIdsRef.current = allKnownIds
        setOrders(fetchedOrders)
      }
    } catch (error) {
      console.error("DELIVERY DASHBOARD ERROR:", error)

      if (showLoading) {
        toast.error(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل الطلبات"
        )
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // =====================================
  // Unlock Audio on User Interaction
  // =====================================

  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext
          }).webkitAudioContext

        if (!AudioContextClass) return

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass()
        }

        if (audioContextRef.current.state === "suspended") {
          void audioContextRef.current.resume()
        }
      } catch (error) {
        console.warn("DELIVERY AUDIO UNLOCK ERROR:", error)
      }
    }

    window.addEventListener("click", unlockAudio)
    window.addEventListener("keydown", unlockAudio)

    return () => {
      window.removeEventListener("click", unlockAudio)
      window.removeEventListener("keydown", unlockAudio)
    }
  }, [])

  // =====================================
  // Initial Load & Auto Refresh
  // =====================================

  useEffect(() => {
    if (user?.id) {
      void load(true, false)

      const timer = window.setInterval(() => {
        void load(false, true)
      }, 5000)

      return () => window.clearInterval(timer)
    }
  }, [user])

  // =====================================
  // Stats
  // =====================================

  const stats = useMemo(() => ({
    total: orders.length,
    waiting: orders.filter((o) => o.status === "assigned" || o.status === "confirmed").length,
    out: orders.filter((o) => o.status === "out_for_delivery").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  }), [orders])

  // =====================================
  // Update Order Status (Out for delivery only)
  // =====================================

  const updateStatus = async (
    orderId: number,
    action: "out" | "delivered"
  ) => {
    try {
      setWorkingId(orderId)

      const newStatus =
        action === "out"
          ? "out_for_delivery"
          : "delivered"

      const updateData =
        action === "out"
          ? {
              status: newStatus,
              picked_up_at: new Date().toISOString(),
            }
          : {
              status: newStatus,
              delivered_at: new Date().toISOString(),
            }

      const { data, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select("*")
        .single()

      if (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error)
        throw error
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...data,
              }
            : order
        )
      )

      toast.success(
        action === "out"
          ? "تم تسجيل خروجك للتوصيل 🚚"
          : "تم تسجيل وصول الطلب بنجاح ✅"
      )
    } catch (error) {
      console.error("UPDATE DELIVERY STATUS ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحديث حالة الطلب"
      )
    } finally {
      setWorkingId(null)
    }
  }

  // =====================================
  // Render
  // =====================================

  return (
    <div>
      {/* New Orders Alert */}
      {newOrderCount > 0 && (
        <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <p className="font-black text-indigo-700">
                  لديك {newOrderCount} طلب{newOrderCount > 1 ? "ات" : ""} جديد{newOrderCount > 1 ? "ة" : ""}
                </p>
                <p className="text-sm text-indigo-600">
                  تم إسناد {newOrderCount > 1 ? "ها" : "ه"} إليك
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setNewOrderCount(0)
                      }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
            >
              تم المشاهدة
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-indigo-600">لوحة الدليفري</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            أهلاً يا {user?.name || "دليفري"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            الطلبات المسندة إليك
          </p>
        </div>
        <button
          onClick={() => void load(true, false)}
          disabled={loading}
          className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          ↻ تحديث الطلبات
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["كل الطلبات", stats.total, "text-slate-900"],
          ["لسه مستلمها", stats.waiting, "text-violet-600"],
          ["خارج للتوصيل", stats.out, "text-blue-600"],
          ["وصلت", stats.delivered, "text-emerald-600"],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-400">{label}</p>
            <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="rounded-3xl bg-white py-20 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 font-semibold text-slate-500">جاري تحميل طلباتك...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl bg-white py-20 text-center shadow-sm">
          <div className="text-6xl">📦</div>
          <h2 className="mt-5 text-xl font-black text-slate-800">مفيش طلبات مسندة ليك</h2>
          <p className="mt-2 text-sm text-slate-400">لما الأدمن يعين لك طلب هيظهر هنا.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {orders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400">رقم الطلب</p>
                  <h2 className="text-xl font-black text-slate-900">#{order.id}</h2>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                <p className="font-bold text-slate-800">👤 {order.customer_name}</p>
                <p className="text-sm text-slate-600">📞 {order.phone}</p>
                <p className="text-sm leading-6 text-slate-600">📍 {order.address}</p>
                {order.notes && <p className="text-sm text-slate-500">📝 {order.notes}</p>}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm font-bold text-slate-500">الإجمالي</span>
                  <span className="text-lg font-black text-indigo-600">{Number(order.total).toFixed(2)} جنيه</span>
                </div>
              </div>

              {order.order_items && order.order_items.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-black text-slate-700">محتويات الطلب</p>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span className="font-bold">{Number(item.price) * item.quantity} ج</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Image if exists */}
              {order.delivery_proof_image && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-bold text-emerald-700">📸 صورة التأكيد</p>
                  <img
                    src={order.delivery_proof_image}
                    alt="تأكيد التوصيل"
                    className="mt-2 max-h-48 w-full rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-image.png"
                      e.currentTarget.className = "mt-2 max-h-48 w-full rounded-lg object-contain p-4 bg-slate-50"
                    }}
                  />
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {(order.status === "assigned" || order.status === "confirmed") && (
                  <button
                    onClick={() => void updateStatus(order.id, "out")}
                    disabled={workingId === order.id}
                    className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {workingId === order.id ? "جاري التحديث..." : "🚚 أنا خارج للتوصيل"}
                  </button>
                )}

                {order.status === "out_for_delivery" && (
                  <button
                    onClick={() => openConfirmModal(order.id)}
                    disabled={workingId === order.id}
                    className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    📸 تأكيد التوصيل بالصورة
                  </button>
                )}

                {order.status === "delivered" && (
                  <div className="w-full space-y-2">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-center text-sm font-bold text-emerald-700">
                      ✅ تم توصيل الطلب{order.delivered_at ? ` في ${new Date(order.delivered_at).toLocaleString("ar-EG")}` : ""}
                      {order.delivery_proof_image && " 📸 مع صورة تأكيد"}
                    </div>
                    {/* ✅ زر حذف الطلب بعد التوصيل */}
                    <button
                      onClick={() => deleteOrder(order.id)}
                      disabled={deletingId === order.id}
                      className="w-full rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === order.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          جاري الحذف...
                        </span>
                      ) : (
                        "🗑 حذف الطلب"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* =====================================
          Delivery Confirmation Modal
      ===================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 animate-slideUp">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-6 text-center text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_white_1px,_transparent_1px)] bg-[length:20px_20px] opacity-10" />
              <div className="relative z-10">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <span className="text-3xl">📸</span>
                </div>
                <h2 className="text-xl font-black">تأكيد التوصيل</h2>
                <p className="mt-1 text-sm text-white/80">
                  ارفع صورة تأكيد وصول الطلب #{confirmOrderId}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="mb-4 text-center text-sm text-slate-600">
                يرجى رفع صورة توضح وصول الطلب للعميل
              </p>

              {/* Image Upload */}
              <div className="mb-4">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-emerald-400 hover:bg-emerald-50">
                  {deliveryImagePreview ? (
                    <div className="w-full">
                      <img
                        src={deliveryImagePreview}
                        alt="معاينة الصورة"
                        className="mx-auto max-h-48 rounded-lg object-cover"
                      />
                      <p className="mt-2 text-sm font-bold text-emerald-600">✓ تم اختيار الصورة</p>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl">🖼️</span>
                      <span className="mt-2 text-sm font-bold text-slate-700">اختر صورة التأكيد</span>
                      <span className="mt-1 text-xs text-slate-400">JPG, PNG, WEBP - حتى 5MB</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false)
                    setDeliveryImage(null)
                    setDeliveryImagePreview(null)
                    setConfirmOrderId(null)
                  }}
                  disabled={confirming}
                  className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => confirmOrderId && confirmDeliveryWithImage(confirmOrderId)}
                  disabled={!deliveryImage || confirming}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:scale-[1.02] hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {confirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جاري التأكيد...
                    </span>
                  ) : (
                    "✅ تأكيد التوصيل"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  )
}