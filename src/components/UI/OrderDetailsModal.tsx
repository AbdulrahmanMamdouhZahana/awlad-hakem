import { useState, useEffect } from "react";
import Modal from "./Modal";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/api";

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
  subtotal?: number | null;
  tax?: number | null;
  delivery_fee?: number | null;
  delivery_status?: "pending" | "calculated" | string | null;
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
  onOrderUpdated?: (order: Order) => void;
  confirming?: boolean;
  cancelling?: boolean;
}

const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onConfirm,
  onCancel,
  onOrderUpdated,
  confirming = false,
  cancelling = false,
}: OrderDetailsModalProps) => {
  const [localOrder, setLocalOrder] = useState<Order | null>(order);
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>("");
  const [isEditingFee, setIsEditingFee] = useState<boolean>(false);
  const [savingFee, setSavingFee] = useState<boolean>(false);

  useEffect(() => {
    setLocalOrder(order);
    if (order?.delivery_fee != null) {
      setDeliveryFeeInput(order.delivery_fee.toString());
      setIsEditingFee(false);
    } else {
      setDeliveryFeeInput("");
      setIsEditingFee(true);
    }
  }, [order]);

  if (!order) return null;
  const activeOrder = localOrder || order;

  const normalizedStatus =
    activeOrder.status === "pending_approval" ? "pending" : activeOrder.status;

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
    activeOrder.payment_method === "الدفع إلكتروني" ||
    Boolean(activeOrder.transfer_image);

  const handleSaveDeliveryFee = async () => {
    if (!activeOrder) return;

    const feeNum = Number(deliveryFeeInput);
    if (deliveryFeeInput === "" || isNaN(feeNum) || feeNum < 0) {
      toast.error("يرجى إدخال مصاريف توصيل صحيحة (أكبر من أو تساوي 0)");
      return;
    }

    try {
      setSavingFee(true);
      const res = await apiFetch(`/orders/${activeOrder.id}/delivery-fee`, {
        method: "PATCH",
        body: JSON.stringify({
          delivery_fee: feeNum,
        }),
      });

      if (res?.success && res.order) {
        toast.success("تم تحديد مصاريف التوصيل وتحديث إجمالي الطلب بنجاح 🚚");
        setLocalOrder(res.order);
        setIsEditingFee(false);
        if (onOrderUpdated) {
          onOrderUpdated(res.order);
        }
      } else {
        toast.success("تم حفظ مصاريف التوصيل");
      }
    } catch (err: any) {
      console.error("Error setting delivery fee:", err);
      toast.error(err?.message || "فشل تحديث مصاريف التوصيل");
    } finally {
      setSavingFee(false);
    }
  };

  const subtotal =
    activeOrder.subtotal !== null && activeOrder.subtotal !== undefined
      ? Number(activeOrder.subtotal)
      : Number(activeOrder.total);
  const tax = Number(activeOrder.tax || 0);
  const deliveryFee =
    activeOrder.delivery_fee != null ? Number(activeOrder.delivery_fee) : null;
  const isDeliveryCalculated =
    activeOrder.delivery_status === "calculated" && deliveryFee !== null;
  const totalBeforeDelivery = subtotal + tax;
  const finalTotal = isDeliveryCalculated
    ? totalBeforeDelivery + deliveryFee
    : totalBeforeDelivery;

  const formatDate = (date?: string | null) => {
    if (!date) return "غير متوفر";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "غير متوفر";

    return parsed.toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

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

        {/* Financial Breakdown (Subtotal, Tax, Delivery Fee, Total) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-black text-slate-800">
            💵 تفاصيل الحساب والإجمالي
          </h3>

          <div className="space-y-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-sm">
              <span className="font-bold text-slate-600">المجموع الفرعي (المنتجات):</span>
              <span className="font-black text-slate-900">{formatMoney(subtotal)} ج.م</span>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-sm">
              <span className="font-bold text-slate-600">ضريبة القيمة المضافة (Tax):</span>
              <span className="font-black text-slate-900">{formatMoney(tax)} ج.م</span>
            </div>

            {/* Total Before Delivery */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-sm">
              <span className="font-bold text-slate-600">المجموع قبل مصاريف التوصيل:</span>
              <span className="font-black text-indigo-700">{formatMoney(totalBeforeDelivery)} ج.م</span>
            </div>

            {/* Delivery Fee & Status Section */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚚</span>
                  <span className="text-sm font-black text-slate-800">مصاريف التوصيل (Delivery Fee)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      isDeliveryCalculated
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isDeliveryCalculated ? "✓ تم التحديد (Calculated)" : "⏳ قيد التحديد (Pending)"}
                  </span>
                  {isDeliveryCalculated && !isEditingFee && (
                    <button
                      type="button"
                      onClick={() => setIsEditingFee(true)}
                      className="rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
                    >
                      تعديل
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery Fee Input Form */}
              {isEditingFee || !isDeliveryCalculated ? (
                <div className="mt-3.5 space-y-3">
                  <p className="text-xs font-bold text-slate-500">
                    أدخل مصاريف التوصيل يدويًا بناءً على موقع العميل والمسافة:
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={deliveryFeeInput}
                        onChange={(e) => setDeliveryFeeInput(e.target.value)}
                        placeholder="مثال: 50.00"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-900 outline-none transition focus:border-indigo-500"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        ج.م
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={savingFee}
                      onClick={handleSaveDeliveryFee}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingFee ? "جاري الحفظ..." : "تأكيد مصاريف التوصيل"}
                    </button>

                    {isDeliveryCalculated && isEditingFee && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingFee(false);
                          setDeliveryFeeInput(activeOrder.delivery_fee?.toString() || "");
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">القيمة المحددة للتوصيل:</span>
                  <span className="text-base font-black text-emerald-700">
                    {formatMoney(deliveryFee ?? 0)} ج.م
                  </span>
                </div>
              )}
            </div>

            {/* GPS Reference */}
            {activeOrder.latitude !== null && activeOrder.longitude !== null && (
              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span className="font-bold text-indigo-900">
                    موقع العميل: {activeOrder.latitude?.toFixed(5)}, {activeOrder.longitude?.toFixed(5)}
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${activeOrder.latitude},${activeOrder.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 font-bold text-white transition hover:bg-indigo-700"
                >
                  فتح في خرائط جوجل ↗
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Final Total Banner */}
        <section className={`rounded-3xl p-6 text-white shadow-xl transition-all ${
          isDeliveryCalculated
            ? "bg-gradient-to-r from-emerald-600 to-teal-700 shadow-emerald-600/20"
            : "bg-gradient-to-r from-indigo-600 to-slate-800 shadow-indigo-600/20"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-lg font-black">
                {isDeliveryCalculated ? "الإجمالي النهائي (شامل التوصيل)" : "إجمالي الطلب (قبل مصاريف التوصيل)"}
              </span>
              <p className="mt-0.5 text-xs text-white/80">
                {isDeliveryCalculated
                  ? `مجموع المنتجات (${formatMoney(subtotal)}) + الضريبة (${formatMoney(tax)}) + التوصيل (${formatMoney(deliveryFee ?? 0)})`
                  : "سيتم تحديث الإجمالي النهائي بعد تأكيد مصاريف التوصيل أعلاه"}
              </p>
            </div>
            <span className="text-3xl font-black">
              {formatMoney(finalTotal)} ج.م
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

        {/* Timeline & Delivery Tracking */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="flex items-center gap-2 text-base font-black text-slate-800">
              <span>⏱️</span>
              <span>مسار تتبع الطلب ومواعيد التوصيل الدقيقة</span>
            </h3>

            {order.picked_up_at && order.delivered_at && (
              <span className="rounded-xl bg-emerald-100/80 px-3 py-1 text-xs font-black text-emerald-800">
                ⚡ مدة رحلة التوصيل: {calculateDuration(order.picked_up_at, order.delivered_at)}
              </span>
            )}
          </div>

          <div className="relative space-y-4 pr-1 before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* 1. وقت إنشاء الطلب */}
            <div className="relative flex items-start gap-4">
              <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white shadow ring-4 ring-white">
                1
              </div>
              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-800">📦 إنشاء الطلب</p>
                  <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                    {formatDate(order.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. وقت إسناد الطلب وتأكيده للدليفري */}
            <div className="relative flex items-start gap-4">
              <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow ring-4 ring-white ${
                order.assigned_at ? "bg-indigo-600" : "bg-slate-300"
              }`}>
                2
              </div>
              <div className={`flex-1 rounded-2xl border p-3.5 transition ${
                order.assigned_at
                  ? "border-indigo-200 bg-indigo-50/50"
                  : "border-slate-200 bg-slate-50/40 opacity-70"
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-indigo-900">
                      👤 تعيين الدليفري
                    </p>
                    {order.delivery && (
                      <p className="mt-0.5 text-xs font-bold text-indigo-700">
                        المندوب: {order.delivery.name} ({order.delivery.phone})
                      </p>
                    )}
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                    order.assigned_at
                      ? "border-indigo-200 bg-white text-indigo-800"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}>
                    {order.assigned_at ? formatDate(order.assigned_at) : "لم يتم التعيين بعد"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. وقت خروج الدليفري للتوصيل */}
            <div className="relative flex items-start gap-4">
              <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow ring-4 ring-white ${
                order.picked_up_at ? "bg-blue-600" : "bg-slate-300"
              }`}>
                3
              </div>
              <div className={`flex-1 rounded-2xl border p-3.5 transition ${
                order.picked_up_at
                  ? "border-blue-200 bg-blue-50/50"
                  : "border-slate-200 bg-slate-50/40 opacity-70"
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-blue-900">
                      🚚 خروج الدليفري للتوصيل
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-blue-700">
                      {order.picked_up_at ? "المندوب استلم الطلب وهو في الطريق الآن للعميل" : "في انتظار بدء التحرك والتوصيل"}
                    </p>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                    order.picked_up_at
                      ? "border-blue-200 bg-white text-blue-800"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}>
                    {order.picked_up_at ? formatDate(order.picked_up_at) : "لم يخرج بعد"}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. وقت وصول وتسليم الأوردر */}
            <div className="relative flex items-start gap-4">
              <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow ring-4 ring-white ${
                order.delivered_at ? "bg-emerald-600" : "bg-slate-300"
              }`}>
                4
              </div>
              <div className={`flex-1 rounded-2xl border p-3.5 transition ${
                order.delivered_at
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50/40 opacity-70"
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-emerald-900">
                      ✅ وصول وتسليم الطلب للعميل
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                      {order.delivered_at ? "تم استلام العميل للطلب بنجاح" : "الطلب قيد الانتظار / التوصيل"}
                    </p>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                    order.delivered_at
                      ? "border-emerald-200 bg-white text-emerald-800"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}>
                    {order.delivered_at ? formatDate(order.delivered_at) : "قيد الانتظار"}
                  </span>
                </div>
              </div>
            </div>
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
