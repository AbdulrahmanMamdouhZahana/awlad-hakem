import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/api";
import { ProductModal } from "../UI";

export interface IProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  stock: number;
  sale_type?: "piece" | "weight" | "both";
  piece_price?: number | null;
  weight_price?: number | null;
  created_at?: string;
}

interface ProductsProps {
  products: IProduct[];
  setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>;
}

export const CATEGORY_GROUPS: Record<string, string[]> = {
  "السوبر ماركت":
    ["فيبا", "تايجر", "غسيل اطباق", "مخلل", "الضحى", "جهينه", "نسله", "مستورد",
      "ونستون", "مستود", "جلاش", "لببتون", "رجب", "بسبوسه", "العاب اطفال كبيره",
      "مصر كافيه",  "زيت وسمنه", "هيلس", "ايزيس", "مجموعه مقاات", "فاخر",
      "ريحانه", "ايمن افندى", "حبوبه", "بيض شكلاته", "شامبو", "كولا", "فلاش", "بيبسى",
      "لينو", "هديا", "كبيات", "بمبرز", "هاينز", "دريم", "بسكوت", "بطاطس", "ارز", "ريش باك",
      "جلاكسى", "كابرى", "عصير", "المرعي عصير", "حجاره", "اوكسى", "شبسى", "الملكه", "برافو شيبسى",
      "مستخدمات حريمي", "المراعى", "ماكنة حلاق", "دريا", "صوص", "المصريه", "ربيع", "نسكافيه", "AMR",
      "السوبر ماركت", "ماكنة حلاق6974824289153", "مزارع دينا", "فتراك", "مشروب مصرى", "السنبله", "برسيل",
      "كرونا", "بنجور", "نظافه", "البوادى", "اندومي", "شكلاته", "احمدتي", "ملابورو", "شهد", "مستوردات", "سكر", 
      "الرشيدي", "بسمه", "ماجى", "كلوركس", "ايس كريم", "اريال", "كيك", "سنبله الفرات", "جبه سايبه", "سديم",
      "كاتل كهراء", "مولتو", "العروسة", "حوا", "بسكويت شاي"], "المكتبة": ["كرسات وكشكيل", "لزق", "وصلات وشوحن",
    "اعياد ميلاد"],
  
  
  "المحمصة": [ "المقلاة", "بن العروبه", "المناخلي", "هيلس", "فاخر", "ريحانه", "ايمن افندى",
      "حبوبه", "فحم", "بن شاهين"]
};

const CATEGORY_STORAGE_KEY = "awlad_hakem_category_groups";

const loadCategoryGroups = (): Record<string, string[]> => {
  try {
    const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!saved) return CATEGORY_GROUPS;
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return CATEGORY_GROUPS;
    return parsed;
  } catch {
    return CATEGORY_GROUPS;
  }
};

const saveCategoryGroups = (groups: Record<string, string[]>) => {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(groups));
};

const getMainCategoryFromGroups = (
  category: string,
  groups: Record<string, string[]>
) => {
  return (
    Object.keys(groups).find((main) => groups[main]?.includes(category)) ??
    "السوبر ماركت"
  );
};

const MAIN_CATEGORIES = Object.keys(CATEGORY_GROUPS);
const PRODUCTS_PER_PAGE = 100;

const getMainCategory = (
  category: string,
  groups: Record<string, string[]> = CATEGORY_GROUPS
) => getMainCategoryFromGroups(category, groups);

const Products = ({ products, setProducts }: ProductsProps) => {
  const [search, setSearch] = useState("");
  const [mainCategory, setMainCategory] = useState("الكل");
  const [category, setCategory] = useState("الكل");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [categoryGroups, setCategoryGroups] =
    useState<Record<string, string[]>>(CATEGORY_GROUPS);

  const mainCategories = useMemo(() => Object.keys(categoryGroups), [categoryGroups]);

  useEffect(() => {
    const savedGroups = loadCategoryGroups();
    setCategoryGroups(savedGroups);
  }, []);

  const availableSubCategories = useMemo(() => {
    if (mainCategory === "الكل") {
      return Array.from(
        new Set(Object.values(categoryGroups).flat())
      );
    }
    return categoryGroups[mainCategory] ?? [];
  }, [mainCategory, categoryGroups]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await apiFetch("/products");
        const loadedProducts =
          (response?.products ?? response?.data ?? response) as IProduct[];

        if (Array.isArray(loadedProducts)) {
          setProducts(loadedProducts);
        } else {
          console.error("Invalid products response:", response);
          toast.error("فشل تحميل المنتجات");
        }
      } catch (error) {
        console.error("LOAD PRODUCTS ERROR:", error);
        toast.error(
          error instanceof Error ? error.message : "فشل تحميل المنتجات"
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    if (products.length === 0) {
      loadProducts();
    }
  }, [setProducts, products.length]);

  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return products.filter((product) => {
      const productName = String(product.name ?? "").toLowerCase();
      const productCategory = String(product.category ?? "");
      const productMainCategory = getMainCategory(productCategory, categoryGroups);

      const matchesSearch =
        !searchValue || productName.includes(searchValue);

      const matchesMainCategory =
        mainCategory === "الكل" ||
        productMainCategory === mainCategory;

      const matchesCategory =
        category === "الكل" ||
        productCategory === category;

      return matchesSearch && matchesMainCategory && matchesCategory;
    });
  }, [products, search, mainCategory, category, categoryGroups]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, mainCategory, category]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(
    () => ({
      total: products.length,
      displayed: filteredProducts.length,
      currentPageCount: paginatedProducts.length,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
      outOfStock: products.filter((p) => p.stock <= 0).length,
    }),
    [products, filteredProducts, paginatedProducts]
  );

  const openAddModal = useCallback(() => {
    setEditingProduct(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((product: IProduct) => {
    setEditingProduct(product);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (!saving) {
      setModalOpen(false);
      setTimeout(() => setEditingProduct(null), 300);
    }
  }, [saving]);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("auth_token");
    const response = await fetch(
     `${import.meta.env.VITE_API_URL}/products/upload-image`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "فشل رفع الصورة");
    }

    const url = data?.url ?? data?.data?.url ?? "";

    if (!url) {
      throw new Error("لم يتم إرجاع رابط الصورة من الخادم");
    }

    return url;
  }, []);

  const handleSaveProduct = useCallback(
    async (formData: any) => {
      const {
        name,
        category,
        mainCategory,
        price,
        unit,
        image,
        stock,
        imageFile,
        saleType,
        piecePrice,
        weightPrice,
      } = formData;

      if (!name.trim()) {
        toast.error("اكتب اسم المنتج");
        return;
      }

      if (!mainCategory || !categoryGroups[mainCategory]) {
        toast.error("اختر القسم الرئيسي");
        return;
      }

      if (!categoryGroups[mainCategory].includes(category)) {
        toast.error("اختر قسمًا فرعيًا صحيحًا");
        return;
      }

      if (!unit.trim()) {
        toast.error("اكتب وحدة المنتج");
        return;
      }

      const normalizedSaleType =
        saleType === "weight" || saleType === "both"
          ? saleType
          : "piece";

      const piecePriceNum =
        piecePrice === "" || piecePrice == null
          ? null
          : Number(piecePrice);

      const weightPriceNum =
        weightPrice === "" || weightPrice == null
          ? null
          : Number(weightPrice);

      if (
        normalizedSaleType !== "weight" &&
        (piecePriceNum === null ||
          Number.isNaN(piecePriceNum) ||
          piecePriceNum < 0)
      ) {
        toast.error("اكتب سعر القطعة بشكل صحيح");
        return;
      }

      if (
        normalizedSaleType !== "piece" &&
        (weightPriceNum === null ||
          Number.isNaN(weightPriceNum) ||
          weightPriceNum < 0)
      ) {
        toast.error("اكتب سعر الكيلو بشكل صحيح");
        return;
      }

      const stockNum = Number(stock);

      if (Number.isNaN(stockNum) || stockNum < 0) {
        toast.error("المخزون غير صحيح");
        return;
      }

      // Keep the old price column compatible with old products/API.
      const priceNum =
        normalizedSaleType === "weight"
          ? weightPriceNum!
          : piecePriceNum!;

      setSaving(true);

      try {
        let imageUrl = "";

        if (imageFile) {
          const toastId = toast.loading("جاري رفع الصورة...");
          try {
            imageUrl = await uploadImage(imageFile);
          } finally {
            toast.dismiss(toastId);
          }
        } else if (image.trim()) {
          imageUrl = image.trim();
        } else if (editingProduct?.image) {
          imageUrl = editingProduct.image;
        }

        if (!imageUrl) {
          toast.error("اختر صورة أو ضع رابط الصورة");
          setSaving(false);
          return;
        }

        // مهم:
        // قاعدة البيانات الحالية عندك فيها category فقط.
        // لذلك نخزن القسم الفرعي في category،
        // والقسم الكبير يتم استنتاجه من CATEGORY_GROUPS.
        const productData = {
          name: name.trim(),
          category,
          price: priceNum,
          unit: unit.trim(),
          image: imageUrl,
          stock: stockNum,

          // New selling system
          sale_type: normalizedSaleType,
          piece_price: piecePriceNum,
          weight_price: weightPriceNum,
        };

        if (editingProduct) {
          const response = await apiFetch(
            `/products/${editingProduct.id}`,
            {
              method: "PUT",
              body: JSON.stringify(productData),
            }
          );

          const updatedProduct =
            (response?.data ?? response?.product ?? response) as IProduct;

          setProducts((prev) =>
            prev.map((p) =>
              p.id === updatedProduct.id ? updatedProduct : p
            )
          );

          toast.success("تم تعديل المنتج بنجاح");
        } else {
          const response = await apiFetch("/products", {
            method: "POST",
            body: JSON.stringify(productData),
          });

          const newProduct =
            (response?.data ?? response?.product ?? response) as IProduct;

          setProducts((prev) => [newProduct, ...prev]);
          setCurrentPage(1);
          toast.success("تم إضافة المنتج بنجاح");
        }

        closeModal();
      } catch (error) {
        console.error("PRODUCT SAVE ERROR:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حفظ المنتج"
        );
      } finally {
        setSaving(false);
      }
    },
    [
      editingProduct,
      uploadImage,
      setProducts,
      closeModal,
      categoryGroups,
    ]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      const product = products.find((p) => p.id === id);
      if (!product) return;

      if (!window.confirm(`هل أنت متأكد من حذف "${product.name}"؟`)) {
        return;
      }

      setDeleting(id);

      try {
        await apiFetch(`/products/${id}`, { method: "DELETE" });

        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("تم حذف المنتج");
      } catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حذف المنتج"
        );
      } finally {
        setDeleting(null);
      }
    },
    [products, setProducts]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, closeModal]);

  const handleMainCategoryChange = (value: string) => {
    setMainCategory(value);
    setCategory("الكل");
  };

  return (
    <>
      <section
        dir="rtl"
        className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8"
      >
        <div className="mx-auto max-w-[1600px]">
          <Header onAddClick={openAddModal} />

          <Filters
            search={search}
            onSearchChange={setSearch}
            mainCategory={mainCategory}
            onMainCategoryChange={handleMainCategoryChange}
            category={category}
            onCategoryChange={setCategory}
            subCategories={availableSubCategories}
            mainCategories={mainCategories}
          />

          <Stats stats={stats} />

          {loadingProducts && products.length === 0 ? (
            <LoadingState />
          ) : filteredProducts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <ProductGrid
                products={paginatedProducts}
                onEdit={openEditModal}
                onDelete={handleDelete}
                deletingId={deleting}
                categoryGroups={categoryGroups}
              />

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalProducts={filteredProducts.length}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </section>

      <ProductModal
        key={editingProduct?.id || "add"}
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
        loading={saving}
        categories={categoryGroups}
        onCategoriesChange={(nextGroups) => {
          setCategoryGroups(nextGroups);
          saveCategoryGroups(nextGroups);
        }}
      />
    </>
  );
};

const Header = ({ onAddClick }: { onAddClick: () => void }) => (
  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-sm font-bold text-indigo-600">إدارة المتجر</p>
      <h1 className="mt-1 text-3xl font-black text-slate-950">المنتجات</h1>
      <p className="mt-1 text-sm font-medium text-slate-500">
        إدارة المنتجات والأسعار والمخزون
      </p>
    </div>

    <button
      type="button"
      onClick={onAddClick}
      className="rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
    >
      + إضافة منتج
    </button>
  </div>
);

const Filters = ({
  search,
  onSearchChange,
  mainCategory,
  onMainCategoryChange,
  category,
  onCategoryChange,
  subCategories,
  mainCategories,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  mainCategory: string;
  onMainCategoryChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  subCategories: string[];
  mainCategories: string[];
}) => (
  <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="ابحث عن منتج..."
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />

      <div>
        <p className="mb-2 text-xs font-black text-slate-500">
          القسم الرئيسي
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["الكل", ...mainCategories].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onMainCategoryChange(item)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                mainCategory === item
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {mainCategory !== "الكل" && (
        <div>
          <p className="mb-2 text-xs font-black text-slate-500">
            القسم الفرعي
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["الكل", ...subCategories].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onCategoryChange(item)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                  category === item
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const Stats = ({
  stats,
}: {
  stats: {
    total: number;
    displayed: number;
    currentPageCount: number;
    lowStock: number;
    outOfStock: number;
  };
}) => (
  <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
    <StatCard label="إجمالي المنتجات" value={stats.total} color="text-slate-950" />
    <StatCard label="نتائج البحث" value={stats.displayed} color="text-indigo-600" />
    <StatCard label="في الصفحة الحالية" value={stats.currentPageCount} color="text-emerald-600" />
    <StatCard label="مخزون منخفض" value={stats.lowStock} color="text-amber-500" />
  </div>
);

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="rounded-3xl border bg-white p-5 shadow-sm">
    <p className="text-xs font-bold text-slate-400">{label}</p>
    <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
  </div>
);

const LoadingState = () => (
  <div className="rounded-3xl border border-slate-200 bg-white py-24 text-center shadow-sm">
    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
    <h3 className="mt-5 text-lg font-black text-slate-800">
      جاري تحميل المنتجات...
    </h3>
    <p className="mt-1 text-sm text-slate-400">برجاء الانتظار</p>
  </div>
);

const EmptyState = () => (
  <div className="rounded-3xl border bg-white py-20 text-center shadow-sm">
    <div className="text-5xl">📦</div>
    <h3 className="mt-4 text-lg font-black text-slate-800">لا توجد منتجات</h3>
    <p className="mt-1 text-sm text-slate-400">
      جرّب تغيير البحث أو القسم
    </p>
  </div>
);

const Pagination = ({
  currentPage,
  totalPages,
  totalProducts,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  onPageChange: (page: number) => void;
}) => {
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const firstItem = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const lastItem = Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts);

  return (
    <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-sm font-bold text-slate-500">
          عرض <span className="font-black text-slate-900">{firstItem}</span> -{" "}
          <span className="font-black text-slate-900">{lastItem}</span> من{" "}
          <span className="font-black text-slate-900">{totalProducts}</span>{" "}
          منتج
        </p>
        <p className="text-sm font-bold text-slate-400">
          الصفحة{" "}
          <span className="font-black text-indigo-600">{currentPage}</span> من{" "}
          <span className="font-black text-indigo-600">{totalPages}</span>
        </p>
      </div>

      <div dir="ltr" className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          السابق
        </button>

        {pages.map((page, index) =>
          page === "..." ? (
            <span
              key={`dots-${index}`}
              className="px-2 font-black text-slate-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`min-w-[42px] rounded-xl px-3 py-2.5 text-sm font-black transition ${
                currentPage === page
                  ? "bg-indigo-600 text-white shadow-md"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          التالي
        </button>
      </div>
    </div>
  );
};

const ProductGrid = ({
  products,
  onEdit,
  onDelete,
  deletingId,
  categoryGroups,
}: {
  products: IProduct[];
  onEdit: (product: IProduct) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
  categoryGroups: Record<string, string[]>;
}) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {products.map((product) => (
      <ProductCard
        key={product.id}
        product={product}
        onEdit={onEdit}
        onDelete={onDelete}
        isDeleting={deletingId === product.id}
        categoryGroups={categoryGroups}
      />
    ))}
  </div>
);

const ProductCard = ({
  product,
  onEdit,
  onDelete,
  isDeleting,
  categoryGroups,
}: {
  product: IProduct;
  onEdit: (product: IProduct) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  categoryGroups: Record<string, string[]>;
}) => {
  const stockStatus =
    product.stock <= 0
      ? { text: "نفد المخزون", className: "bg-red-100 text-red-700" }
      : product.stock <= 10
      ? { text: "مخزون منخفض", className: "bg-amber-100 text-amber-700" }
      : { text: "متوفر", className: "bg-emerald-100 text-emerald-700" };

  const mainCategory = getMainCategory(product.category, categoryGroups);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "/main_logo.png";
            e.currentTarget.className = "h-full w-full object-contain p-10";
          }}
        />

        <span className="absolute right-3 top-3 rounded-full bg-indigo-100 px-3 py-1.5 text-[10px] font-black text-indigo-700">
          {mainCategory}
        </span>

        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black text-slate-600 shadow-sm backdrop-blur">
          {product.category}
        </span>

        <span
          className={`absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-[10px] font-black ${stockStatus.className}`}
        >
          {stockStatus.text}
        </span>
      </div>

      <div className="p-5">
        <h3 className="truncate text-lg font-black text-slate-950">
          {product.name}
        </h3>

        <p className="mt-1 text-sm font-bold text-slate-400">{product.unit}</p>

        <div className="mt-4 flex items-end justify-between">
          <p className="text-2xl font-black text-indigo-600">
            {Number(product.price).toLocaleString("ar-EG")}
            <span className="mr-1 text-xs">ج.م</span>
          </p>

          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400">المخزون</p>
            <p className="text-sm font-black text-slate-800">{product.stock}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="flex-1 rounded-xl border border-indigo-100 bg-indigo-50 py-3 text-xs font-black text-indigo-700 transition hover:bg-indigo-100"
          >
            تعديل
          </button>

          <button
            type="button"
            onClick={() => onDelete(product.id)}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-red-100 bg-red-50 py-3 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {isDeleting ? "جاري..." : "حذف"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default Products;