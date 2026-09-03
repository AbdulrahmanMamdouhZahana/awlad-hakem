import Card from "./Card";

export interface Delivery {
  id: number
  name: string
  phone: string
  email?: string
  role?: string
  is_active?: boolean
}


export interface OrderItem {
  id: number
  order_id?: number
  product_id?: number
  product_name: string
  price: number
  quantity: number
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
  latitude: number | null
  longitude: number | null
  created_at?: string
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
  order: Order;
  onViewDetails?: (order: Order) => void;
  onConfirm?: (orderId: number) => void;
  onCancel?: (orderId: number) => void;
  isConfirming?: boolean;
  isCancelling?: boolean;
  showActions?: boolean;
  className?: string;
  compact?: boolean;
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
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "مؤكد";
      case "pending":
        return compact ? "جديد" : "قيد الانتظار";
      case "cancelled":
        return "ملغي";
      case "delivered":
        return "تم التوصيل";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return compact 
          ? "bg-emerald-100 text-emerald-700"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200";
      case "cancelled":
        return compact
          ? "bg-red-100 text-red-700"
          : "bg-red-50 text-red-700 ring-red-200";
      case "delivered":
        return compact
          ? "bg-blue-100 text-blue-700"
          : "bg-blue-50 text-blue-700 ring-blue-200";
      default:
        return compact
          ? "bg-amber-100 text-amber-700"
          : "bg-amber-50 text-amber-700 ring-amber-200";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "confirmed":
        return "🟢";
      case "pending":
        return "🟡";
      case "cancelled":
        return "🔴";
      case "delivered":
        return "🔵";
      default:
        return "⚪";
    }
  };

  const openGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.latitude === null || order.longitude === null) {
      return;
    }
    const url = `https://www.google.com/maps?q=${order.latitude},${order.longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const totalItems = order.order_items?.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  ) || 0;

  // =============================================
  // COMPACT VERSION (for Dashboard)
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
              {order.total} ج.م
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
            {order.latitude && order.longitude && (
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
            <p className="text-sm">
              <span className="font-semibold text-slate-500">الدفع:</span>{" "}
              <span className="text-slate-700">{order.payment_method}</span>
            </p>

            {order.delivery && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                <p className="text-xs font-bold text-emerald-600">
                  🚚 الدليفري المسؤول
                </p>
                <p className="mt-1 font-black text-emerald-900">
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
            )}
          </div>

          {/* Items Preview */}
          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-slate-700">المنتجات</p>
            <div className="space-y-2">
              {order.order_items?.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm last:border-0"
                >
                  <span className="text-slate-700">
                    {item.product_name}{" "}
                    <span className="font-bold">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-slate-900">
                    {item.price * item.quantity} ج.م
                  </span>
                </div>
              ))}
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
              {onConfirm && order.status === "pending" && (
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={() => onConfirm(order.id)}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isConfirming ? "جاري التأكيد..." : "✓ تأكيد"}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // =============================================
  // FULL VERSION (for Orders Page)
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
              {order.payment_method || "غير محدد"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-400">
              عدد المنتجات
            </p>
            <p className="mt-1 font-black text-slate-800">{totalItems}</p>
          </div>
        </div>

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

        {/* Items Preview */}
        <div>
          <p className="mb-3 text-sm font-black text-slate-800">المنتجات</p>
          <div className="space-y-2">
            {order.order_items?.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-700">
                    {item.product_name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {item.quantity} ×{" "}
                    {Number(item.price).toLocaleString("ar-EG")} ج.م
                  </p>
                </div>
                <p className="mr-3 shrink-0 text-sm font-black text-slate-800">
                  {(Number(item.price) * Number(item.quantity)).toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </p>
              </div>
            ))}
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
            {onConfirm && order.status === "pending" && (
              <button
                type="button"
                disabled={isConfirming || isCancelling}
                onClick={() => onConfirm(order.id)}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConfirming ? "جاري التأكيد..." : "✓ تأكيد الطلب"}
              </button>
            )}
            {onCancel && (order.status === "pending" || order.status === "delivered") && (
              <button
                type="button"
                disabled={isConfirming || isCancelling}
                onClick={() => onCancel(order.id)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCancelling ? "جاري الحذف..." : order.status === "delivered" ? "🗑 حذف الطلب" : "✕ إلغاء الطلب"}
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrderCard;