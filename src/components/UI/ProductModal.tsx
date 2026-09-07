import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import toast from "react-hot-toast";
import { promptText } from "../../utils/alerts";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  tax_rate?: number | null;
  tax_type?: "percentage" | "fixed" | null;
  tax_value?: number | null;
  unit: string;
  image: string;
  stock: number;
  sale_type?: "piece" | "weight" | "both";
  piece_price?: number | null;
  weight_price?: number | null;
  is_offer?: boolean;
  offer_price?: number | null;
  original_price?: number | null;
  discount_percentage?: number | null;
  offer_badge?: string | null;
  offer_expires_at?: string | null;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editingProduct: Product | null;
  loading: boolean;
  categories: Record<string, string[]>;
  onCategoriesChange?: (categories: Record<string, string[]>) => void;
}

const ProductModal = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  loading,
  categories,
  onCategoriesChange,
}: ProductModalProps) => {
  const mainCategories = Object.keys(categories);

  const getMainCategoryForProduct = (category: string) =>
    mainCategories.find((main) => categories[main]?.includes(category)) ??
    mainCategories[0] ??
    "";

  const [form, setForm] = useState({
    name: editingProduct?.name || "",
    mainCategory: editingProduct
      ? getMainCategoryForProduct(editingProduct.category)
      : mainCategories[0] || "",
    category: editingProduct?.category || "",
    price: editingProduct?.price?.toString() || "",
    unit: editingProduct?.unit || (editingProduct?.sale_type === "weight" ? "كيلو" : "قطعة"),
    saleType: editingProduct?.sale_type || "piece",
    piecePrice:
      editingProduct?.piece_price != null
        ? editingProduct.piece_price.toString()
        : editingProduct?.price?.toString() || "",
    weightPrice:
      editingProduct?.weight_price != null
        ? editingProduct.weight_price.toString()
        : "",
    image: editingProduct?.image || "",
    stock: editingProduct?.stock?.toString() || "0",
    taxType: ((editingProduct?.tax_type === "fixed" || (editingProduct?.tax_rate != null && Number(editingProduct.tax_rate) < 0)) ? "fixed" : "percentage") as "percentage" | "fixed",
    taxValue:
      editingProduct?.tax_value != null
        ? editingProduct.tax_value.toString()
        : editingProduct?.tax_rate != null
        ? Math.abs(Number(editingProduct.tax_rate)).toString()
        : "0",
    taxRate: editingProduct?.tax_rate?.toString() || "0",
    isOffer: false,
    offerPrice: "",
    discountPercentage: "",
    offerBadge: "عرض خاص 🔥",
    offerExpiresAt: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(editingProduct?.image || "");
  const [imageMode, setImageMode] = useState<"url" | "file">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subCategories = categories[form.mainCategory] ?? [];

  const addMainCategory = async () => {
    if (!onCategoriesChange) return;

    const trimmed = await promptText("إضافة قسم رئيسي جديد", "اكتب اسم القسم الرئيسي الجديد...");
    if (!trimmed) return;

    if (categories[trimmed]) {
      toast.error("القسم الرئيسي موجود بالفعل");
      return;
    }

    const nextCategories = {
      ...categories,
      [trimmed]: [],
    };

    onCategoriesChange(nextCategories);
    setForm((prev) => ({
      ...prev,
      mainCategory: trimmed,
      category: "",
    }));
    toast.success("تم إضافة القسم الرئيسي");
  };

  const addSubCategory = async () => {
    if (!onCategoriesChange || !form.mainCategory) return;

    const trimmed = await promptText(
      `إضافة قسم فرعي داخل "${form.mainCategory}"`,
      "اكتب اسم القسم الفرعي الجديد..."
    );
    if (!trimmed) return;

    const currentSubCategories = categories[form.mainCategory] ?? [];

    if (currentSubCategories.includes(trimmed)) {
      toast.error("القسم الفرعي موجود بالفعل");
      return;
    }

    const nextCategories = {
      ...categories,
      [form.mainCategory]: [...currentSubCategories, trimmed],
    };

    onCategoriesChange(nextCategories);
    setForm((prev) => ({
      ...prev,
      category: trimmed,
    }));
    toast.success("تم إضافة القسم الفرعي");
  };

  useEffect(() => {
    const mainCategory = editingProduct
      ? getMainCategoryForProduct(editingProduct.category)
      : mainCategories[0] || "";

    const isOfferActive = Boolean(
      editingProduct?.is_offer ||
      (editingProduct?.offer_price && Number(editingProduct.offer_price) > 0)
    );
    const offerPriceVal =
      editingProduct?.offer_price != null
        ? editingProduct.offer_price.toString()
        : "";
    const discountVal =
      editingProduct?.discount_percentage != null
        ? editingProduct.discount_percentage.toString()
        : "";
    const badgeVal =
      editingProduct?.offer_badge ||
      "عرض خاص 🔥";
    const expiresVal = editingProduct?.offer_expires_at
      ? editingProduct.offer_expires_at.substring(0, 16)
      : "";

    setForm({
      name: editingProduct?.name || "",
      mainCategory,
      category:
        editingProduct?.category ||
        categories[mainCategory]?.[0] ||
        "",
      price: editingProduct?.price?.toString() || "",
      unit: editingProduct?.unit || (editingProduct?.sale_type === "weight" ? "كيلو" : "قطعة"),
      saleType: editingProduct?.sale_type || "piece",
      piecePrice:
        editingProduct?.piece_price != null
          ? editingProduct.piece_price.toString()
          : editingProduct?.price?.toString() || "",
      weightPrice:
        editingProduct?.weight_price != null
          ? editingProduct.weight_price.toString()
          : "",
      image: editingProduct?.image || "",
      stock: editingProduct?.stock?.toString() || "0",
      taxType: ((editingProduct?.tax_type === "fixed" || (editingProduct?.tax_rate != null && Number(editingProduct.tax_rate) < 0)) ? "fixed" : "percentage") as "percentage" | "fixed",
      taxValue:
        editingProduct?.tax_value != null
          ? editingProduct.tax_value.toString()
          : editingProduct?.tax_rate != null
          ? Math.abs(Number(editingProduct.tax_rate)).toString()
          : "0",
      taxRate:
        editingProduct?.tax_rate != null
          ? editingProduct.tax_rate.toString()
          : "0",
      isOffer: isOfferActive,
      offerPrice: offerPriceVal,
      discountPercentage: discountVal,
      offerBadge: badgeVal,
      offerExpiresAt: expiresVal,
    });

    setImageFile(null);
    setImagePreview(editingProduct?.image || "");
    setImageMode("url");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [editingProduct, isOpen]);

  const handleMainCategoryChange = (mainCategory: string) => {
    setForm((prev) => ({
      ...prev,
      mainCategory,
      category: categories[mainCategory]?.[0] || "",
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("من فضلك اختر صورة صحيحة");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب ألا يتجاوز 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageMode("file");
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const cleanImageUrl = (raw: string): string => {
    let url = String(raw ?? "").trim();
    if (!url) return "";
    try {
      if (url.includes("google.") && url.includes("imgurl=")) {
        const parsed = new URL(url);
        const extracted = parsed.searchParams.get("imgurl");
        if (extracted) return decodeURIComponent(extracted);
      }
      if (url.includes("imgurl=")) {
        const match = url.match(/imgurl=([^&]+)/);
        if (match && match[1]) return decodeURIComponent(match[1]);
      }
    } catch {
      // ignore
    }
    if (url.startsWith("//")) {
      url = `https:${url}`;
    }
    return url;
  };

  const handleImageUrlPreview = (targetUrl?: string) => {
    const url = cleanImageUrl(targetUrl ?? form.image);

    if (!url) {
      toast.error("الرجاء إدخال رابط الصورة");
      return;
    }

    try {
      if (/^https?:\/\//i.test(url) || url.startsWith("/")) {
        setImagePreview(url);
      } else {
        const fullUrl = `https://${url}`;
        setImagePreview(fullUrl);
        setForm((prev) => ({ ...prev, image: fullUrl }));
      }
    } catch {
      toast.error("الرجاء إدخال رابط صحيح");
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("اكتب اسم المنتج");
      return;
    }

    if (!form.mainCategory) {
      toast.error("اختر القسم الرئيسي");
      return;
    }

    if (!form.category) {
      toast.error("اختر القسم الفرعي");
      return;
    }

    const resolvedUnit =
      form.unit.trim() ||
      (form.saleType === "weight"
        ? "كيلو"
        : form.saleType === "both"
          ? "قطعة / كيلو"
          : "قطعة");

    const piecePrice =
      form.saleType === "weight"
        ? null
        : Number(form.piecePrice);

    const weightPrice =
      form.saleType === "piece"
        ? null
        : Number(form.weightPrice);

    if (
      form.saleType !== "weight" &&
      (form.piecePrice === "" || isNaN(piecePrice!) || piecePrice! < 0)
    ) {
      toast.error("اكتب سعر القطعة بشكل صحيح");
      return;
    }

    if (
      form.saleType !== "piece" &&
      (form.weightPrice === "" || isNaN(weightPrice!) || weightPrice! < 0)
    ) {
      toast.error("اكتب سعر الكيلو بشكل صحيح");
      return;
    }

    const price =
      form.saleType === "weight"
        ? weightPrice!
        : piecePrice!;

    const stock = Number(form.stock);

    if (isNaN(stock) || stock < 0) {
      toast.error("المخزون غير صحيح");
      return;
    }

    const finalSaleType = form.saleType || "piece";

    let finalOfferPrice: number | null = null;
    let finalDiscountPercentage: number | null = null;

    if (form.isOffer) {
      const offerPriceNum = Number(form.offerPrice);
      if (isNaN(offerPriceNum) || offerPriceNum <= 0) {
        toast.error("يرجى إدخال سعر العرض بشكل صحيح");
        return;
      }
      if (offerPriceNum >= price) {
        toast.error("سعر العرض يجب أن يكون أقل من السعر الأصلي");
        return;
      }
      finalOfferPrice = offerPriceNum;
      finalDiscountPercentage = form.discountPercentage
        ? Number(form.discountPercentage)
        : Math.round(((price - offerPriceNum) / price) * 100);
    }

    const taxValueNum = Number(form.taxValue);
    if (isNaN(taxValueNum) || taxValueNum < 0) {
      toast.error("قيمة الضريبة يجب أن تكون رقماً موجباً أو صفراً");
      return;
    }
    if (form.taxType === "percentage" && taxValueNum > 100) {
      toast.error("نسبة الضريبة المئوية لا يمكن أن تتجاوز 100%");
      return;
    }
    const taxRate = taxValueNum;

    await onSave({
      ...form,
      unit: resolvedUnit,
      image: imageMode === "file" ? "" : cleanImageUrl(form.image),
      price,
      tax_type: form.taxType,
      tax_value: taxValueNum,
      taxType: form.taxType,
      taxValue: taxValueNum,
      taxRate,
      tax_rate: taxRate,
      piecePrice,
      weightPrice,
      saleType: finalSaleType,
      sale_type: finalSaleType,
      piece_price: piecePrice,
      weight_price: weightPrice,
      stock,
      imageFile: imageFile || undefined,
      isOffer: form.isOffer,
      is_offer: form.isOffer,
      offerPrice: finalOfferPrice,
      offer_price: finalOfferPrice,
      originalPrice: price,
      original_price: price,
      discountPercentage: finalDiscountPercentage,
      discount_percentage: finalDiscountPercentage,
      offerBadge: form.isOffer ? form.offerBadge || "عرض خاص 🔥" : null,
      offer_badge: form.isOffer ? form.offerBadge || "عرض خاص 🔥" : null,
      offer_expires_at: form.isOffer && form.offerExpiresAt ? form.offerExpiresAt : null,
      offerExpiresAt: form.isOffer && form.offerExpiresAt ? form.offerExpiresAt : null,
    });
  };

  const resetForm = () => {
    const mainCategory = mainCategories[0] || "";

    setForm({
      name: "",
      mainCategory,
      category: categories[mainCategory]?.[0] || "",
      price: "",
      unit: "قطعة",
      saleType: "piece",
      piecePrice: "",
      weightPrice: "",
      image: "",
      stock: "0",
      taxType: "percentage",
      taxValue: "0",
      taxRate: "0",
      isOffer: false,
      offerPrice: "",
      discountPercentage: "",
      offerBadge: "عرض خاص 🔥",
      offerExpiresAt: "",
    });

    setImageFile(null);
    setImagePreview("");
    setImageMode("url");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) {
          onClose();
          resetForm();
        }
      }}
      title={editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
      subtitle="إدارة المنتجات"
      icon={<span>📦</span>}
      loading={loading}
      actions={
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "جاري الحفظ..."
              : editingProduct
                ? "حفظ التعديلات"
                : "إضافة المنتج"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">
            اسم المنتج
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="مثال: أرز الضحى"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              القسم الرئيسي
            </label>
            <select
              value={form.mainCategory}
              onChange={(e) => handleMainCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400"
            >
              {mainCategories.map((main) => (
                <option key={main} value={main}>
                  {main}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={addMainCategory}
              disabled={loading}
              className="mt-2 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
            >
              + إضافة قسم رئيسي
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              القسم الفرعي
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400"
            >
              {subCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={addSubCategory}
              disabled={loading || !form.mainCategory}
              className="mt-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              + إضافة قسم فرعي
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-bold leading-6 text-indigo-700">
          القسم الرئيسي للتنظيم فقط، والقسم الفرعي هو القيمة التي سيتم حفظها
          في خانة category الحالية بقاعدة البيانات.
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">
            طريقة البيع
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { value: "piece", label: "بالقطعة", icon: "📦" },
              { value: "weight", label: "بالوزن", icon: "⚖️" },
              { value: "both", label: "قطعة + وزن", icon: "🔄" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={loading}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    saleType: option.value as "piece" | "weight" | "both",
                    unit:
                      !prev.unit || prev.unit === "قطعة" || prev.unit === "كيلو" || prev.unit === "قطعة / كيلو"
                        ? option.value === "weight"
                          ? "كيلو"
                          : option.value === "both"
                            ? "قطعة / كيلو"
                            : "قطعة"
                        : prev.unit,
                  }))
                }
                className={`rounded-xl border px-4 py-3 text-sm font-black transition ${form.saleType === option.value
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-indigo-50"
                  }`}
              >
                <span className="ml-2">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {form.saleType !== "weight" && (
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                سعر القطعة
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.piecePrice}
                onChange={(e) =>
                  setForm({ ...form, piecePrice: e.target.value })
                }
                placeholder="مثال: 15"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400"
              />
            </div>
          )}

          {form.saleType !== "piece" && (
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                سعر الكيلو
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.weightPrice}
                onChange={(e) =>
                  setForm({ ...form, weightPrice: e.target.value })
                }
                placeholder="مثال: 100"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              وحدة المنتج
            </label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder={form.saleType === "weight" ? "مثال: كيلو" : "مثال: قطعة، كيس، علبة"}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(form.saleType === "weight"
                ? ["كيلو", "نصف كيلو", "ربع كيلو", "جرام"]
                : ["قطعة", "علبة", "كيس", "زجاجة", "برطمان", "كرتونة", "رول", "كيلو", "نصف كيلو", "ربع كيلو", "جرام"]
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, unit: preset }))}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${form.unit === preset
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              المخزون
              {form.saleType !== "piece" && (
                <span className="mr-2 text-xs font-bold text-slate-400">
                  (بالكيلو)
                </span>
              )}
            </label>
            <input
              type="number"
              min="0"
              step={form.saleType === "piece" ? "1" : "0.001"}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold leading-6 text-emerald-700">
          {form.saleType === "piece"
            ? "📦 العميل يشتري بالقطعة، ويتم حساب السعر = عدد القطع × سعر القطعة."
            : form.saleType === "weight"
              ? "⚖️ العميل يحدد الوزن الذي يريده، ويتم حساب السعر = الوزن × سعر الكيلو."
              : "🔄 العميل يختار بين القطعة والوزن، ولكل طريقة سعرها الخاص."}
        </div>

        {/* =======================================================
            TAX SECTION (نوع وقيمة الضريبة: نسبة مئوية أو مبلغ ثابت)
        ======================================================= */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <label className="block text-sm font-black text-slate-800">
                💰 نظام الضريبة على المنتج
              </label>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                اختر نوع الضريبة (نسبة مئوية % من سعر المنتج أو مبلغ ثابت بالجنيه للوحدة)
              </p>
            </div>

            {/* نوع الضريبة */}
            <div className="w-full sm:w-52">
              <label className="mb-1 block text-xs font-black text-slate-700">
                نوع الضريبة:
              </label>
              <select
                value={form.taxType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    taxType: e.target.value as "percentage" | "fixed",
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 outline-none transition focus:border-indigo-400"
              >
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ج.م)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-blue-100/80 pt-3">
            <div>
              <label className="block text-xs font-black text-slate-700">
                قيمة الضريبة:
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                {form.taxType === "percentage"
                  ? "اكتب نسبة الضريبة (0 = بدون ضريبة، 14 = 14%)"
                  : "اكتب مبلغ الضريبة الثابت لكل قطعة/كيلو (مثال: 20 = 20.00 ج.م)"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-36">
                <input
                  type="number"
                  min="0"
                  max={form.taxType === "percentage" ? "100" : undefined}
                  step="0.01"
                  value={form.taxValue}
                  onChange={(e) => setForm({ ...form, taxValue: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-black outline-none transition focus:border-indigo-400"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  {form.taxType === "percentage" ? "%" : "ج.م"}
                </span>
              </div>

              {/* أزرار سريعة للاختيار */}
              <div className="flex gap-1">
                {(form.taxType === "percentage" ? [0, 14, 15] : [0, 5, 10, 20]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, taxValue: val.toString() }))}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-black transition ${
                      Number(form.taxValue) === val
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {val}{form.taxType === "percentage" ? "%" : " ج.م"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================
            OFFER & DISCOUNT SECTION (العروض والخصومات)
        ======================================================= */}
        <div
          className={`rounded-2xl border transition-all duration-300 p-4 ${
            form.isOffer
              ? "border-amber-400 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white shadow-md shadow-amber-500/10"
              : "border-slate-200 bg-slate-50/60"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-lg">
                🔥
              </span>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  تفعيل عرض / خصم خاص على المنتج
                </h4>
                <p className="text-[11px] font-medium text-slate-500">
                  سيظهر للمستخدم شارة العرض مع شطب السعر القديم وإبراز سعر الخصم
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.isOffer}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const currentBasePrice =
                    Number(form.saleType === "weight" ? form.weightPrice : form.piecePrice) ||
                    Number(form.price) ||
                    0;
                  setForm((prev) => ({
                    ...prev,
                    isOffer: checked,
                    offerPrice:
                      checked && !prev.offerPrice && currentBasePrice > 0
                        ? (currentBasePrice * 0.85).toFixed(2)
                        : prev.offerPrice,
                    discountPercentage:
                      checked && !prev.discountPercentage ? "15" : prev.discountPercentage,
                    offerBadge:
                      checked && !prev.offerBadge ? "عرض خاص 🔥" : prev.offerBadge,
                  }));
                }}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:top-[2px] after:right-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#17656b] peer-checked:after:-translate-x-full peer-focus:outline-none"></div>
            </label>
          </div>

          {form.isOffer && (
            <div className="mt-4 border-t border-amber-200/60 pt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Offer Price Input */}
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-800">
                    سعر العرض (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.offerPrice}
                    onChange={(e) => {
                      const newOfferPrice = e.target.value;
                      const basePrice =
                        Number(form.saleType === "weight" ? form.weightPrice : form.piecePrice) ||
                        Number(form.price) ||
                        0;
                      let discount = form.discountPercentage;
                      if (basePrice > 0 && Number(newOfferPrice) > 0 && Number(newOfferPrice) < basePrice) {
                        discount = Math.round(((basePrice - Number(newOfferPrice)) / basePrice) * 100).toString();
                      }
                      setForm((prev) => ({
                        ...prev,
                        offerPrice: newOfferPrice,
                        discountPercentage: discount,
                      }));
                    }}
                    placeholder="مثال: 75"
                    className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-black text-[#17656b] outline-none transition focus:border-[#17656b] focus:ring-2 focus:ring-[#17656b]/20"
                  />
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-800">
                    نسبة الخصم (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={form.discountPercentage}
                    onChange={(e) => {
                      const newDiscount = e.target.value;
                      const basePrice =
                        Number(form.saleType === "weight" ? form.weightPrice : form.piecePrice) ||
                        Number(form.price) ||
                        0;
                      let computedOfferPrice = form.offerPrice;
                      if (basePrice > 0 && Number(newDiscount) > 0) {
                        computedOfferPrice = (basePrice * (1 - Number(newDiscount) / 100)).toFixed(2);
                      }
                      setForm((prev) => ({
                        ...prev,
                        discountPercentage: newDiscount,
                        offerPrice: computedOfferPrice,
                      }));
                    }}
                    placeholder="مثال: 20"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold outline-none transition focus:border-[#17656b]"
                  />
                </div>

                {/* Offer Badge Text */}
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-800">
                    نص الشارة على المنتج
                  </label>
                  <input
                    type="text"
                    value={form.offerBadge}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, offerBadge: e.target.value }))
                    }
                    placeholder="مثال: عرض خاص 🔥"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold outline-none transition focus:border-[#17656b]"
                  />
                </div>

                {/* Offer Expiration Date */}
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-800">
                    تاريخ انتهاء العرض (اختياري)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.offerExpiresAt}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, offerExpiresAt: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold outline-none transition focus:border-[#17656b]"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/70 bg-amber-100/50 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">معاينة السعر للعميل:</span>
                  <span className="font-semibold text-slate-400 line-through">
                    {(
                      Number(form.saleType === "weight" ? form.weightPrice : form.piecePrice) ||
                      Number(form.price) ||
                      0
                    ).toFixed(2)}{" "}
                    ج.م
                  </span>
                  <span className="text-sm font-black text-red-600">
                    {(Number(form.offerPrice) || 0).toFixed(2)} ج.م
                  </span>
                </div>

                {Number(form.offerPrice) > 0 && (
                  <span className="rounded-lg bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {form.offerBadge || `خصم ${form.discountPercentage || 0}%`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">
            صورة المنتج
          </label>

          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setImageMode("url");
                setImageFile(null);
                setImagePreview("");
              }}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${imageMode === "url"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              رابط الصورة
            </button>

            <button
              type="button"
              onClick={() => {
                setImageMode("file");
                setImagePreview("");
              }}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${imageMode === "file"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              من الجهاز
            </button>
          </div>

          {imageMode === "url" ? (
            <div className="space-y-3">
              <input
                type="text"
                value={form.image}
                onChange={(e) => {
                  const cleaned = cleanImageUrl(e.target.value);
                  setForm((prev) => ({ ...prev, image: cleaned }));
                  if (cleaned && (/^https?:\/\//i.test(cleaned) || cleaned.startsWith("/"))) {
                    setImagePreview(cleaned);
                  }
                }}
                placeholder="الصق رابط الصورة هنا (مثال: https://...)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
              />

              <button
                type="button"
                onClick={() => handleImageUrlPreview()}
                className="rounded-xl bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-100"
              >
                معاينة الصورة
              </button>

              {form.image.includes("google.com/search") && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
                  ⚠️ <strong>تنبيه:</strong> هذا رابط صفحة بحث جوجل وليس رابط الصورة المباشر.
                  <br />
                  💡 <strong>طريقة نسخ رابط الصورة الصحيح:</strong> في جوجل، اضغط مطولاً على الصورة (أو كليك يمين) واختر <u>"نسخ عنوان الصورة / Copy image address"</u> ثم الصقه هنا، أو قم بحفظ الصورة على جهازك واختيارها من تبويب <strong>"من الجهاز"</strong>.
                </div>
              )}

              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                📷 الصق رابط الصورة المباشر ثم اضغط على "معاينة الصورة" للتأكد من ظهورها
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-indigo-300 hover:bg-indigo-50">
              <span className="text-3xl">📷</span>
              <span className="mt-2 text-sm font-black text-slate-700">
                اختر صورة من الجهاز
              </span>
              <span className="mt-1 text-xs text-slate-400">
                JPG, PNG, WEBP — حتى 5MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}

          {imagePreview && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-52 w-full object-contain p-3"
                onError={(e) => {
                  e.currentTarget.src = "/main_logo.png";
                  e.currentTarget.className =
                    "h-52 w-full object-contain p-10";
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductModal;