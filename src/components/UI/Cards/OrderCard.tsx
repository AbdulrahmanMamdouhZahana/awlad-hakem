import Card from "./Card"

export interface Delivery {
  id: number
  name: string
  phone: string
  email?: string
  role?: string
  is_active?: boolean
}

export interface BankAccount {
  id: number
  bank_name: string
  account_name: string
  account_number: string
  account_type: string
  is_active: boolean
}

export interface OrderItem {
  id: number
  order_id?: number
  product_id?: number
  product_name: string
  price: number
  quantity: number
  sale_type?: "piece" | "weight" | "both" | string
  weight?: number | null
}

export interface Order {
  id: number
  customer_name: string
  phone: string
  address: string
  notes: string
  payment_method: string
  total: number
  status: string

  // Payment information
  transfer_image?: string | null
  bank_account_id?: number | null
  bank_account?: BankAccount | null

  latitude: number | null
  longitude: number | null
  created_at?: string
  updated_at?: string
  assigned_at?: string | null
  picked_up_at?: string | null
  delivered_at?: string | null
  order_items?: OrderItem[]

  delivery_id?: number | null

  delivery?: {
    id: number
    name: string
    email: string
    phone: string
    role: string
    is_active: boolean
  } | null
}

interface OrderCardProps {
  order: Order
  onViewDetails?: (order: Order) => void
  onConfirm?: (orderId: number) => void
  onCancel?: (orderId: number) => void
  isConfirming?: boolean
  isCancelling?: boolean
  showActions?: boolean
  className?: string
  compact?: boolean
}

