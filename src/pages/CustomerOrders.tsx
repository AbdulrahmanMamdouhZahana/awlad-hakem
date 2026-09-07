import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; 
import type { CartItem } from "../App"; 
import { logoutCustomer } from "../services/authService";
import Swal from "sweetalert2";
import { BackToTop } from "../components/UI";
import { apiFetch } from "../services/api"; 
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  PencilSquareIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "";

interface OrderItem {
  id: number | string;
  product_id?: number | string;
  product_name?: string;
  name?: string;
  price?: number | string;
  quantity?: number;
  product?: {
    id: number | string;
    name: string;
    image?: string | null;
    price?: number | string;
  } | null;
}

interface Order {
  id: number | string;
  status?: string;
  subtotal?: number | string | null;
  tax?: number | string | null;
  delivery_fee?: number | string | null;
  delivery_status?: string | null;
  total?: number | string;
  payment_method?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  order_items?: OrderItem[];
  orderItems?: OrderItem[];
  items?: OrderItem[];
}

type Filter = "all" | "pending" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "في انتظار التأكيد",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: ClockIcon,
  },
  pending_approval: {
    label: "في انتظار التأكيد",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: ClockIcon,
  },
  confirmed: {
    label: "تم تأكيد الطلب",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: CheckCircleIcon,
  },
  assigned: {
    label: "تم تعيين الدليفري",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: TruckIcon,
  },
  preparing: {
    label: "جاري التجهيز",
    className: "bg-cyan-50 text-cyan-700 border-cyan-200",
    icon: SparklesIcon,
  },
  out_for_delivery: {
    label: "قيد التوصيل",
    className: "bg-violet-50 text-violet-700 border-violet-200",
    icon: TruckIcon,
  },
  delivered: {
    label: "تم التوصيل",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircleIcon,
  },
  cancelled: {
    label: "ملغي",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircleIcon,
  },
};

const normalizeStatus = (status?: string) =>
  String(status || "pending").trim().toLowerCase();

const isPendingOrder = (status?: string) => {
  const norm = normalizeStatus(status);
  return norm === "pending" || norm === "pending_approval";
};

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getItems = (order: Order): OrderItem[] => {
  if (Array.isArray(order.order_items) && order.order_items.length > 0) return order.order_items;
  if (Array.isArray(order.orderItems) && order.orderItems.length > 0) return order.orderItems;
  if (Array.isArray(order.items) && order.items.length > 0) return order.items;
  return [];
};

const getTotal = (order: Order) => Number(order.total || 0);

