import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import toast from "react-hot-toast"
import { supabase } from "../lib/supabase"
import { useOutletContext } from "react-router-dom"
import { apiFetch } from "../services/api"
import { confirmDelete } from "../utils/alerts"

// =====================================================
// Types
// =====================================================

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
  order_id?: number
  product_id?: number
  product_name: string
  price: number
  quantity: number
  sale_type?: "piece" | "weight"
  weight?: number | null
}

interface Order {
  id: number
  customer_name: string
  phone: string
  address: string
  notes?: string
  payment_method: string
  subtotal?: number | null
  tax?: number | null
  delivery_fee?: number | null
  delivery_status?: "pending" | "calculated" | string | null
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

interface DeliveryProofImage {
  id: number
  order_id: number
  delivery_id?: number | null
  image_url: string
  created_at?: string
}

// =====================================================
// Constants & Helpers
// =====================================================

const ORDER_STATUSES = {
  CONFIRMED: "confirmed",
  ASSIGNED: "assigned",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
} as const

type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES]

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  assigned: { label: "جاهز للتوصيل", className: "bg-violet-100 text-violet-700" },
  out_for_delivery: { label: "🚚 خارج للتوصيل", className: "bg-blue-100 text-blue-700" },
  delivered: { label: "✅ تم التوصيل", className: "bg-emerald-100 text-emerald-700" },
  confirmed: { label: "تم التأكيد", className: "bg-amber-100 text-amber-700" },
}

const DEFAULT_STATUS_CONFIG = { label: "غير محدد", className: "bg-amber-100 text-amber-700" }

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status as OrderStatus] ?? DEFAULT_STATUS_CONFIG
}

const formatDate = (date?: string | null): string => {
  if (!date) return "غير متوفر"
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? "غير متوفر" : parsed.toLocaleString("ar-EG")
}

const formatTimeOnly = (date?: string | null): string => {
  if (!date) return "—"
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
}

const formatMoney = (value: number): string => {
  return Number(value || 0).toLocaleString("ar-EG")
}

const normalizeWhatsAppPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "")
  
  if (!digits) return ""
  
  if (digits.startsWith("0")) {
    return `20${digits.slice(1)}`
  }
  
  if (!digits.startsWith("20")) {
    return `20${digits}`
  }
  
  return digits
}

const isValidEgyptianPhone = (phone: string): boolean => {
  return /^201[0-9]{9}$/.test(phone)
}

// =====================================================
// Audio Service
// =====================================================

class AudioNotificationService {
  private context: AudioContext | null = null

  private getContext(): AudioContext | null {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return null
      
      if (!this.context) {
        this.context = new AudioContextClass()
      }
      
      return this.context
    } catch {
      return null
    }
  }

  playSound(): void {
    const context = this.getContext()
    if (!context) return

    if (context.state === "suspended") {
      void context.resume()
    }

    const now = context.currentTime

    ;[0, 0.25].forEach((offset, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(index === 0 ? 880 : 1175, now + offset)

      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2)

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(now + offset)
      oscillator.stop(now + offset + 0.22)
    })
  }

  unlock(): void {
    const context = this.getContext()
    if (context && context.state === "suspended") {
      void context.resume()
    }
  }
}

const audioService = new AudioNotificationService()