const OrderCard = ({
  order,
  onViewDetails,
  onConfirm,
  onCancel,
  isConfirming = false,
  isCancelling = false,
  showActions = true,
  className = "",
  compact = false,
}: OrderCardProps) => {
  const formatDate = (date?: string) => {
    return date
      ? new Date(date).toLocaleString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-"
  }

  const formatTimeOnly = (date?: string | null) => {
    if (!date) return null
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const calculateDuration = (startTime?: string | null, endTime?: string | null) => {
    if (!startTime || !endTime) return ""
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return ""
    const diffMinutes = Math.round((end - start) / (1000 * 60))
    if (diffMinutes < 1) return "أقل من دقيقة"
    if (diffMinutes < 60) return `${diffMinutes} دقيقة`
    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    return mins > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${hours} ساعة`
  }

  // =============================================
  // Payment Method
  // =============================================

  const getPaymentMethodLabel = (paymentMethod?: string) => {
    const method = String(paymentMethod || "").toLowerCase()

    if (
      method === "electronic" ||
      method === "online" ||
      method === "bank_transfer" ||
      method === "transfer"
    ) {
      return "دفع إلكتروني"
    }

    if (
      method === "cash" ||
      method === "cod" ||
      method === "cash_on_delivery"
    ) {
      return "الدفع عند الاستلام"
    }

    return paymentMethod || "غير محدد"
  }

  const isElectronicPayment = (() => {
    const method = String(order.payment_method || "").trim().toLowerCase()

    return (
      method === "electronic" ||
      method === "online" ||
      method === "bank_transfer" ||
      method === "transfer" ||
      method === "الدفع إلكتروني".toLowerCase() ||
      Boolean(order.transfer_image)
    )
  })()

  // =============================================
  // Status
  // =============================================

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status === "pending_approval" ? "pending" : status

    switch (normalizedStatus) {
      case "confirmed":
        return "مؤكد"
      case "pending":
        return compact ? "جديد" : "قيد الانتظار"
      case "cancelled":
        return "ملغي"
      case "delivered":
        return "تم التوصيل"
      case "assigned":
        return "تم التعيين"
      case "out_for_delivery":
        return "خارج للتوصيل"
      default:
        return status
    }
  }

  const getStatusClass = (status: string) => {
    const normalizedStatus = status === "pending_approval" ? "pending" : status

    switch (normalizedStatus) {
      case "confirmed":
        return compact
          ? "bg-emerald-100 text-emerald-700"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200"
      case "cancelled":
        return compact
          ? "bg-red-100 text-red-700"
          : "bg-red-50 text-red-700 ring-red-200"
      case "delivered":
        return compact
          ? "bg-blue-100 text-blue-700"
          : "bg-blue-50 text-blue-700 ring-blue-200"
      case "assigned":
        return compact
          ? "bg-violet-100 text-violet-700"
          : "bg-violet-50 text-violet-700 ring-violet-200"
      case "out_for_delivery":
        return compact
          ? "bg-blue-100 text-blue-700"
          : "bg-blue-50 text-blue-700 ring-blue-200"
      default:
        return compact
          ? "bg-amber-100 text-amber-700"
          : "bg-amber-50 text-amber-700 ring-amber-200"
    }
  }

  const getStatusEmoji = (status: string) => {
    const normalizedStatus = status === "pending_approval" ? "pending" : status

    switch (normalizedStatus) {
      case "confirmed":
        return "🟢"
      case "pending":
        return "🟡"
      case "cancelled":
        return "🔴"
      case "delivered":
        return "🔵"
      case "assigned":
        return "🟣"
      case "out_for_delivery":
        return "🚚"
      default:
        return "⚪"
    }
  }

  // =============================================
  // Google Maps
  // =============================================

  const openGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (order.latitude === null || order.longitude === null) {
      return
    }

    const url = `https://www.google.com/maps?q=${order.latitude},${order.longitude}`

    window.open(url, "_blank", "noopener,noreferrer")
  }

  // =============================================
  // Total Items
  // =============================================

  const totalItems =
    order.order_items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0

  // =============================================
  // COMPACT VERSION
  // =============================================

  if (compact) {
    return (
      <Card className={className}>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  طلب #{order.id}
                </h3>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                    order.status
                  )}`}
                >
                  {getStatusEmoji(order.status)} {getStatusLabel(order.status)}
                </span>
              </div>

              {order.created_at && (
                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(order.created_at)}
                </p>
              )}
            </div>

            <span className="text-xl font-bold text-slate-900">
              {Number(order.total).toLocaleString("ar-EG")} ج.م
            </span>
          </div>

          {/* Customer Info */}
          <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm">
              <span className="font-semibold text-slate-500">العميل:</span>{" "}
              <span className="font-bold text-slate-900">
                {order.customer_name}
              </span>
            </p>

            <p className="text-sm">
              <span className="font-semibold text-slate-500">الهاتف:</span>{" "}
              <span className="font-bold text-slate-900">{order.phone}</span>
            </p>

            <p className="text-sm">
              <span className="font-semibold text-slate-500">العنوان:</span>{" "}
              <span className="text-slate-700">{order.address}</span>
            </p>

            {order.latitude !== null && order.longitude !== null && (
              <a
                href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                onClick={(e) => e.stopPropagation()}
              >
                📍 فتح الموقع
              </a>
            )}

            {/* Payment */}
            <p className="text-sm">
              <span className="font-semibold text-slate-500">الدفع:</span>{" "}
              <span className="font-bold text-slate-700">
                {getPaymentMethodLabel(order.payment_method)}
              </span>
            </p>

            {/* Electronic Payment Details - Compact */}
            {isElectronicPayment && (
              <div className="mt-3 space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                {order.bank_account && (
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-black text-blue-700">
                      🏦 الحساب المحول إليه
                    </p>

                    <p className="mt-1 font-black text-blue-900">
                      {order.bank_account.bank_name}
                    </p>

                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      <p>
                        اسم الحساب:{" "}
                        <span className="font-bold">
                          {order.bank_account.account_name}
                        </span>
                      </p>

                      <p>
                        رقم الحساب:{" "}
                        <span dir="ltr" className="font-bold">
                          {order.bank_account.account_number}
                        </span>
                      </p>

                      <p>
                        نوع الحساب:{" "}
                        <span className="font-bold">
                          {order.bank_account.account_type === "instapay"
                            ? "InstaPay"
                            : order.bank_account.account_type}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {order.transfer_image && (
                  <div className="rounded-xl border border-blue-100 bg-white p-3">
                    <p className="mb-2 text-xs font-black text-blue-700">
                      🖼️ صورة التحويل
                    </p>

                    <a
                      href={order.transfer_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block"
                    >
                      <img
                        src={order.transfer_image}
                        alt="صورة التحويل"
                        className="h-32 w-full rounded-xl border border-blue-200 bg-white object-contain transition hover:opacity-90"
                      />
                    </a>

                    <p className="mt-2 text-center text-[11px] font-bold text-blue-600">
                      اضغط على الصورة لعرضها بالكامل
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Tracking & Timestamps Timeline */}
            {(order.delivery || order.assigned_at || order.picked_up_at || order.delivered_at) && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/70 to-slate-50 p-3.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-indigo-100/70 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900">
                    <span className="text-base">⏱️</span>
                    <span>تتبع مواعيد التوصيل</span>
                  </div>
                  {order.delivery && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        {order.delivery.name}
                      </span>
                      <a
                        href={`tel:${order.delivery.phone}`}
                        className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📞 اتصال
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                  {/* وقت التعيين */}
                  <div
                    className={`rounded-xl p-2 border transition ${
                      order.assigned_at
                        ? "bg-white border-indigo-200/80 shadow-xs"
                        : "bg-slate-100/70 border-slate-200/50 opacity-60"
                    }`}
                  >
                    <p className="text-[10px] font-extrabold text-indigo-600">👤 تم التعيين</p>
                    <p className="mt-1 text-xs font-black text-slate-800">
                      {order.assigned_at ? formatTimeOnly(order.assigned_at) : "لم يُعيَّن"}
                    </p>
                  </div>

                  {/* وقت الخروج للتوصيل */}
                  <div
                    className={`rounded-xl p-2 border transition ${
                      order.picked_up_at
                        ? "bg-blue-50/90 border-blue-200 shadow-xs"
                        : "bg-slate-100/70 border-slate-200/50 opacity-60"
                    }`}
                  >
                    <p className="text-[10px] font-extrabold text-blue-600">🚚 خرج للتوصيل</p>
                    <p className="mt-1 text-xs font-black text-blue-900">
                      {order.picked_up_at ? formatTimeOnly(order.picked_up_at) : "لم يخرج بعد"}
                    </p>
                  </div>

                  {/* وقت إتمام التوصيل */}
                  <div
                    className={`rounded-xl p-2 border transition ${
                      order.delivered_at
                        ? "bg-emerald-50/90 border-emerald-200 shadow-xs"
                        : "bg-slate-100/70 border-slate-200/50 opacity-60"
                    }`}
                  >
                    <p className="text-[10px] font-extrabold text-emerald-600">✅ تم التوصيل</p>
                    <p className="mt-1 text-xs font-black text-emerald-900">
                      {order.delivered_at ? formatTimeOnly(order.delivered_at) : "قيد الانتظار"}
                    </p>
                  </div>
                </div>

                {order.picked_up_at && order.delivered_at && (
                  <div className="mt-2.5 flex items-center justify-center gap-1 rounded-xl bg-emerald-100/70 px-3 py-1 text-center text-[11px] font-black text-emerald-800">
                    <span>⚡ مدة التوصيل الفعلية:</span>
                    <span>{calculateDuration(order.picked_up_at, order.delivered_at)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items Preview */}
          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-slate-700">المنتجات</p>

            <div className="space-y-2">
              {order.order_items?.slice(0, 2).map((item) => {
                const isWeight = item.sale_type === "weight"
                const amount = isWeight
                  ? Number(item.weight || item.quantity)
                  : Number(item.quantity)
                const itemTotal = Number(item.price) * amount

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm last:border-0"
                  >
                    <span className="text-slate-700">
                      {item.product_name}{" "}
                      <span className="font-bold">
                        × {amount} {isWeight ? "كجم" : ""}
                      </span>
                    </span>

                    <span className="font-semibold text-slate-900">
                      {itemTotal.toLocaleString("ar-EG")} ج.م
                    </span>
                  </div>
                )
              })}

              {order.order_items && order.order_items.length > 2 && (
                <p className="pt-1 text-xs text-slate-400">
                  + {order.order_items.length - 2} منتجات أخرى
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm">
              <span className="font-bold text-indigo-700">ملاحظات:</span>{" "}
              <span className="text-indigo-900">{order.notes}</span>
            </div>
          )}

          {/* Actions */}
          {showActions && (onViewDetails || onConfirm) && (
            <div className="mt-5 flex gap-3">
              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => onViewDetails(order)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  عرض التفاصيل
                </button>
              )}

              {onConfirm && (order.status === "pending" || order.status === "pending_approval") && (
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={() => onConfirm(order.id)}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isConfirming ? "جاري التأكيد..." : "✓ تأكيد الطلب"}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  // =============================================
  // FULL VERSION
  // =============================================

  return (
    <Card className={className}>
      {/* Order Header */}
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-black text-slate-950">
                طلب #{order.id}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${getStatusClass(
                  order.status
                )}`}
              >
                {getStatusEmoji(order.status)} {getStatusLabel(order.status)}
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-400">
              {formatDate(order.created_at)}
            </p>
          </div>

          <div className="text-left">
            <p className="text-xs font-bold text-slate-400">الإجمالي</p>

            <p className="mt-1 text-xl font-black text-indigo-700">
              {Number(order.total).toLocaleString("ar-EG")}
              <span className="mr-1 text-xs text-slate-500">ج.م</span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-400">العميل</p>

            <p className="mt-1 font-black text-slate-800">
              {order.customer_name}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-400">الهاتف</p>

            <a
              href={`tel:${order.phone}`}
              className="mt-1 block font-black text-indigo-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {order.phone}
            </a>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-2xl border border-slate-100 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
              📍
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-400">
                عنوان العميل
              </p>

              <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                {order.address || "لم يتم تحديد عنوان"}
              </p>
            </div>

            {order.latitude !== null && order.longitude !== null && (
              <button
                type="button"
                onClick={openGoogleMaps}
                className="shrink-0 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-600 transition hover:bg-indigo-100"
              >
                الخريطة
              </button>
            )}
          </div>
        </div>

        {/* Payment & Items Count */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-400">طريقة الدفع</p>

            <p className="mt-1 font-black text-slate-800">
              {getPaymentMethodLabel(order.payment_method)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-400">
              عدد المنتجات
            </p>

            <p className="mt-1 font-black text-slate-800">{totalItems}</p>
          </div>
        </div>

        {/* =============================================
            Transfer Image - Full Version (Smaller)
        ============================================= */}

        {isElectronicPayment && (
          <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            {/* Bank Account */}
            {order.bank_account && (
              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">🏦</span>

                  <div>
                    <p className="text-[11px] font-bold text-blue-500">
                      الحساب المحول إليه
                    </p>

                    <p className="text-base font-black text-blue-900">
                      {order.bank_account.bank_name}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold text-slate-400">
                      اسم الحساب
                    </p>

                    <p className="mt-1 font-black text-slate-800">
                      {order.bank_account.account_name}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold text-slate-400">
                      رقم الحساب
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 text-right font-black text-slate-800"
                    >
                      {order.bank_account.account_number}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                    <p className="text-[11px] font-bold text-slate-400">
                      نوع الحساب
                    </p>

                    <p className="mt-1 font-black text-slate-800">
                      {order.bank_account.account_type === "instapay"
                        ? "InstaPay"
                        : order.bank_account.account_type}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Image */}
            {order.transfer_image && (
              <div className="rounded-2xl border border-blue-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black text-blue-600">
                      💳 الدفع الإلكتروني
                    </p>

                    <p className="mt-1 text-base font-black text-blue-900">
                      صورة التحويل
                    </p>
                  </div>

                  <a
                    href={order.transfer_image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    فتح الصورة
                  </a>
                </div>

                <a
                  href={order.transfer_image}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={order.transfer_image}
                    alt="صورة التحويل"
                    className="max-h-48 w-full rounded-2xl border border-blue-200 bg-white object-contain transition hover:opacity-90"
                  />
                </a>

                <p className="mt-2 text-center text-xs font-bold text-blue-600">
                  اضغط على الصورة لعرضها بالحجم الكامل
                </p>
              </div>
            )}
          </div>
        )}

        {/* Delivery */}
        {order.delivery && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-[11px] font-black text-emerald-600">
              🚚 الدليفري المسؤول
            </p>

            <div className="mt-1 flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-emerald-900">
                  {order.delivery.name}
                </p>

                <a
                  href={`tel:${order.delivery.phone}`}
                  className="text-sm font-bold text-emerald-700 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  📞 {order.delivery.phone}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <p className="mb-3 text-sm font-black text-slate-800">المنتجات</p>

          <div className="space-y-2">
            {order.order_items?.slice(0, 3).map((item) => {
              const isWeight = item.sale_type === "weight"
              const amount = isWeight
                ? Number(item.weight || item.quantity)
                : Number(item.quantity)
              const itemTotal = Number(item.price) * amount

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-700">
                      {item.product_name}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {isWeight ? `${amount} كجم` : amount} ×{" "}
                      {Number(item.price).toLocaleString("ar-EG")} ج.م
                    </p>
                  </div>

                  <p className="mr-3 shrink-0 text-sm font-black text-slate-800">
                    {itemTotal.toLocaleString("ar-EG")} ج.م
                  </p>
                </div>
              )
            })}

            {order.order_items && order.order_items.length > 3 && (
              <p className="pt-1 text-center text-xs font-bold text-slate-400">
                + {order.order_items.length - 3} منتجات أخرى
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-[11px] font-black text-amber-700">
              ملاحظات العميل
            </p>

            <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
              {order.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (onViewDetails || onConfirm) && (
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(order)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                عرض التفاصيل
              </button>
            )}

            {onConfirm && (order.status === "pending" || order.status === "pending_approval") && (
              <button
                type="button"
                disabled={isConfirming || isCancelling}
                onClick={() => onConfirm(order.id)}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConfirming ? "جاري التأكيد..." : "✓ تأكيد الطلب"}
              </button>
            )}

            {onCancel && ((order.status === "pending" || order.status === "pending_approval") || order.status === "delivered") && (
              <button
                type="button"
                disabled={isConfirming || isCancelling}
                onClick={() => onCancel(order.id)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCancelling
                  ? "جاري الحذف..."
                  : order.status === "delivered"
                  ? "🗑 حذف الطلب"
                  : "✕ إلغاء الطلب"}
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default OrderCard