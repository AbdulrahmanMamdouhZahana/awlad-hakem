import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; 
import type  { CartItem } from "../App"; 

const API_URL =
  import.meta.env.VITE_API_URL 

interface OrderItem {
  id: number | string;
  product_id?: number | string;
  product_name?: string;
  name?: string;
  price?: number | string;
  quantity?: number;
}

interface Order {
  id: number | string;
  status?: string;
  total?: number | string;
  payment_method?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  order_items?: OrderItem[];
  items?: OrderItem[];
}

type Filter = "all" | "pending" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";

const statusConfig: Record<
  string,
  { label: string; className: string; icon: string }
> = {
  pending: {
    label: "في انتظار التأكيد",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "⏳",
  },
  confirmed: {
    label: "تم تأكيد الطلب",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "✓",
  },
  assigned: {
    label: "تم تعيين الدليفري",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "🚚",
  },
  out_for_delivery: {
    label: "قيد التوصيل",
    className: "bg-violet-50 text-violet-700 border-violet-200",
    icon: "🚚",
  },
  delivered: {
    label: "تم التوصيل",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "✓",
  },
  cancelled: {
    label: "ملغي",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: "✕",
  },
};

const normalizeStatus = (status?: string) =>
  String(status || "pending").trim().toLowerCase();

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getItems = (order: Order): OrderItem[] =>
  Array.isArray(order.order_items)
    ? order.order_items
    : Array.isArray(order.items)
      ? order.items
      : [];

const getTotal = (order: Order) => Number(order.total || 0);

// Props for the component
interface CustomerOrdersProps {
  cart?: CartItem[];
  cartCount?: number;
  onAddToCart?: (product: any, options?: any) => void;
  onIncrease?: (productId: number) => void;
  onDecrease?: (productId: number) => void;
  onRemove?: (productId: number) => void;
  onCheckout?: () => void;
  products?: any[];
}

