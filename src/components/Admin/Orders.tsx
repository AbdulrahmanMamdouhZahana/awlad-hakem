import { useEffect, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"
import { apiFetch } from "../../services/api"
import { OrderCard, OrderDetailsModal } from "../UI"

import type {
  Order as OrderCardOrder,
  OrderItem,
} from "../UI/Cards/OrderCard"

interface Order extends OrderCardOrder {
  delivery_id?: number | null
  delivery?: Delivery | null
}

interface Delivery {
  id: number
  name: string
  email: string
  phone: string
  role: string
  is_active: boolean
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [confirmingOrder, setConfirmingOrder] =
    useState<number | null>(null)
  const [cancellingOrder, setCancellingOrder] =
    useState<number | null>(null)

  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [deliverySelectionOrder, setDeliverySelectionOrder] =
    useState<Order | null>(null)
  const [selectedDeliveryId, setSelectedDeliveryId] =
    useState<number | null>(null)
  const [assigningDelivery, setAssigningDelivery] =
    useState(false)

  // Modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false)

  // =====================================
  // New Order Notification
  // =====================================

  // Keeps track of orders already known to the page.
  // This prevents the same order from notifying again
  // on every 5-second refresh.
  const knownOrderIdsRef = useRef<Set<number>>(new Set())
  const firstOrdersLoadRef = useRef(true)

  // Web Audio API is used so we don't need an external sound file.
  const audioContextRef = useRef<AudioContext | null>(null)

  const playNewOrderSound = () => {
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

      // Two short tones for a clear notification sound.
      ;[0, 0.18].forEach((offset, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()

        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(
          index === 0 ? 880 : 1175,
          now + offset
        )

        gain.gain.setValueAtTime(0.0001, now + offset)
        gain.gain.exponentialRampToValueAtTime(
          0.22,
          now + offset + 0.02
        )
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + offset + 0.16
        )

        oscillator.connect(gain)
        gain.connect(context.destination)

        oscillator.start(now + offset)
        oscillator.stop(now + offset + 0.17)
      })
    } catch (error) {
      console.warn("NEW ORDER SOUND ERROR:", error)
    }
  }

  const showNewOrderNotification = (order: Order) => {
    playNewOrderSound()

    toast.custom(
      (toastInstance) => (
        <button
          type="button"
          onClick={() => {
            toast.dismiss(toastInstance.id)
            handleViewOrderDetails(order)
          }}
          className="
            w-[min(92vw,420px)]
            rounded-2xl
            border
            border-indigo-200
            bg-white
            p-4
            text-right
            shadow-2xl
            ring-1
            ring-black/5
            transition
            hover:scale-[1.01]
          "
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
              🔔
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-indigo-700">
                طلب جديد 🎉
              </p>

              <p className="mt-1 text-sm font-black text-slate-900">
                الطلب #{order.id}
              </p>

              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                {order.customer_name}
              </p>

              <p className="mt-1 text-xs font-bold text-emerald-600">
                الإجمالي:{" "}
                {Number(order.total || 0).toLocaleString("ar-EG")} جنيه
              </p>

              <p className="mt-2 text-[11px] font-bold text-slate-400">
                اضغط لعرض تفاصيل الطلب
              </p>
            </div>
          </div>
        </button>
      ),
      {
        duration: 8000,
        position: "top-center",
      }
    )
  }

  // =====================================
  // Load Orders
  // =====================================

  const loadOrders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      const response = await apiFetch("/orders")
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.orders)
          ? response.orders
          : Array.isArray(response?.data)
            ? response.data
            : []

      // Normalize all orders to the same flow.
      // Electronic payments must also start as pending.
      // Old/backend pending_approval values are converted to pending.
      const nextOrders = (list as Order[]).map((order) => ({
        ...order,
        status: order.status === "pending_approval" ? "pending" : order.status,
      }))

      // =====================================
      // Detect genuinely new orders
      // =====================================
      if (firstOrdersLoadRef.current) {
        // Do NOT notify for orders that already existed
        // when the admin page was first opened.
        knownOrderIdsRef.current = new Set(
          nextOrders.map((order) => order.id)
        )

        firstOrdersLoadRef.current = false
      } else {
        const newOrders = nextOrders.filter(
          (order) => !knownOrderIdsRef.current.has(order.id)
        )

        // Remember every order we've seen.
        nextOrders.forEach((order) => {
          knownOrderIdsRef.current.add(order.id)
        })

        // Notify only for orders that appeared after
        // the first load.
        newOrders.forEach((order) => {
          showNewOrderNotification(order)
        })
      }

      setOrders(nextOrders)
    } catch (error) {
      console.error("LOAD ORDERS ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل الطلبات"
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // =====================================
  // Load Deliveries
  // =====================================

  const loadDeliveries = async () => {
    try {
      const response = await apiFetch("/admin/deliveries")

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.deliveries)
          ? response.deliveries
          : Array.isArray(response?.data)
            ? response.data
            : []

      setDeliveries(
        list.filter(
          (delivery: Delivery) =>
            delivery.role === "delivery" && delivery.is_active
        )
      )
    } catch (error) {
      console.error("LOAD DELIVERIES ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل الدليفري"
      )
    }
  }

  // =====================================
  // Unlock notification audio after admin interaction
  // =====================================

  useEffect(() => {
    const unlockAudio = () => {
      try {
        if (!audioContextRef.current) {
          const AudioContextClass =
            window.AudioContext ||
            (window as typeof window & {
              webkitAudioContext?: typeof AudioContext
            }).webkitAudioContext

          if (!AudioContextClass) return

          audioContextRef.current = new AudioContextClass()
        }

        if (audioContextRef.current.state === "suspended") {
          void audioContextRef.current.resume()
        }
      } catch (error) {
        console.warn("AUDIO UNLOCK ERROR:", error)
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
  // Initial Load + Auto Refresh (silent)
  // =====================================

  useEffect(() => {
    // التحميل الأولي مع ظهور شاشة التحميل
    void loadOrders(true)
    void loadDeliveries()

    // كل 5 ثواني تحديث في الخلفية بدون شاشة تحميل
    const refreshTimer = window.setInterval(() => {
      void loadOrders(false)
    }, 5000) // 5 ثواني

    return () => {
      window.clearInterval(refreshTimer)
    }
  }, [])

  // =====================================
  // Confirm + Assign Delivery
  // =====================================

  const openDeliverySelection = (order: Order) => {
    setDeliverySelectionOrder(order)
    setSelectedDeliveryId(order.delivery_id ?? null)
  }

  const normalizeEgyptPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "")

    if (digits.startsWith("20")) return digits
    if (digits.startsWith("0")) return `20${digits.slice(1)}`
    if (digits.startsWith("1") && digits.length === 10) return `20${digits}`

    return digits
  }

const buildDeliveryWhatsAppMessage = (
  order: Order,
  delivery: Delivery
) => {
  const items = (order.order_items ?? [])
    .map(
      (item) =>
        `• ${item.product_name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString("ar-EG")} جنيه`
    )
    .join("\n")

  const location =
    order.latitude !== null &&
    order.longitude !== null
      ? `📍 موقع العميل:\nhttps://www.google.com/maps?q=${order.latitude},${order.longitude}`
      : "📍 موقع العميل: لم يتم تحديد الموقع"

  return [
    "السلام عليكم 👋",
    "",
    "*طلب جديد - أولاد الحكيم*",
    `📦 رقم الطلب: #${order.id}`,
    "",
    `👤 العميل: ${order.customer_name}`,
    `📞 رقم العميل: ${order.phone}`,
    `🏠 العنوان: ${order.address}`,
    "",
    location,
    order.notes ? `📝 ملاحظات: ${order.notes}` : "",
    "",
    "🛒 المنتجات:",
    items || "• لا توجد منتجات مسجلة",
    "",
    `💰 الإجمالي: ${Number(order.total).toLocaleString("ar-EG")} جنيه`,
    `💳 طريقة الدفع: ${order.payment_method}`,
    "",
    `🚚 الدليفري المسؤول: ${delivery.name}`,
    "",
    "من فضلك راجع بيانات الطلب وابدأ التوصيل.",
  ]
    .filter(Boolean)
    .join("\n")
}

  const handleConfirmOrder = (orderId: number) => {
    const order = orders.find((item) => item.id === orderId)

    if (!order) {
      toast.error("الطلب غير موجود")
      return
    }

    openDeliverySelection(order)
  }

  const handleConfirmWithDelivery = async () => {
    if (!deliverySelectionOrder || !selectedDeliveryId) return

    const delivery = deliveries.find(
      (item) => item.id === selectedDeliveryId && item.is_active
    )

    if (!delivery) {
      toast.error("من فضلك اختر دليفري متاح أولاً")
      return
    }

    const whatsappWindow = window.open("about:blank", "_blank")

    try {
      setAssigningDelivery(true)
      setConfirmingOrder(deliverySelectionOrder.id)

      // 1) Confirm order in Laravel
      const confirmResponse = await apiFetch(
        `/orders/${deliverySelectionOrder.id}/confirm`,
        { method: "PATCH" }
      )

      const confirmedOrder =
        confirmResponse?.order ??
        confirmResponse?.data ??
        confirmResponse

      // 2) Assign delivery in Laravel
      const assignResponse = await apiFetch(
        `/orders/${deliverySelectionOrder.id}/assign`,
        {
          method: "PATCH",
          body: JSON.stringify({
            delivery_id: delivery.id,
          }),
        }
      )

      const assignedOrder =
        assignResponse?.order ??
        assignResponse?.data ??
        assignResponse

      const finalOrder: Order = {
        ...deliverySelectionOrder,
        ...(confirmedOrder ?? {}),
        ...(assignedOrder ?? {}),
        delivery_id: delivery.id,
        delivery,
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === deliverySelectionOrder.id
            ? finalOrder
            : order
        )
      )

      if (selectedOrder?.id === deliverySelectionOrder.id) {
        setSelectedOrder(finalOrder)
      }

      // 3) WhatsApp
      const whatsappNumber = normalizeEgyptPhone(delivery.phone)

      if (whatsappNumber && whatsappWindow) {
        const message = buildDeliveryWhatsAppMessage(
          finalOrder,
          delivery
        )

        const whatsappUrl =
          `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

        whatsappWindow.location.href = whatsappUrl
      } else if (whatsappWindow) {
        whatsappWindow.close()
      }

      setDeliverySelectionOrder(null)
      setSelectedDeliveryId(null)

      toast.success(
        "تم تأكيد الطلب وتعيين الدليفري بنجاح"
      )

      // تحديث في الخلفية بعد التأكيد
      await loadOrders(false)
    } catch (error) {
      if (whatsappWindow) {
        whatsappWindow.close()
      }

      console.error("CONFIRM + ASSIGN ORDER ERROR:", error)

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تأكيد الطلب وتعيين الدليفري"
      )
    } finally {
      setAssigningDelivery(false)
      setConfirmingOrder(null)
    }
  }


  // =====================================
  // Cancel + Delete Order
  // =====================================

  const handleCancelOrder = async (orderId: number) => {
    const order = orders.find((item) => item.id === orderId)

    if (!order) {
      toast.error("الطلب غير موجود")
      return
    }

    const isPending = order.status === "pending"
    const isDelivered = order.status === "delivered"

    if (!isPending && !isDelivered) {
      toast.error("يمكن حذف الطلب فقط وهو قيد الانتظار أو بعد إتمام التوصيل")
      return
    }

    const actionText = isDelivered ? "حذف" : "إلغاء وحذف"

    const confirmed = window.confirm(
      `هل أنت متأكد من ${actionText} الطلب #${order.id}؟\\n\\nسيتم حذف الطلب نهائياً ولا يمكن استرجاعه.`
    )

    if (!confirmed) return

    try {
      setCancellingOrder(orderId)

      await apiFetch(`/orders/${orderId}`, {
        method: "DELETE",
      })

      setOrders((currentOrders) =>
        currentOrders.filter((item) => item.id !== orderId)
      )

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null)
        setOrderModalOpen(false)
      }

      toast.success(`تم ${isDelivered ? "حذف" : "إلغاء وحذف"} الطلب #${orderId}`)
    } catch (error) {
      console.error("CANCEL ORDER ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إلغاء الطلب"
      )
    } finally {
      setCancellingOrder(null)
    }
  }

  // =====================================
  // Filter Orders
  // =====================================

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    const endOfYesterday = new Date(startOfToday)
    endOfYesterday.setMilliseconds(-1)

    const startOfDaysAgo = (days: number) => {
      const date = new Date(startOfToday)
      date.setDate(date.getDate() - (days - 1))
      return date
    }

    let rangeStart: Date | null = null
    let rangeEnd: Date | null = null

    if (timeFilter === "today") {
      rangeStart = startOfToday
      rangeEnd = endOfToday
    } else if (timeFilter === "yesterday") {
      rangeStart = startOfYesterday
      rangeEnd = endOfYesterday
    } else if (timeFilter === "7days") {
      rangeStart = startOfDaysAgo(7)
      rangeEnd = endOfToday
    } else if (timeFilter === "30days") {
      rangeStart = startOfDaysAgo(30)
      rangeEnd = endOfToday
    } else if (timeFilter === "custom") {
      if (dateFrom) {
        rangeStart = new Date(`${dateFrom}T00:00:00`)
      }

      if (dateTo) {
        rangeEnd = new Date(`${dateTo}T23:59:59.999`)
      }
    }

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.customer_name?.toLowerCase().includes(query) ||
        order.phone?.toLowerCase().includes(query) ||
        String(order.id).includes(query)

      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter

const orderDate = order.created_at
  ? new Date(order.created_at)
        : new Date(0)
      const matchesTime =
        (!rangeStart || orderDate >= rangeStart) &&
        (!rangeEnd || orderDate <= rangeEnd)

      return matchesSearch && matchesStatus && matchesTime
    })
  }, [
    orders,
    search,
    statusFilter,
    timeFilter,
    dateFrom,
    dateTo,
  ])

  // =====================================
  // Stats
  // =====================================

  const pendingCount = orders.filter(
    (order) =>
      order.status === "pending"
  ).length

  const confirmedCount = orders.filter(
    (order) =>
      order.status === "confirmed"
  ).length

  const deliveredCount = orders.filter(
    (order) =>
      order.status === "delivered"
  ).length

  const totalSales = orders.reduce(
    (sum, order) =>
      sum + Number(order.total || 0),
    0
  )

  // =====================================
  // View Order Details
  // =====================================

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setOrderModalOpen(true)
  }

  // =====================================
  // Helpers
  // =====================================

  const formatDate = (date?: string) => {
  if (!date) return "-"

  return new Date(date).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

  const getStatusLabel = (
    status: string
  ) => {
    if (status === "pending_approval") status = "pending"

    switch (status) {
      case "confirmed":
        return "مؤكد"

      case "pending":
        return "قيد الانتظار"

      case "cancelled":
        return "ملغي"

      default:
        return status
    }
  }

  const getStatusClass = (
    status: string
  ) => {
    if (status === "pending_approval") status = "pending"

    switch (status) {
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200"

      case "cancelled":
        return "bg-red-50 text-red-700 ring-red-200"

      default:
        return "bg-amber-50 text-amber-700 ring-amber-200"
    }
  }

  const openGoogleMaps = (
    order: Order
  ) => {
    if (
      order.latitude === null ||
      order.longitude === null
    ) {
      toast.error(
        "لا يوجد موقع GPS لهذا الطلب"
      )

      return
    }

    const url =
      `https://www.google.com/maps?q=${order.latitude},${order.longitude}`

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    )
  }

  // =====================================
  // Loading
  // =====================================

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl font-black text-slate-950">
            الطلبات
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            إدارة ومتابعة طلبات العملاء
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm font-bold text-slate-500">
            جاري تحميل الطلبات...
          </p>
        </div>

      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">

        {/* =====================================
            Header
        ===================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-xs font-black text-indigo-600">
              إدارة المتجر
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-950">
              الطلبات
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              تابع طلبات العملاء وحالتها وتفاصيلها.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-indigo-500 flex items-center gap-1">
                <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.5 14a7 7 0 0 0 11.9 2.5L20 14M4 10l2.6-2.5A7 7 0 0 1 18.5 10" />
                </svg>
                جاري التحديث...
              </span>
            )}
            <button
              type="button"
              onClick={() => void loadOrders(false)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h5M20 20v-5h-5M5.5 14a7 7 0 0 0 11.9 2.5L20 14M4 10l2.6-2.5A7 7 0 0 1 18.5 10"
                />
              </svg>

              تحديث
            </button>
          </div>

        </div>


        {/* =====================================
            Stats
        ===================================== */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500">
              كل الطلبات
            </p>

            <p className="mt-3 text-3xl font-black text-slate-950">
              {orders.length}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-bold text-amber-700">
              قيد الانتظار
            </p>

            <p className="mt-3 text-3xl font-black text-amber-900">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-700">
              الطلبات المؤكدة
            </p>

            <p className="mt-3 text-3xl font-black text-emerald-900">
              {confirmedCount}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-bold text-blue-700">
              تم التوصيل
            </p>

            <p className="mt-3 text-3xl font-black text-blue-900">
              {deliveredCount}
            </p>
          </div>

          <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
            <p className="text-xs font-bold text-indigo-700">
              إجمالي المبيعات
            </p>

            <p className="mt-3 text-2xl font-black text-indigo-950">
              {totalSales.toLocaleString("ar-EG")}
              <span className="mr-1 text-sm">
                جنيه
              </span>
            </p>
          </div>

        </div>


        {/* =====================================
            Filters
        ===================================== */}

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row">

            {/* Search */}

            <div className="relative flex-1">

              <svg
                className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                />
              </svg>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="ابحث باسم العميل أو رقم الهاتف أو رقم الطلب..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

            </div>


            {/* Status */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">
                كل الطلبات
              </option>

              <option value="pending">
                قيد الانتظار
              </option>

              <option value="confirmed">
                مؤكد
              </option>

              <option value="cancelled">
                ملغي
              </option>
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(event) => {
                setTimeFilter(event.target.value)
                if (event.target.value !== "custom") {
                  setDateFrom("")
                  setDateTo("")
                }
              }}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">كل الوقت</option>
              <option value="today">اليوم</option>
              <option value="yesterday">أمس</option>
              <option value="7days">آخر 7 أيام</option>
              <option value="30days">آخر 30 يوم</option>
              <option value="custom">تاريخ مخصص</option>
            </select>

          </div>

          {timeFilter === "custom" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-bold text-slate-500">
                من تاريخ
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-bold text-slate-500">
                إلى تاريخ
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </label>
            </div>
          )}

        </div>


        {/* =====================================
            Orders
        ===================================== */}

        {filteredOrders.length === 0 ? (

          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h18M5 5v14h14V5M8 9h8M8 13h5"
                />
              </svg>

            </div>

            <h3 className="mt-5 text-lg font-black text-slate-800">
              لا توجد طلبات
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              لم نجد طلبات مطابقة للبحث الحالي.
            </p>

          </div>

        ) : (

          <div className="grid gap-5 xl:grid-cols-2">

            {filteredOrders.map((order) => (

              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={handleViewOrderDetails}
                onConfirm={handleConfirmOrder}
                onCancel={handleCancelOrder}
                isConfirming={confirmingOrder === order.id}
                isCancelling={cancellingOrder === order.id}
                compact={false}
              />

            ))}

          </div>

        )}

      </div>

      {/* =====================================
          Confirm + Delivery Selection Modal
      ===================================== */}

      {deliverySelectionOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  تأكيد الطلب #{deliverySelectionOrder.id}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  اختر الدليفري قبل تأكيد الطلب وإرسال بياناته على WhatsApp.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (assigningDelivery) return
                  setDeliverySelectionOrder(null)
                  setSelectedDeliveryId(null)
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-700">
                العميل: {deliverySelectionOrder.customer_name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                الإجمالي:{" "}
                {Number(deliverySelectionOrder.total).toLocaleString("ar-EG")} جنيه
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-black text-slate-700">
                اختر الدليفري
              </label>

              <select
                value={selectedDeliveryId ?? ""}
                disabled={assigningDelivery}
                onChange={(event) =>
                  setSelectedDeliveryId(
                    Number(event.target.value) || null
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 disabled:bg-slate-100"
              >
                <option value="">-- اختر الدليفري --</option>

                {deliveries.map((delivery) => (
                  <option key={delivery.id} value={delivery.id}>
                    {delivery.name} - {delivery.phone}
                  </option>
                ))}
              </select>

              {deliveries.length === 0 && (
                <p className="mt-2 text-xs font-semibold text-red-500">
                  لا يوجد دليفري متاح حالياً.
                </p>
              )}
            </div>

            {selectedDeliveryId && (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                {(() => {
                  const delivery = deliveries.find(
                    (item) => item.id === selectedDeliveryId
                  )

                  if (!delivery) return null

                  return (
                    <>
                      <p className="font-black text-emerald-800">
                        🚚 {delivery.name}
                      </p>
                      <p className="mt-1 text-sm text-emerald-700">
                        📞 {delivery.phone}
                      </p>
                    </>
                  )
                })()}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={assigningDelivery}
                onClick={() => {
                  setDeliverySelectionOrder(null)
                  setSelectedDeliveryId(null)
                }}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={
                  !selectedDeliveryId ||
                  assigningDelivery
                }
                onClick={() => void handleConfirmWithDelivery()}
                className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assigningDelivery
                  ? "جاري التأكيد..."
                  : "✓ تأكيد وإرسال WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          Order Details Modal (Headless UI)
      ===================================== */}
<OrderDetailsModal
  isOpen={orderModalOpen}
  onClose={() => {
    setOrderModalOpen(false)
    setSelectedOrder(null)
  }}
  order={selectedOrder}
  onConfirm={handleConfirmOrder}
  onCancel={handleCancelOrder}
  confirming={confirmingOrder === selectedOrder?.id}
  cancelling={cancellingOrder === selectedOrder?.id}
/>

    </>
  )
}

export default Orders