// =====================================================
// Main Component
// =====================================================

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
  const [newOrderCount, setNewOrderCount] = useState(0)

  // =====================================
  // Stats
  // =====================================

  const stats = useMemo(() => ({
    total: orders.length,
    waiting: orders.filter((o) => o.status === ORDER_STATUSES.ASSIGNED || o.status === ORDER_STATUSES.CONFIRMED).length,
    out: orders.filter((o) => o.status === ORDER_STATUSES.OUT_FOR_DELIVERY).length,
    delivered: orders.filter((o) => o.status === ORDER_STATUSES.DELIVERED).length,
  }), [orders])

  // =====================================
  // Notification Toast
  // =====================================

  const showNotificationToast = useCallback((order: Order) => {
    audioService.playSound()

    toast.custom(
      (toastInstance) => (
        <div className="w-[min(92vw,420px)] rounded-2xl border border-indigo-200 bg-white p-4 text-right shadow-2xl ring-1 ring-black/5 animate-slideUp">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
              🚚
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-indigo-700">طلب جديد مسند إليك 🎉</p>
              <p className="mt-1 text-sm font-black text-slate-900">الطلب #{order.id}</p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                العميل: {order.customer_name}
              </p>
              <p className="mt-1 text-xs font-bold text-emerald-600">
                الإجمالي: {formatMoney(order.total || 0)} جنيه
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
      { duration: 10000, position: "top-center" }
    )
  }, [])

  // =====================================
  // Upload Image
  // =====================================

  const uploadDeliveryImage = useCallback(async (file: File, orderId: number): Promise<string> => {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("order_id", String(orderId))

    try {
      const data = await apiFetch("/delivery/upload-delivery-image", {
        method: "POST",
        body: formData,
      })

      const imageUrl = data?.image_url || data?.url || data?.path

      if (!imageUrl) {
        throw new Error("لم يتم استلام رابط الصورة من الخادم")
      }

      return imageUrl
    } catch (error) {
      console.error("❌ UPLOAD IMAGE ERROR:", error)
      throw error
    }
  }, [])

  // =====================================
  // Confirm Delivery with Image
  // =====================================

  const confirmDeliveryWithImage = useCallback(async (orderId: number) => {
    if (!deliveryImage) {
      toast.error("من فضلك اختر صورة تأكيد التوصيل")
      return
    }

    try {
      setConfirming(true)

      toast.loading("جاري رفع صورة التأكيد...", { id: "upload-image" })
      const imageUrl = await uploadDeliveryImage(deliveryImage, orderId)
      toast.dismiss("upload-image")

      const deliveredAt = new Date().toISOString()

      const { error: statusError } = await supabase
        .from("orders")
        .update({
          status: ORDER_STATUSES.DELIVERED,
          delivered_at: deliveredAt,
        })
        .eq("id", orderId)

      if (statusError) {
        console.error("❌ UPDATE ORDER STATUS ERROR:", statusError)
        throw new Error(statusError.message || "فشل تحديث حالة الطلب")
      }

      const { error: imageError } = await supabase
        .from("orders")
        .update({ delivery_proof_image: imageUrl })
        .eq("id", orderId)

      if (imageError) {
        console.warn("⚠️ DELIVERY IMAGE URL SAVE ERROR:", imageError)
      }

      const updateData = {
        status: ORDER_STATUSES.DELIVERED,
        delivered_at: deliveredAt,
        delivery_proof_image: imageUrl,
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, ...updateData } : order
        )
      )

      toast.success(
        imageError
          ? "✅ تم تأكيد التوصيل بنجاح (تعذر حفظ رابط الصورة فقط)"
          : "✅ تم تأكيد التوصيل وحفظ صورة التأكيد بنجاح"
      )

      setShowConfirmModal(false)
      setDeliveryImage(null)
      setDeliveryImagePreview(null)
      setConfirmOrderId(null)
    } catch (error) {
      console.error("❌ CONFIRM DELIVERY ERROR:", error)
      toast.dismiss("upload-image")
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء تأكيد التوصيل")
    } finally {
      setConfirming(false)
    }
  }, [deliveryImage, uploadDeliveryImage])

  // =====================================
  // Delete Order
  // =====================================

  const deleteOrder = useCallback(async (orderId: number) => {
    const confirmed = await confirmDelete(
      `حذف الطلب #${orderId}`,
      `هل أنت متأكد من حذف الطلب #${orderId}؟ هذا الإجراء لا يمكن التراجع عنه.`
    )
    if (!confirmed) {
      return
    }

    try {
      setDeletingId(orderId)

      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId)

      if (itemsError) throw new Error(`فشل حذف عناصر الطلب: ${itemsError.message}`)

      const { error: proofError } = await supabase
        .from("delivery_proof_images")
        .delete()
        .eq("order_id", orderId)

      if (proofError) throw new Error(`فشل حذف صور التأكيد: ${proofError.message}`)

      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId)

      if (orderError) throw new Error(`فشل حذف الطلب: ${orderError.message}`)

      setOrders((prev) => prev.filter((order) => order.id !== orderId))
      knownOrderIdsRef.current.delete(orderId)
      setNewOrderCount(0)

      toast.success(`✅ تم حذف الطلب #${orderId} بنجاح`)
    } catch (error) {
      console.error("❌ DELETE ORDER ERROR:", error)
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء حذف الطلب")
      await loadOrders(false, false)
    } finally {
      setDeletingId(null)
    }
  }, [])

  // =====================================
  // Open Confirm Modal
  // =====================================

  const openConfirmModal = useCallback((orderId: number) => {
    setConfirmOrderId(orderId)
    setDeliveryImage(null)
    setDeliveryImagePreview(null)
    setShowConfirmModal(true)
  }, [])

  // =====================================
  // Handle Image Selection
  // =====================================

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [])

  // =====================================
  // Load Orders
  // =====================================

  const loadOrders = useCallback(async (showLoading = false, isBackground = false) => {
    try {
      if (showLoading) setLoading(true)

      const deliveryId = Number(user?.id)

      if (!deliveryId) {
        throw new Error("لم يتم العثور على معرف الدليفري")
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("delivery_id", deliveryId)
        .in("status", [
          ORDER_STATUSES.CONFIRMED,
          ORDER_STATUSES.ASSIGNED,
          ORDER_STATUSES.OUT_FOR_DELIVERY,
          ORDER_STATUSES.DELIVERED,
        ])
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError

      const baseOrders = ordersData ?? []
      const orderIds = baseOrders.map((order) => Number(order.id))

      let items: OrderItem[] = []

      if (orderIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("id, order_id, product_id, product_name, price, quantity, sale_type, weight")
          .in("order_id", orderIds)

        if (itemsError) throw itemsError

        items = (itemsData ?? []) as OrderItem[]
      }

      let proofImages: DeliveryProofImage[] = []

      if (orderIds.length > 0) {
        const { data: proofData, error: proofError } = await supabase
          .from("delivery_proof_images")
          .select("id, order_id, delivery_id, image_url, created_at")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false })

        if (!proofError) {
          proofImages = (proofData ?? []) as DeliveryProofImage[]
        }
      }

      const fetchedOrders = baseOrders.map((order) => {
        const latestProof = proofImages.find(
          (proof) => Number(proof.order_id) === Number(order.id)
        )

        return {
          ...order,
          order_items: items.filter(
            (item) => Number(item.order_id) === Number(order.id)
          ),
          delivery_proof_image: latestProof?.image_url ?? null,
        }
      }) as Order[]

      if (!isBackground) {
        setOrders(fetchedOrders)
        knownOrderIdsRef.current = new Set(fetchedOrders.map((order) => order.id))
        firstLoadRef.current = false
        setNewOrderCount(0)
      } else {
        const knownIds = knownOrderIdsRef.current
        const fetchedIds = new Set(fetchedOrders.map((order) => order.id))

        const newOrders = fetchedOrders.filter((order) => !knownIds.has(order.id))

        if (newOrders.length > 0) {
          setNewOrderCount((prev) => prev + newOrders.length)

          newOrders.forEach((order) => {
            if (order.status === ORDER_STATUSES.CONFIRMED || order.status === ORDER_STATUSES.ASSIGNED) {
              showNotificationToast(order)
            }
          })
        }

        knownOrderIdsRef.current = new Set([...knownIds, ...fetchedIds])
        setOrders(fetchedOrders)
      }
    } catch (error) {
      console.error("DELIVERY DASHBOARD ERROR:", error)

      if (showLoading) {
        toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء تحميل الطلبات")
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [user, showNotificationToast])

  // =====================================
  // Update Order Status
  // =====================================

  const updateOrderStatus = useCallback(async (orderId: number, action: "out" | "delivered") => {
    try {
      setWorkingId(orderId)

      const updateData = action === "out"
        ? { status: ORDER_STATUSES.OUT_FOR_DELIVERY, picked_up_at: new Date().toISOString() }
        : { status: ORDER_STATUSES.DELIVERED, delivered_at: new Date().toISOString() }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)

      if (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error)
        throw new Error(error.message || "فشل تحديث حالة الطلب")
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, ...updateData } : order
        )
      )

      toast.success(
        action === "out"
          ? "تم تسجيل خروجك للتوصيل 🚚"
          : "تم تسجيل وصول الطلب بنجاح ✅"
      )
    } catch (error) {
      console.error("UPDATE DELIVERY STATUS ERROR:", error)
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث حالة الطلب")
    } finally {
      setWorkingId(null)
    }
  }, [])

  // =====================================
  // WhatsApp
  // =====================================

  const openWhatsApp = useCallback((order: Order) => {
    const rawPhone = String(order.phone || "")
    const phone = normalizeWhatsAppPhone(rawPhone)

    if (!phone) {
      toast.error("رقم العميل غير موجود")
      return
    }

    if (!isValidEgyptianPhone(phone)) {
      toast.error("رقم واتساب العميل غير صحيح")
      return
    }

    const itemsText = (order.order_items ?? [])
      .map((item) => {
        const price = Number(item.price || 0)
        const quantity = Number(item.quantity || 0)
        const weight = Number(item.weight || 0)

        if (item.sale_type === "weight") {
          return `- ${item.product_name}: ${weight} كجم × ${formatMoney(price)} = ${formatMoney(weight * price)} جنيه`
        }

        return `- ${item.product_name}: ${quantity} × ${formatMoney(price)} = ${formatMoney(quantity * price)} جنيه`
      })
      .join("\n")

    const message = [
      `أهلاً ${order.customer_name} 👋`,
      `تم تحديث حالة طلبك رقم #${order.id}`,
      "",
      "المنتجات:",
      itemsText || "لا توجد تفاصيل منتجات",
      "",
      `الإجمالي: ${formatMoney(order.total || 0)} جنيه`,
      `العنوان: ${order.address || "-"}`,
      "",
      "شكراً لطلبك من أولاد الحكيم ❤️",
    ].join("\n")

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }, [])

  // =====================================
  // Effects
  // =====================================

  useEffect(() => {
    const unlockAudio = () => audioService.unlock()
    window.addEventListener("click", unlockAudio)
    window.addEventListener("keydown", unlockAudio)

    return () => {
      window.removeEventListener("click", unlockAudio)
      window.removeEventListener("keydown", unlockAudio)
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      void loadOrders(true, false)

      const timer = window.setInterval(() => {
        void loadOrders(false, true)
      }, 5000)

      return () => window.clearInterval(timer)
    }
  }, [user, loadOrders])

  // =====================================
  // Render Helpers
  // =====================================

  const renderOrderItems = useCallback((items: OrderItem[]) => {
    if (!items || items.length === 0) return null

    return (
      <div className="mt-4">
        <p className="mb-2 text-sm font-black text-slate-700">محتويات الطلب</p>
        <div className="space-y-2">
          {items.map((item) => {
            const price = Number(item.price || 0)
            const quantity = Number(item.quantity || 0)
            const weight = Number(item.weight || 0)
            const total = item.sale_type === "weight" ? price * weight : price * quantity

            return (
              <div key={item.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-bold">{item.product_name}</span>
                  <span className="font-black">{formatMoney(total)} ج</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {item.sale_type === "weight"
                    ? `بالكيلو • ${weight} كجم × ${formatMoney(price)} ج`
                    : `بالقطعة • ${quantity} × ${formatMoney(price)} ج`}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [])

  const renderDeliveryProofImage = useCallback((imageUrl: string) => {
    if (!imageUrl) return null

    return (
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs font-bold text-emerald-700">📸 صورة التأكيد</p>
        <img
          src={imageUrl}
          alt="تأكيد التوصيل"
          className="mt-2 max-h-48 w-full rounded-lg object-cover"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-image.png"
            e.currentTarget.className = "mt-2 max-h-48 w-full rounded-lg object-contain p-4 bg-slate-50"
          }}
        />
      </div>
    )
  }, [])

  const renderOrderActions = useCallback((order: Order) => {
    const isWorking = workingId === order.id
    const isDeleting = deletingId === order.id
    const isDelivered = order.status === ORDER_STATUSES.DELIVERED
    const isAssignedOrConfirmed = order.status === ORDER_STATUSES.ASSIGNED || order.status === ORDER_STATUSES.CONFIRMED
    const isOutForDelivery = order.status === ORDER_STATUSES.OUT_FOR_DELIVERY

    return (
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openWhatsApp(order)}
          className="w-full rounded-2xl bg-[#25D366] px-5 py-3 font-bold text-white transition hover:brightness-95"
        >
          💬 إرسال تفاصيل الطلب على واتساب
        </button>

        {isAssignedOrConfirmed && (
          <button
            onClick={() => void updateOrderStatus(order.id, "out")}
            disabled={isWorking}
            className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isWorking ? "جاري التحديث..." : "🚚 أنا خارج للتوصيل"}
          </button>
        )}

        {isOutForDelivery && (
          <button
            onClick={() => openConfirmModal(order.id)}
            disabled={isWorking}
            className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            📸 تأكيد التوصيل بالصورة
          </button>
        )}

        {isDelivered && (
          <div className="w-full space-y-2">
            <div className="rounded-2xl bg-emerald-50 p-3 text-center text-sm font-bold text-emerald-700">
              ✅ تم توصيل الطلب
              {order.delivered_at && ` في ${formatDate(order.delivered_at)}`}
              {order.delivery_proof_image && " 📸 مع صورة تأكيد"}
            </div>
            <button
              onClick={() => deleteOrder(order.id)}
              disabled={isDeleting}
              className="w-full rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon /> جاري الحذف...
                </span>
              ) : (
                "🗑 حذف الطلب"
              )}
            </button>
          </div>
        )}
      </div>
    )
  }, [workingId, deletingId, openWhatsApp, updateOrderStatus, openConfirmModal, deleteOrder])

  // =====================================
  // Render
  // =====================================

  return (
    <div>
      {/* New Orders Alert */}
      {newOrderCount > 0 && (
        <NewOrdersAlert count={newOrderCount} onDismiss={() => setNewOrderCount(0)} />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-indigo-600">لوحة الدليفري</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            أهلاً يا {user?.name || "دليفري"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">الطلبات المسندة إليك</p>
        </div>
        <button
          onClick={() => void loadOrders(true, false)}
          disabled={loading}
          className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          ↻ تحديث الطلبات
        </button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Orders List */}
      {loading ? (
        <LoadingState />
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              renderOrderItems={renderOrderItems}
              renderDeliveryProofImage={renderDeliveryProofImage}
              renderOrderActions={renderOrderActions}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmDeliveryModal
          orderId={confirmOrderId}
          deliveryImage={deliveryImage}
          deliveryImagePreview={deliveryImagePreview}
          confirming={confirming}
          fileInputRef={fileInputRef}
          onImageSelect={handleImageSelect}
          onConfirm={() => confirmOrderId && confirmDeliveryWithImage(confirmOrderId)}
          onClose={() => {
            setShowConfirmModal(false)
            setDeliveryImage(null)
            setDeliveryImagePreview(null)
            setConfirmOrderId(null)
          }}
        />
      )}

      {/* Styles */}
      <ModalStyles />
    </div>
  )
}

// =====================================================
// Sub-components
// =====================================================

// Spinner Icon
const SpinnerIcon = () => (
  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// New Orders Alert
const NewOrdersAlert = ({ count, onDismiss }: { count: number; onDismiss: () => void }) => (
  <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔔</span>
        <div>
          <p className="font-black text-indigo-700">
            لديك {count} طلب{count > 1 ? "ات" : ""} جديد{count > 1 ? "ة" : ""}
          </p>
          <p className="text-sm text-indigo-600">تم إسناد {count > 1 ? "ها" : "ه"} إليك</p>
        </div>
      </div>
      <button onClick={onDismiss} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500">
        تم المشاهدة
      </button>
    </div>
  </div>
)

// Stats Cards
const StatsCards = ({ stats }: { stats: { total: number; waiting: number; out: number; delivered: number } }) => (
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
)

// Loading State
const LoadingState = () => (
  <div className="rounded-3xl bg-white py-20 text-center shadow-sm">
    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
    <p className="mt-4 font-semibold text-slate-500">جاري تحميل طلباتك...</p>
  </div>
)

// Empty State
const EmptyState = () => (
  <div className="rounded-3xl bg-white py-20 text-center shadow-sm">
    <div className="text-6xl">📦</div>
    <h2 className="mt-5 text-xl font-black text-slate-800">مفيش طلبات مسندة ليك</h2>
    <p className="mt-2 text-sm text-slate-400">لما الأدمن يعين لك طلب هيظهر هنا.</p>
  </div>
)

// Order Card
const OrderCard = ({
  order,
  renderOrderItems,
  renderDeliveryProofImage,
  renderOrderActions,
}: {
  order: Order
  renderOrderItems: (items: OrderItem[]) => React.ReactNode
  renderDeliveryProofImage: (image: string) => React.ReactNode
  renderOrderActions: (order: Order) => React.ReactNode
}) => {
  const statusConfig = getStatusConfig(order.status)

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-400">رقم الطلب</p>
          <h2 className="text-xl font-black text-slate-900">#{order.id}</h2>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
        <p className="font-bold text-slate-800">👤 {order.customer_name}</p>
        <p className="text-sm text-slate-600">📞 {order.phone}</p>
        <p className="text-sm leading-6 text-slate-600">📍 {order.address}</p>
        {order.notes && <p className="text-sm text-slate-500">📝 {order.notes}</p>}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-sm font-bold text-slate-500">الإجمالي</span>
          <span className="text-lg font-black text-indigo-600">{formatMoney(order.total)} جنيه</span>
        </div>
      </div>

      {/* مواعيد التوصيل */}
      {(order.assigned_at || order.picked_up_at || order.delivered_at) && (
        <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-center">
          <p className="mb-2 text-xs font-black text-indigo-900">⏱️ توقيت مراحل الطلب</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-indigo-100 bg-white p-2">
              <p className="text-[10px] font-bold text-indigo-600">تم التعيين</p>
              <p className="mt-0.5 text-xs font-black text-slate-800">
                {order.assigned_at ? formatTimeOnly(order.assigned_at) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-white p-2">
              <p className="text-[10px] font-bold text-blue-600">خرج للتوصيل</p>
              <p className="mt-0.5 text-xs font-black text-blue-900">
                {order.picked_up_at ? formatTimeOnly(order.picked_up_at) : "لم تخرج بعد"}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-2">
              <p className="text-[10px] font-bold text-emerald-600">تم التوصيل</p>
              <p className="mt-0.5 text-xs font-black text-emerald-900">
                {order.delivered_at ? formatTimeOnly(order.delivered_at) : "قيد التوصيل"}
              </p>
            </div>
          </div>
        </div>
      )}

      {renderOrderItems(order.order_items || [])}
      {renderDeliveryProofImage(order.delivery_proof_image || "")}
      {renderOrderActions(order)}
    </article>
  )
}

// Confirm Delivery Modal
const ConfirmDeliveryModal = ({
  orderId,
  deliveryImage,
  deliveryImagePreview,
  confirming,
  fileInputRef,
  onImageSelect,
  onConfirm,
  onClose,
}: {
  orderId: number | null
  deliveryImage: File | null
  deliveryImagePreview: string | null
  confirming: boolean

    fileInputRef: React.RefObject<HTMLInputElement | null>
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onConfirm: () => void
  onClose: () => void
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
    <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 animate-slideUp">
      <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-6 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_white_1px,_transparent_1px)] bg-[length:20px_20px] opacity-10" />
        <div className="relative z-10">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <span className="text-3xl">📸</span>
          </div>
          <h2 className="text-xl font-black">تأكيد التوصيل</h2>
          <p className="mt-1 text-sm text-white/80">ارفع صورة تأكيد وصول الطلب #{orderId}</p>
        </div>
      </div>

      <div className="p-6">
        <p className="mb-4 text-center text-sm text-slate-600">يرجى رفع صورة توضح وصول الطلب للعميل</p>

        <div className="mb-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-emerald-400 hover:bg-emerald-50">
            {deliveryImagePreview ? (
              <div className="w-full">
                <img src={deliveryImagePreview} alt="معاينة الصورة" className="mx-auto max-h-48 rounded-lg object-cover" />
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
              onChange={onImageSelect}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!deliveryImage || confirming}
            className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:scale-[1.02] hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {confirming ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon /> جاري التأكيد...
              </span>
            ) : (
              "✅ تأكيد التوصيل"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)

// Modal Styles
const ModalStyles = () => (
  <style>{`
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-slideUp { animation: slideUp 0.3s ease-out; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fadeIn { animation: fadeIn 0.3s ease-out; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .animate-pulse { animation: pulse 2s ease-in-out infinite; }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin { animation: spin 0.8s linear infinite; }
  `}</style>
)