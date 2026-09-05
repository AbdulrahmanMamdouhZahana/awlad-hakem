import Modal from "./Modal";

interface OrderItem {
  id: number;
  order_id?: number;
  product_id?: number;
  product_name: string;
  price: number;
  quantity: number;
  sale_type?: "piece" | "weight" | "both" | string;
  weight?: number | null;
}

interface BankAccount {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: string;
  is_active: boolean;
}

interface Delivery {
  id: number;
  name: string;
  email?: string;
  phone: string;
  role?: string;
  is_active?: boolean;
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
  updated_at?: string;
  assigned_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;

  delivery_id?: number | null;
  delivery?: Delivery | null;

  bank_account_id?: number | null;
  bank_account?: BankAccount | null;

  transfer_image?: string | null;
  delivery_proof_image?: string | null;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirm?: (orderId: number) => void | Promise<void>;
  onCancel?: (orderId: number) => void | Promise<void>;
  confirming?: boolean;
  cancelling?: boolean;
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

  const normalizedStatus =
    order.status === "pending_approval" ? "pending" : order.status;

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    assigned: "bg-indigo-100 text-indigo-700",
    out_for_delivery: "bg-violet-100 text-violet-700",
    cancelled: "bg-red-100 text-red-700",
    delivered: "bg-blue-100 text-blue-700",
  };

  const statusLabels: Record<string, string> = {
    pending: "🟡 قيد الانتظار",
    confirmed: "🟢 مؤكد",
    assigned: "🚚 تم التعيين",
    out_for_delivery: "🚚 قيد التوصيل",
    cancelled: "🔴 ملغي",
    delivered: "🔵 تم التوصيل",
  };

  const isElectronicPayment =
    order.payment_method === "الدفع إلكتروني" ||
    Boolean(order.transfer_image);

  const formatDate = (date?: string | null) => {
    if (!date) return "غير متوفر";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "غير متوفر";

    return parsed.toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatMoney = (value: number) =>
    Number(value || 0).toLocaleString("ar-EG");

  const mapsUrl =
    order.latitude !== null && order.longitude !== null
      ? `https://www.google.com/maps?q=${order.latitude},${order.longitude}`
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`طلب #${order.id}`}
      subtitle="كل تفاصيل الطلب"
      icon={<span>📋</span>}
      size="lg"
      actions={
        normalizedStatus === "pending" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {onCancel && (
              <button
                type="button"
                disabled={cancelling || confirming}
                onClick={() => onCancel(order.id)}
                className="flex-1 rounded-xl bg-red-600 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? "جاري الإلغاء..." : "✕ إلغاء الطلب"}
              </button>
            )}

            {onConfirm && (
              <button
                type="button"
                disabled={confirming || cancelling}
                onClick={() => onConfirm(order.id)}
                className="flex-1 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirming ? "جاري التأكيد..." : "✓ تأكيد الطلب"}
              </button>
            )}
          </div>
        ) : normalizedStatus === "delivered" && onCancel ? (
          <button
            type="button"
            disabled={cancelling}
            onClick={() => onCancel(order.id)}
            className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelling ? "جاري الحذف..." : "🗑 حذف الطلب"}
          </button>
        ) : undefined
      }
    >
      <div className="space-y-5" dir="rtl">
        {/* Status + Order ID */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">رقم الطلب</p>
            <p className="mt-1 text-xl font-black text-slate-900">
              #{order.id}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-xs font-black ${
              statusColors[normalizedStatus] ||
              "bg-slate-100 text-slate-700"
            }`}
          >
            {statusLabels[normalizedStatus] || order.status}
          </span>
        </div>

        {(normalizedStatus === "confirmed" ||
          normalizedStatus === "assigned" ||
          normalizedStatus === "out_for_delivery") && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-center">
            <p className="text-sm font-black text-indigo-800">
              🚚 الطلب قيد التوصيل
            </p>
            <p className="mt-1 text-xs font-semibold text-indigo-600">
              تم تأكيد الطلب وتعيين الدليفري
            </p>
          </div>
        )}

        {normalizedStatus === "cancelled" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-center">
            <p className="text-sm font-black text-red-800">
              🔴 هذا الطلب ملغي
            </p>
          </div>
        )}

        {/* Customer Info */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="mb-4 text-base font-black text-slate-800">
            👤 بيانات العميل
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="اسم العميل" value={order.customer_name} />
            <Info label="رقم الهاتف" value={order.phone} />
            <Info
              label="العنوان"
              value={order.address}
              className="sm:col-span-2"
            />
          </div>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-500"
            >
              📍 عرض موقع العميل على الخريطة
            </a>
          )}

          {(order.latitude !== null || order.longitude !== null) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Info
                label="Latitude"
                value={
                  order.latitude !== null
                    ? String(order.latitude)
                    : "غير متوفر"
                }
              />
              <Info
                label="Longitude"
                value={
                  order.longitude !== null
                    ? String(order.longitude)
                    : "غير متوفر"
                }
              />
            </div>
          )}
        </section>

        {/* Payment */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-black text-slate-800">
            💳 بيانات الدفع
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="طريقة الدفع" value={order.payment_method} />
            <Info
              label="نوع الدفع"
              value={isElectronicPayment ? "دفع إلكتروني" : "دفع عند الاستلام"}
            />
          </div>

          {isElectronicPayment && order.bank_account && (
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <h4 className="mb-3 font-black text-indigo-800">
                🏦 الحساب الذي تم التحويل إليه
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <Info
                  label="البنك"
                  value={order.bank_account.bank_name}
                />
                <Info
                  label="اسم صاحب الحساب"
                  value={order.bank_account.account_name}
                />
                <Info
                  label="رقم الحساب"
                  value={order.bank_account.account_number}
                />
                <Info
                  label="نوع الحساب"
                  value={order.bank_account.account_type}
                />
              </div>
            </div>
          )}

          {isElectronicPayment && order.transfer_image && (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <h4 className="mb-3 font-black text-emerald-800">
                🧾 صورة التحويل
              </h4>

              <a
                href={order.transfer_image}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <img
                  src={order.transfer_image}
                  alt="صورة تحويل الطلب"
                  className="max-h-[420px] w-full object-contain"
                />
              </a>

              <p className="mt-2 text-center text-xs font-bold text-slate-400">
                اضغط على الصورة لفتحها بالحجم الكامل
              </p>
            </div>
          )}
        </section>

        {/* Products */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800">
              🛒 المنتجات
            </h3>

            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
              {order.order_items?.length || 0} منتج
            </span>
          </div>

          <div className="space-y-3">
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((item) => {
                const isWeight = item.sale_type === "weight";
                const amount = isWeight
                  ? Number(item.weight ?? item.quantity)
                  : Number(item.quantity);
                const itemTotal = Number(item.price) * amount;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900">
                          {item.product_name}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
                          {isWeight ? (
                            <>
                              <span>بالكيلو • الوزن: {amount} كجم</span>
                              <span>
                                سعر الكيلو: {formatMoney(item.price)} ج.م
                              </span>
                            </>
                          ) : (
                            <>
                              <span>الكمية: {amount}</span>
                              <span>
                                سعر الوحدة: {formatMoney(item.price)} ج.م
                              </span>
                            </>
                          )}

                          {item.product_id !== undefined && (
                            <span>رقم المنتج: #{item.product_id}</span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 rounded-xl bg-white px-4 py-2 text-left shadow-sm">
                        <p className="text-[11px] font-bold text-slate-400">
                          الإجمالي
                        </p>
                        <p className="font-black text-indigo-600">
                          {formatMoney(itemTotal)} ج.م
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">
                لا توجد منتجات مسجلة لهذا الطلب
              </div>
            )}
          </div>
        </section>

        {/* Total */}
        <section className="rounded-2xl bg-indigo-600 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black">إجمالي الطلب</span>
            <span className="text-3xl font-black">
              {formatMoney(order.total)} ج.م
            </span>
          </div>
        </section>

        {/* Notes */}
        {order.notes && (
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <h3 className="font-black text-indigo-700">📝 ملاحظات العميل</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-7 text-indigo-950">
              {order.notes}
            </p>
          </section>
        )}

        {/* Delivery */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-black text-slate-800">
            🚚 بيانات التوصيل
          </h3>

          {order.delivery ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="الدليفري" value={order.delivery.name} />
              <Info label="رقم الدليفري" value={order.delivery.phone} />
              {order.delivery.email && (
                <Info label="إيميل الدليفري" value={order.delivery.email} />
              )}
              {order.delivery.role && (
                <Info label="الصلاحية" value={order.delivery.role} />
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-400">
              لم يتم تعيين دليفري لهذا الطلب
            </div>
          )}
        </section>

        {/* Dates */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-black text-slate-800">
            🕐 التواريخ
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="تاريخ إنشاء الطلب" value={formatDate(order.created_at)} />
            <Info label="آخر تحديث" value={formatDate(order.updated_at)} />
            <Info label="تم تعيين الدليفري" value={formatDate(order.assigned_at)} />
            <Info label="تم استلام الطلب" value={formatDate(order.picked_up_at)} />
            <Info label="تم التوصيل" value={formatDate(order.delivered_at)} />
          </div>
        </section>

        {/* Delivery Proof */}
        {order.delivery_proof_image && (
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="mb-3 font-black text-blue-800">
              🧾 إثبات التوصيل
            </h3>

            <a
              href={order.delivery_proof_image}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <img
                src={order.delivery_proof_image}
                alt="إثبات توصيل الطلب"
                className="max-h-[420px] w-full object-contain"
              />
            </a>
          </section>
        )}
      </div>
    </Modal>
  );
};

interface InfoProps {
  label: string;
  value: string;
  className?: string;
}

const Info = ({ label, value, className = "" }: InfoProps) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white px-4 py-3 ${className}`}
  >
    <p className="text-[11px] font-bold text-slate-400">{label}</p>
    <p className="mt-1 break-words text-sm font-black text-slate-800">
      {value || "-"}
    </p>
  </div>
);

export default OrderDetailsModal;