export default function CustomerOrders({
  cart = [],
  cartCount = 0,
  onAddToCart = () => {},
  onIncrease = () => {},
  onDecrease = () => {},
  onRemove = () => {},
  onCheckout = () => {},
  products = [],
}: CustomerOrdersProps) {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    const token = localStorage.getItem("customer_token");

    if (!token) {
      navigate("/customer/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/customer/orders`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_user");
        window.dispatchEvent(new Event("customer-auth-changed"));
        navigate("/customer/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "حدث خطأ أثناء تحميل الطلبات"
        );
      }

      const result = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setOrders(result);
    } catch (err) {
      console.error("CUSTOMER ORDERS ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل الطلبات"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;

    return orders.filter(
      (order) => normalizeStatus(order.status) === filter
    );
  }, [orders, filter]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(
        (o) => normalizeStatus(o.status) === "pending"
      ).length,
      confirmed: orders.filter((o) =>
        ["confirmed", "assigned"].includes(normalizeStatus(o.status))
      ).length,
      out_for_delivery: orders.filter(
        (o) => normalizeStatus(o.status) === "out_for_delivery"
      ).length,
      delivered: orders.filter(
        (o) => normalizeStatus(o.status) === "delivered"
      ).length,
      cancelled: orders.filter(
        (o) => normalizeStatus(o.status) === "cancelled"
      ).length,
    };
  }, [orders]);

  // Handle checkout from navbar
  const handleCheckout = () => {
    if (cart.length === 0) {
      // toast.error("السلة فارغة");
      return;
    }

    const token = localStorage.getItem("customer_token");

    if (!token) {
      // Show login popup or redirect
      navigate("/customer/login");
      return;
    }

    onCheckout();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ===== NAVIGATION BAR ===== */}
      <Navbar
        cartCount={cartCount}
        cart={cart}
        products={products}
        onAddToCart={onAddToCart}
        onIncrease={onIncrease}
        onDecrease={onDecrease}
        onRemove={onRemove}
        onCheckout={handleCheckout}
      />

      {/* ===== PAGE HEADER ===== */}
      <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#17656b] hover:underline"
              >
                <span>←</span> العودة للمتجر
              </Link>

              <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                📋 طلباتي
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                تابع حالة طلباتك وتفاصيل كل طلب
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1 rounded-full bg-[#17656b]/10 px-4 py-2 text-sm font-bold text-[#17656b] sm:flex">
                <span className="text-lg">📦</span>
                <span>{orders.length}</span>
                <span className="font-normal text-slate-500">طلب</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ===== FILTERS ===== */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-1.5 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm">
            {[
              ["all", "كل الطلبات", counts.all],
              ["pending", "في الانتظار", counts.pending],
              ["confirmed", "مؤكدة", counts.confirmed],
              ["out_for_delivery", "قيد التوصيل", counts.out_for_delivery],
              ["delivered", "تم التوصيل", counts.delivered],
              ["cancelled", "ملغاة", counts.cancelled],
            ].map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key as Filter)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                  filter === key
                    ? "bg-[#17656b] text-white shadow-md shadow-[#17656b]/20 scale-[1.02]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
                <span
                  className={`mr-2 rounded-full px-2 py-0.5 text-xs ${
                    filter === key
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== LOADING ===== */}
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#17656b]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                جاري تحميل طلباتك...
              </p>
            </div>
          </div>
        )}

        {/* ===== ERROR ===== */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-200/80 bg-red-50/80 p-10 text-center backdrop-blur-sm">
            <div className="text-5xl">⚠️</div>
            <h2 className="mt-4 text-xl font-black text-red-800">
              حصلت مشكلة
            </h2>
            <p className="mt-2 text-sm font-medium text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500"
            >
              حاول مرة أخرى
            </button>
          </div>
        )}

        {/* ===== EMPTY ===== */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 px-6 py-16 text-center shadow-sm backdrop-blur-sm">
            <div className="text-7xl">📦</div>

            <h2 className="mt-5 text-2xl font-black text-slate-800">
              {filter === "all"
                ? "لسه معندكش طلبات"
                : "مفيش طلبات في الحالة دي"}
            </h2>

            <p className="mt-2 text-sm font-medium text-slate-500">
              {filter === "all"
                ? "ابدأ التسوق واعمل أول طلب ليك."
                : "جرب اختيار حالة طلب مختلفة."}
            </p>

            {filter === "all" && (
              <Link
                to="/products"
                className="mt-6 inline-flex rounded-xl bg-[#17656b] px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-[#17656b]/30 transition hover:bg-[#0f4a4f] hover:scale-[1.02]"
              >
                تصفح المنتجات
              </Link>
            )}
          </div>
        )}

        {/* ===== ORDERS GRID ===== */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => {
              const status = normalizeStatus(order.status);
              const config =
                statusConfig[status] || statusConfig.pending;
              const items = getItems(order);

              return (
                <article
                  key={order.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="border-b border-slate-100/80 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-400">
                          رقم الطلب
                        </p>
                        <h2 className="mt-1 text-lg font-black text-slate-900">
                          #{order.id}
                        </h2>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-black ${config.className}`}
                      >
                        {config.icon} {config.label}
                      </span>
                    </div>

                    <p className="mt-3 text-xs font-medium text-slate-400">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    {items.slice(0, 3).map((item, index) => (
                      <div
                        key={item.id ?? `${order.id}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/80 px-4 py-3 transition group-hover:bg-slate-100/80"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {item.product_name || item.name || "منتج"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            الكمية: {item.quantity || 1}
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-black text-[#17656b]">
                          {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}{" "}
                          ج.م
                        </span>
                      </div>
                    ))}

                    {items.length > 3 && (
                      <p className="text-center text-xs font-bold text-slate-400">
                        + {items.length - 3} منتجات أخرى
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100/80 pt-4">
                      <span className="text-sm font-bold text-slate-500">
                        الإجمالي
                      </span>
                      <span className="text-xl font-black text-[#17656b]">
                        {getTotal(order).toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100/80 p-5">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full rounded-2xl border border-[#17656b]/20 bg-[#17656b]/5 px-5 py-3.5 text-sm font-black text-[#17656b] transition hover:bg-[#17656b]/10 hover:shadow-md"
                    >
                      عرض تفاصيل الطلب
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== DETAILS MODAL ===== */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100/80 bg-white/95 px-6 py-4 backdrop-blur-sm">
              <div>
                <p className="text-xs font-bold text-slate-400">
                  تفاصيل الطلب
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  #{selectedOrder.id}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200 hover:scale-105"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* status + meta */}
              <div className="rounded-2xl border border-slate-100/80 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-500">
                    حالة الطلب
                  </span>

                  {(() => {
                    const status = normalizeStatus(selectedOrder.status);
                    const config =
                      statusConfig[status] || statusConfig.pending;

                    return (
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-black ${config.className}`}
                      >
                        {config.icon} {config.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-400">
                      تاريخ الطلب
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-700">
                      {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-400">
                      طريقة الدفع
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-700">
                      {selectedOrder.payment_method || "غير محددة"}
                    </p>
                  </div>
                </div>
              </div>

              {/* products */}
              <div>
                <h3 className="mb-3 text-base font-black text-slate-800">
                  🛍️ المنتجات
                </h3>

                <div className="space-y-2">
                  {getItems(selectedOrder).map((item, index) => (
                    <div
                      key={item.id ?? index}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100/80 px-4 py-3 transition hover:bg-slate-50/80"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {item.product_name || item.name || "منتج"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {Number(item.price || 0).toFixed(2)} ج.م ×{" "}
                          {item.quantity || 1}
                        </p>
                      </div>

                      <p className="text-sm font-black text-[#17656b]">
                        {(
                          Number(item.price || 0) *
                          Number(item.quantity || 1)
                        ).toFixed(2)}{" "}
                        ج.م
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* total */}
              <div className="rounded-2xl border border-[#17656b]/10 bg-[#17656b]/5 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">
                    إجمالي الطلب
                  </span>
                  <span className="text-2xl font-black text-[#17656b]">
                    {getTotal(selectedOrder).toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              {/* address */}
              {selectedOrder.address && (
                <div>
                  <h3 className="mb-2 text-base font-black text-slate-800">
                    📍 عنوان التوصيل
                  </h3>
                  <div className="rounded-2xl border border-slate-100/80 bg-slate-50/80 p-4 text-sm font-semibold text-slate-600">
                    {selectedOrder.address}
                  </div>
                </div>
              )}

              {/* notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="mb-2 text-base font-black text-slate-800">
                    📝 ملاحظات
                  </h3>
                  <div className="rounded-2xl border border-slate-100/80 bg-slate-50/80 p-4 text-sm font-semibold text-slate-600">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}