interface EditItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  image?: string;
  tax_rate?: number | null;
  tax_type?: "percentage" | "fixed" | null;
  tax_value?: number | null;
}

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

  type DateFilterType = "today" | "yesterday" | "two_days_ago" | "last_7_days" | "this_month" | "custom";
  const [dateFilter, setDateFilter] = useState<DateFilterType>("today");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingId, setCancellingId] = useState<number | string | null>(null);

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [originalOrderQtyMap, setOriginalOrderQtyMap] = useState<Record<number, number>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [showAddProductSection, setShowAddProductSection] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");

  const [catalogProducts, setCatalogProducts] = useState<any[]>(products);
  useEffect(() => {
    if (products && products.length > 0) {
      setCatalogProducts(products);
    } else {
      apiFetch("/products?all=true").then((res) => {
        const prods = res?.products || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(prods) && prods.length > 0) setCatalogProducts(prods);
      }).catch(() => {});
    }
  }, [products]);

  // Calculate maximum allowed stock for a product, accounting for current order reservation
  const getMaxAllowedStock = (productId: number): number => {
    const catalogProduct = catalogProducts.find((p) => Number(p.id) === Number(productId));
    const stock = Number(catalogProduct?.stock) || 0;
    const reservedInThisOrder = Number(originalOrderQtyMap[productId]) || 0;
    return Math.max(0, stock + reservedInThisOrder);
  };

  // Open Edit Order Modal
  const openEditModal = (order: Order) => {
    if (!isPendingOrder(order.status)) {
      void Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "تم تأكيد الطلب ولا يمكن تعديل الطلب الآن.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#17656b",
      });
      return;
    }

    // Close details modal if open so there is no conflict
    setSelectedOrder(null);

    const rawItems = getItems(order);
    const qtyMap: Record<number, number> = {};
    const initialItems: EditItem[] = rawItems.map((item) => {
      const prodId = Number(item.product_id || item.id);
      const itemQty = Math.max(1, Number(item.quantity || 1));
      qtyMap[prodId] = (qtyMap[prodId] || 0) + itemQty;

      const catalogProduct = catalogProducts.find((p) => Number(p.id) === prodId);
      const itemImage =
        item.product?.image ||
        catalogProduct?.image ||
        "/placeholder-image.png";

      return {
        product_id: prodId,
        product_name: item.product_name || item.name || catalogProduct?.name || "منتج",
        price: Number(item.price || catalogProduct?.price || catalogProduct?.piece_price || catalogProduct?.weight_price || 0),
        quantity: itemQty,
        image: itemImage,
        tax_rate: catalogProduct?.tax_rate,
        tax_type: catalogProduct?.tax_type,
        tax_value: catalogProduct?.tax_value,
      };
    });

    setOriginalOrderQtyMap(qtyMap);
    setEditItems(initialItems);
    setEditingOrder(order);
    setShowAddProductSection(false);
    setProductSearchQuery("");
  };

  // Change Quantity (Local State with strict stock enforcement)
  const handleQuantityChange = async (productId: number, delta: number) => {
    const itemIndex = editItems.findIndex((it) => it.product_id === productId);
    if (itemIndex < 0) return;

    const currentQty = editItems[itemIndex].quantity;
    const nextQty = currentQty + delta;

    if (nextQty <= 0) {
      await handleRemoveItem(productId);
      return;
    }

    if (delta > 0) {
      const maxAllowed = getMaxAllowedStock(productId);
      if (nextQty > maxAllowed) {
        await Swal.fire({
          icon: "warning",
          title: "الكمية غير متوفرة",
          text: "الكمية المطلوبة غير متوفرة.",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#17656b",
        });
        return;
      }
    }

    setEditItems((prev) =>
      prev.map((it, idx) => (idx === itemIndex ? { ...it, quantity: nextQty } : it))
    );
  };

  // Remove Item (Local State or Cancel if last item)
  const handleRemoveItem = async (productId: number) => {
    if (editItems.length <= 1) {
      // Deleting all items: show SweetAlert2 confirmation to cancel order!
      const result = await Swal.fire({
        icon: "warning",
        title: "إلغاء الطلب؟",
        text: "لقد قمت بحذف جميع المنتجات من الطلب. هل تريد إلغاء هذا الطلب نهائياً؟",
        showCancelButton: true,
        confirmButtonText: "نعم، إلغاء الطلب",
        cancelButtonText: "رجوع",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
      });

      if (result.isConfirmed && editingOrder) {
        try {
          setSavingEdit(true);
          await apiFetch(`/customer/orders/${editingOrder.id}/cancel`, {
            method: "POST",
          });

          await Swal.fire({
            icon: "success",
            title: "تم بنجاح",
            text: "تم إلغاء الطلب بنجاح",
            confirmButtonText: "تم",
            confirmButtonColor: "#17656b",
          });

          setEditingOrder(null);
          await loadOrders();
        } catch (err: any) {
          await Swal.fire({
            icon: "error",
            title: "حدث خطأ",
            text: err?.message || "تعذر إلغاء الطلب",
            confirmButtonText: "حسناً",
          });
        } finally {
          setSavingEdit(false);
        }
      }
      return;
    }

    setEditItems((prev) => prev.filter((it) => it.product_id !== productId));
  };

  // Add Product to Edit list with strict stock availability check
  const handleAddProduct = async (prod: any) => {
    const prodId = Number(prod.id);
    const maxAllowed = getMaxAllowedStock(prodId);

    if (maxAllowed <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "المنتج غير متوفر",
        text: "هذا المنتج غير متوفر حالياً.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#17656b",
      });
      return;
    }

    const existingIndex = editItems.findIndex((it) => it.product_id === prodId);

    if (existingIndex >= 0) {
      const currentQty = editItems[existingIndex].quantity;
      if (currentQty + 1 > maxAllowed) {
        await Swal.fire({
          icon: "warning",
          title: "الكمية غير متوفرة",
          text: "الكمية المطلوبة غير متوفرة.",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#17656b",
        });
        return;
      }

      setEditItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
    } else {
      setEditItems((prev) => [
        ...prev,
        {
          product_id: prodId,
          product_name: prod.name,
          price: Number(prod.price || prod.piece_price || prod.weight_price || 0),
          quantity: 1,
          image: prod.image || "/placeholder-image.png",
          tax_rate: prod.tax_rate,
          tax_type: prod.tax_type,
          tax_value: prod.tax_value,
        },
      ]);
    }
  };

  // Save Edit Order
  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    if (editItems.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يجب أن يحتوي الطلب على منتج واحد على الأقل، أو يمكنك إلغاء الطلب",
        confirmButtonText: "حسناً",
      });
      return;
    }

    try {
      setSavingEdit(true);
      const payload = {
        items: editItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
        })),
      };

      const response = await apiFetch(`/customer/orders/${editingOrder.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updated = response?.order || response?.data || response;
      await Swal.fire({
        icon: "success",
        title: "تم بنجاح",
        text: "تم تعديل الطلب بنجاح",
        confirmButtonText: "تم",
        confirmButtonColor: "#17656b",
      });

      setEditingOrder(null);
      await loadOrders();
    } catch (err: any) {
      console.error("CUSTOMER EDIT ORDER ERROR:", err);
      const msg = err instanceof Error ? err.message : "تعذر تعديل الطلب";
      if (msg.includes("تأكيد") || msg.includes("confirmed") || err?.status === 409) {
        await Swal.fire({
          icon: "error",
          title: "تعذر تعديل الطلب",
          text: "تم تأكيد الطلب ولا يمكن تعديل الطلب الآن.",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#ef4444",
        });
        setEditingOrder(null);
        await loadOrders();
      } else {
        await Swal.fire({
          icon: "error",
          title: "حدث خطأ",
          text: msg || "تعذر تعديل الطلب",
          confirmButtonText: "حسناً",
          confirmButtonColor: "#ef4444",
        });
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Customer Cancellation
  const handleCancelOrder = async (order: Order) => {
    if (!isPendingOrder(order.status)) {
      await Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "لا يمكن إلغاء الطلب بعد تأكيده من قِبل الإدارة",
        confirmButtonText: "حسناً",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "إلغاء الطلب؟",
      text: "هل أنت متأكد من إلغاء الطلب؟",
      showCancelButton: true,
      confirmButtonText: "نعم، إلغاء الطلب",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setCancellingId(order.id);
      await apiFetch(`/customer/orders/${order.id}/cancel`, {
        method: "POST",
      });

      await Swal.fire({
        icon: "success",
        title: "تم بنجاح",
        text: "تم إلغاء الطلب بنجاح",
        confirmButtonText: "تم",
        confirmButtonColor: "#17656b",
      });

      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
      await loadOrders();
    } catch (err: any) {
      console.error("CUSTOMER CANCEL ERROR:", err);
      await Swal.fire({
        icon: "error",
        title: "حدث خطأ",
        text: err instanceof Error ? err.message : "تعذر إلغاء الطلب",
        confirmButtonText: "حسناً",
      });
    } finally {
      setCancellingId(null);
    }
  };

  // Computed summary for Edit Modal preview
  const editSubtotal = editItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const editTax = editItems.reduce((sum, it) => {
    if (it.tax_type === "fixed" && it.tax_value != null) {
      return sum + (Number(it.tax_value) * it.quantity);
    }
    const rate = Number(it.tax_value ?? it.tax_rate ?? 0);
    return sum + (it.price * it.quantity * (rate / 100));
  }, 0);
  const editDeliveryFee = editingOrder?.delivery_status === "calculated" && editingOrder?.delivery_fee != null
    ? Number(editingOrder.delivery_fee)
    : null;
  const editTotal = editSubtotal + editTax + (editDeliveryFee || 0);

  // Load Orders from Backend (with Date Filter)
  const loadOrders = async (
    targetDate: DateFilterType = dateFilter,
    fromVal: string = customFrom,
    toVal: string = customTo
  ) => {
    setLoading(true);
    setError("");

    try {
      let url = `${API_URL}/customer/orders?date=${encodeURIComponent(targetDate)}`;
      if (targetDate === "custom" && fromVal) {
        url += `&from_date=${encodeURIComponent(fromVal)}&to_date=${encodeURIComponent(toVal || fromVal)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        await logoutCustomer();
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
        (o) => isPendingOrder(o.status)
      ).length,
      confirmed: orders.filter((o) =>
        ["confirmed", "assigned", "preparing"].includes(normalizeStatus(o.status))
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

  const handleCheckout = () => {
    if (cart.length === 0) return;
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
                <ArrowRightIcon className="w-4 h-4 rtl:rotate-0" aria-hidden="true" />
                <span>العودة للمتجر</span>
              </Link>

              <h1 className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-900 sm:text-3xl">
                <ClipboardDocumentListIcon className="w-7 h-7 text-[#17656b]" aria-hidden="true" />
                <span>طلباتي</span>
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                تابع حالة طلباتك وتفاصيل كل طلب
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1.5 rounded-full bg-[#17656b]/10 px-4 py-2 text-sm font-bold text-[#17656b] sm:flex">
                <ShoppingBagIcon className="w-5 h-5 text-[#17656b]" aria-hidden="true" />
                <span>{orders.length}</span>
                <span className="font-normal text-slate-500">طلب</span>
              </div>
            </div>
          </div>

          {/* Date Filter Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500">
              <CalendarDaysIcon className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span>تصفية التاريخ:</span>
            </span>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => {
                  const nextDate = e.target.value as DateFilterType;
                  setDateFilter(nextDate);
                  if (nextDate !== "custom") {
                    void loadOrders(nextDate, customFrom, customTo);
                  }
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm outline-none transition hover:border-[#17656b] focus:border-[#17656b] focus:ring-2 focus:ring-[#17656b]/20"
              >
                <option value="today">اليوم</option>
                <option value="yesterday">أمس</option>
                <option value="two_days_ago">أول أمس</option>
                <option value="last_7_days">آخر 7 أيام</option>
                <option value="this_month">هذا الشهر</option>
                <option value="custom">تاريخ مخصص</option>
              </select>
            </div>

            {dateFilter === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <span>من:</span>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#17656b]"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <span>إلى:</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#17656b]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void loadOrders("custom", customFrom, customTo)}
                  className="rounded-xl bg-[#17656b] px-3.5 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-[#0e4347]"
                >
                  تطبيق
                </button>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: "all", label: "الكل", count: counts.all },
              { id: "pending", label: "في الانتظار", count: counts.pending },
              { id: "confirmed", label: "تم التأكيد", count: counts.confirmed },
              { id: "out_for_delivery", label: "قيد التوصيل", count: counts.out_for_delivery },
              { id: "delivered", label: "تم التوصيل", count: counts.delivered },
              { id: "cancelled", label: "ملغي", count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as Filter)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                  filter === tab.id
                    ? "bg-[#17656b] text-white shadow-lg shadow-[#17656b]/20"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    filter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#17656b] border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-slate-500">جاري تحميل الطلبات...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <ExclamationTriangleIcon className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-black text-rose-900">تعذر تحميل الطلبات</h3>
            <p className="mt-1 text-sm text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-4 rounded-2xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-rose-700"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <ShoppingBagIcon className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">لا توجد طلبات</h3>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "all"
                ? "لم تقم بأي طلبات بعد، تصفح منتجاتنا وابدأ بالتسوق الآن!"
                : "لا توجد طلبات مطابقة لهذا الفلتر"}
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#17656b] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#17656b]/20 transition hover:bg-[#0e4347]"
            >
              <ShoppingBagIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>ابدأ التسوق الآن</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const status = normalizeStatus(order.status);
              const badge = statusConfig[status] || statusConfig.pending;
              const StatusIcon = badge.icon;
              const items = getItems(order);
              const isOrderPending = isPendingOrder(order.status);

              return (
                <article
                  key={order.id}
                  className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-xl hover:border-[#17656b]/30"
                >
                  <div className="p-6">
                    {/* Header: ID + Status */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400">رقم الطلب</span>
                        <h2 className="text-lg font-black text-slate-900">#{order.id}</h2>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${badge.className}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>تاريخ الطلب</span>
                        </span>
                        <span className="font-bold text-slate-700">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5">
                          <CreditCardIcon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>طريقة الدفع</span>
                        </span>
                        <span className="font-bold text-slate-700">
                          {order.payment_method === "electronic" || order.payment_method === "bank_transfer"
                            ? "تحويل بنكي / إلكتروني"
                            : "دفع عند الاستلام"}
                        </span>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <h3 className="mb-2 text-xs font-bold text-slate-400">
                        المنتجات ({items.length})
                      </h3>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {items.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs font-bold text-slate-700"
                          >
                            <span className="truncate max-w-[160px]">
                              {item.product_name || item.name || "منتج"}
                            </span>
                            <span className="text-slate-400">×{item.quantity || 1}</span>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <p className="text-[11px] font-bold text-[#17656b]">
                            +{items.length - 3} منتجات أخرى...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-sm font-black text-slate-900">الإجمالي:</span>
                      <span className="text-lg font-black text-[#17656b]">
                        {getTotal(order).toFixed(2)} ج
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-100/80 p-5 space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[#17656b]/20 bg-[#17656b]/5 px-5 py-3 text-sm font-black text-[#17656b] transition hover:bg-[#17656b]/10 hover:shadow-md"
                    >
                      <EyeIcon className="w-4 h-4" aria-hidden="true" />
                      <span>عرض تفاصيل الطلب</span>
                    </button>

                    {isOrderPending ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(order)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-amber-600 hover:scale-[1.01]"
                        >
                          <PencilSquareIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>تعديل الطلب</span>
                        </button>
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => void handleCancelOrder(order)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-rose-700 hover:scale-[1.01] disabled:opacity-50"
                        >
                          {cancellingId === order.id ? (
                            <span>جاري الإلغاء...</span>
                          ) : (
                            <>
                              <XMarkIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>إلغاء الطلب</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : status === "cancelled" ? (
                      <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-center text-xs font-black text-rose-700">
                        تم إلغاء الطلب.
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-center text-xs font-bold text-slate-600">
                        لا يمكن تعديل الطلب بعد تأكيد الطلب.
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* ===== ORDER DETAILS MODAL ===== */}
      {/* ==================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-400">تفاصيل الطلب</span>
                <h2 className="text-xl font-black text-slate-900">#{selectedOrder.id}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="إغلاق"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition"
              >
                <XMarkIcon className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Order Status Badge */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <span className="text-sm font-bold text-slate-500">حالة الطلب:</span>
                {(() => {
                  const badge = statusConfig[normalizeStatus(selectedOrder.status)] || statusConfig.pending;
                  const StatusIcon = badge.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${badge.className}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{badge.label}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Products List */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-base font-black text-slate-800">
                  <ShoppingBagIcon className="w-5 h-5 text-[#17656b] shrink-0" aria-hidden="true" />
                  <span>المنتجات المطلوبة</span>
                </h3>
                <div className="space-y-3">
                  {getItems(selectedOrder).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400">
                          <ShoppingBagIcon className="w-5 h-5 text-slate-400" aria-hidden="true" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {item.product_name || item.name || "منتج"}
                          </h4>
                          <span className="text-xs text-slate-400">
                            الكمية: {item.quantity || 1}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-[#17656b]">
                        {Number(item.price || 0) * Number(item.quantity || 1)} ج
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 space-y-2 text-xs font-bold">
                {selectedOrder.subtotal != null && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span>{Number(selectedOrder.subtotal).toFixed(2)} ج</span>
                  </div>
                )}
                {selectedOrder.tax != null && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>الضريبة:</span>
                    <span>{Number(selectedOrder.tax).toFixed(2)} ج</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span>رسوم التوصيل:</span>
                  <span>
                    {selectedOrder.delivery_status === "calculated" && selectedOrder.delivery_fee != null
                      ? `${selectedOrder.delivery_fee} ج`
                      : "يتم تحديدها من الإدارة"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-black text-[#17656b]">
                  <span>الإجمالي الكلي:</span>
                  <span>{getTotal(selectedOrder).toFixed(2)} ج</span>
                </div>
              </div>

              {/* Address info */}
              {selectedOrder.address && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-base font-black text-slate-800">
                    <MapPinIcon className="w-4 h-4 text-[#17656b] shrink-0" aria-hidden="true" />
                    <span>عنوان التوصيل</span>
                  </h3>
                  <div className="rounded-2xl border border-slate-100/80 bg-slate-50/80 p-4 text-sm font-semibold text-slate-600">
                    {selectedOrder.address}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-base font-black text-slate-800">
                    <DocumentTextIcon className="w-4 h-4 text-[#17656b] shrink-0" aria-hidden="true" />
                    <span>ملاحظات</span>
                  </h3>
                  <div className="rounded-2xl border border-slate-100/80 bg-slate-50/80 p-4 text-sm font-semibold text-slate-600">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}

              {/* Order Actions / Lifecycle Notices in Details Modal */}
              <div className="border-t border-slate-100 pt-4">
                {isPendingOrder(selectedOrder.status) ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        openEditModal(selectedOrder);
                      }}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-amber-600"
                    >
                      <PencilSquareIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>تعديل محتويات الطلب</span>
                    </button>
                    <button
                      type="button"
                      disabled={cancellingId === selectedOrder.id}
                      onClick={() => void handleCancelOrder(selectedOrder)}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      {cancellingId === selectedOrder.id ? (
                        <span>جاري الإلغاء...</span>
                      ) : (
                        <>
                          <XMarkIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>إلغاء الطلب</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : normalizeStatus(selectedOrder.status) === "cancelled" ? (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center text-sm font-black text-rose-700">
                    تم إلغاء الطلب.
                  </div>
                ) : (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center text-sm font-bold text-amber-800">
                    لا يمكن تعديل الطلب بعد تأكيد الطلب.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ===== EDIT ORDER MODAL (تعديل الطلب) ===== */}
      {/* ==================================================== */}
      {editingOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <PencilSquareIcon className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>تعديل الطلب</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  طلب رقم #{editingOrder.id} • قم بتعديل الكميات أو إضافة وحذف المنتجات
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                aria-label="إغلاق"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm border border-slate-200 hover:text-slate-700 hover:border-slate-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <XMarkIcon className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Order Items List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <ShoppingBagIcon className="w-4 h-4 text-[#17656b] shrink-0" aria-hidden="true" />
                    <span>محتويات الطلب ({editItems.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddProductSection((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs font-black text-[#17656b] hover:text-[#0e4347] bg-[#17656b]/10 hover:bg-[#17656b]/20 px-3 py-1.5 rounded-xl transition"
                  >
                    {showAddProductSection ? (
                      <span className="inline-flex items-center gap-1">
                        <XMarkIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>إخفاء القائمة</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <PlusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>إضافة منتجات</span>
                      </span>
                    )}
                  </button>
                </div>

                {editItems.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                    <p className="text-sm font-bold text-slate-500">تم حذف جميع المنتجات من الطلب</p>
                    <p className="text-xs text-slate-400 mt-1">أضف منتجات جديدة أو قم بحفظ التعديلات لإلغاء الطلب</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editItems.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                      >
                        {/* Product Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={item.image || "/placeholder-image.png"}
                            alt={item.product_name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-image.png";
                            }}
                            className="h-16 w-16 rounded-xl border border-slate-200 bg-white object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 truncate">
                              {item.product_name}
                            </h4>
                            <p className="text-xs font-bold text-[#17656b] mt-0.5">
                              السعر: {item.price} ج
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[11px] font-medium text-slate-400">
                                الإجمالي: {(item.price * item.quantity).toFixed(2)} ج
                              </p>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 rounded-md px-1.5 py-0.5">
                                أقصى كمية: {getMaxAllowedStock(item.product_id)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Controls: [-] quantity [+] & [حذف] */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
                            <button
                              type="button"
                              onClick={() => void handleQuantityChange(item.product_id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition"
                              aria-label="تقليل الكمية"
                            >
                              <MinusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            </button>
                            <span className="w-8 text-center text-sm font-black text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={item.quantity >= getMaxAllowedStock(item.product_id)}
                              onClick={() => void handleQuantityChange(item.product_id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition disabled:opacity-35 disabled:cursor-not-allowed"
                              aria-label="زيادة الكمية"
                            >
                              <PlusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => void handleRemoveItem(item.product_id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-100 active:scale-95 transition shadow-sm"
                            aria-label="حذف المنتج من الطلب"
                          >
                            <TrashIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Product Section (Inline catalog browse & search) */}
              {showAddProductSection && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                      <ShoppingBagIcon className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
                      <span>إضافة منتجات من المتجر</span>
                    </h4>
                    <span className="text-[11px] font-bold text-indigo-700">
                      اختر المنتج لإضافته مباشرةً
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="ابحث باسم المنتج أو القسم الفرعي أو الشركة..."
                      className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-[#17656b] focus:ring-2 focus:ring-[#17656b]/20"
                    />
                  </div>

                  {/* Filtered Catalog List */}
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {catalogProducts
                      .filter((p) => {
                        if (!productSearchQuery.trim()) return true;
                        const query = productSearchQuery.trim().toLowerCase();
                        const name = String(p.name || "").toLowerCase();
                        const cat = String(p.category || "").toLowerCase();
                        return name.includes(query) || cat.includes(query);
                      })
                      .slice(0, 20)
                      .map((prod) => {
                        const maxStock = getMaxAllowedStock(Number(prod.id));
                        const currentInOrder = editItems.find((it) => it.product_id === Number(prod.id))?.quantity || 0;
                        const isOutOfStock = maxStock <= 0;
                        const isMaxReached = currentInOrder >= maxStock;

                        return (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm transition hover:border-indigo-300"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <img
                                src={prod.image || "/placeholder-image.png"}
                                alt={prod.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder-image.png";
                                }}
                                className="h-10 w-10 rounded-lg border border-slate-100 object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate">
                                  {prod.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[11px] font-bold text-[#17656b]">
                                    {prod.price || prod.piece_price || prod.weight_price || 0} ج
                                  </p>
                                  {isOutOfStock ? (
                                    <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                      هذا المنتج غير متوفر حالياً.
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      متوفر: {maxStock} {isMaxReached ? "• أقصى كمية" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isOutOfStock || isMaxReached}
                              onClick={() => void handleAddProduct(prod)}
                              className={`rounded-xl px-3 py-1.5 text-xs font-black transition active:scale-95 shadow-sm ${
                                isOutOfStock || isMaxReached
                                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                                  : currentInOrder > 0
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  : "bg-[#17656b] text-white hover:bg-[#0e4347]"
                              }`}
                            >
                              {isOutOfStock ? (
                                "غير متوفر"
                              ) : isMaxReached ? (
                                "الحد الأقصى"
                              ) : currentInOrder > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  <PlusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                  <span>زيادة الكمية</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <PlusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                  <span>إضافة للطلب</span>
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Summary & Action Buttons) */}
            <div className="border-t border-slate-200/80 bg-slate-50/90 p-5">
              {/* Summary Totals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 rounded-2xl bg-white p-3 border border-slate-200/60 shadow-sm text-center">
                <div>
                  <p className="text-[11px] font-bold text-slate-400">المجموع الفرعي</p>
                  <p className="text-sm font-black text-slate-800">{editSubtotal.toFixed(2)} ج</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">الضريبة التقديرية</p>
                  <p className="text-sm font-black text-slate-800">{editTax.toFixed(2)} ج</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">رسوم التوصيل</p>
                  <p className="text-sm font-black text-slate-800">
                    {editDeliveryFee != null ? `${editDeliveryFee} ج` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">الإجمالي التقديري</p>
                  <p className="text-base font-black text-[#17656b]">{editTotal.toFixed(2)} ج</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-3">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingOrder(null)}
                  className="w-full sm:flex-1 rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={savingEdit || editItems.length === 0}
                  onClick={() => void handleSaveEdit()}
                  className="w-full sm:flex-1 rounded-2xl bg-[#17656b] py-3 text-sm font-black text-white shadow-lg shadow-[#17656b]/20 transition hover:bg-[#0e4347] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingEdit ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>جاري حفظ التعديلات...</span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>حفظ التعديلات</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Back to Top with Scroll Progress */}
      <BackToTop />
    </div>
  );
}
