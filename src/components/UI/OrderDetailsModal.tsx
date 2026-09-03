import Modal from "./Modal";

interface OrderItem {
  id: number;
  product_name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  notes: string;
  payment_method: string;
  total: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
  order_items?: OrderItem[];
  created_at?: string;
}

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  onConfirm?: (orderId: number) => void | Promise<void>
  onCancel?: (orderId: number) => void | Promise<void>
  confirming?: boolean
  cancelling?: boolean
}

const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onConfirm,
  onCancel,
  confirming = false,
  cancelling = false,
}: OrderDetailsModalProps) => {
  if (!order) return null;

  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    pending: "🟡 جديد",
    confirmed: "🟢 مؤكد",
    cancelled: "🔴 ملغي",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`طلب #${order.id}`}
      subtitle="تفاصيل الطلب"
      icon={<span>📋</span>}
      size="lg"
      actions={
        order.status === "pending" && onConfirm ? (
          <button
            type="button"
            disabled={confirming}
            onClick={() => onConfirm(order.id)}
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirming ? "جاري التأكيد..." : "✓ تأكيد الطلب"}
          </button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-black ${
              statusColors[order.status as keyof typeof statusColors] ||
              "bg-slate-100 text-slate-700"
            }`}
          >
            {statusLabels[order.status as keyof typeof statusLabels] ||
              order.status}
          </span>
          {order.created_at && (
            <span className="text-xs text-slate-400">
              {new Date(order.created_at).toLocaleString("ar-EG")}
            </span>
          )}
        </div>

        {/* Customer Info */}
        <div className="rounded-2xl bg-slate-50 p-5">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-bold text-slate-500">العميل</span>
              <span className="font-bold text-slate-900">
                {order.customer_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500">الهاتف</span>
              <span className="font-bold text-slate-900">{order.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-500">طريقة الدفع</span>
              <span className="font-bold text-slate-900">
                {order.payment_method}
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex justify-between">
              <span className="font-bold text-slate-500">العنوان</span>
              <span className="text-slate-900">{order.address}</span>
            </div>
          </div>

          {order.latitude && order.longitude && (
            <a
              href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500"
            >
              📍 عرض الموقع على الخريطة
            </a>
          )}
        </div>

        {/* Order Items */}
        <div>
          <h3 className="mb-4 font-bold text-slate-700">المنتجات</h3>
          <div className="space-y-3">
            {order.order_items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    × {item.quantity} وحدة
                  </p>
                </div>
                <span className="font-bold text-indigo-600">
                  {item.price * item.quantity} ج.م
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-lg font-bold text-slate-500">الإجمالي</span>
          <span className="text-3xl font-black text-indigo-600">
            {order.total} ج.م
          </span>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-2xl bg-indigo-50 p-5">
            <p className="font-bold text-indigo-700">ملاحظات</p>
            <p className="mt-1 text-sm text-indigo-900">{order.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OrderDetailsModal;