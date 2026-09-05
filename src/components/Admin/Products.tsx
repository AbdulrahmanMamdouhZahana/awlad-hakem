import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/api";
import { ProductModal } from "../UI";
import ProductCard from "../Products";
import { supabase } from "../../lib/supabase";
import { confirmDelete } from "../../utils/alerts";

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
      "مصر كافيه", "زيت وسمنه", "هيلس", "ايزيس", "مجموعه مقاات", "فاخر",
      "ريحانه", "ايمن افندى", "حبوبه", "بيض شكلاته", "شامبو", "كولا", "فلاش", "بيبسى",
      "لينو", "هديا", "كبيات", "بمبرز", "هاينز", "دريم", "بسكوت", "بطاطس", "ارز", "ريش باك",
      "جلاكسى", "كابرى", "عصير", "المرعي عصير", "حجاره", "اوكسى", "شبسى", "الملكه", "برافو شيبسى",
      "مستخدمات حريمي", "المراعى", "ماكنة حلاق", "دريا", "صوص", "المصريه", "ربيع", "نسكافيه", "AMR",
      "السوبر ماركت", "ماكنة حلاق6974824289153", "مزارع دينا", "فتراك", "مشروب مصرى", "السنبله", "برسيل",
      "كرونا", "بنجور", "نظافه", "البوادى", "اندومي", "شكلاته", "احمدتي", "ملابورو", "شهد", "مستوردات", "سكر",
      "الرشيدي", "بسمه", "ماجى", "كلوركس", "ايس كريم", "اريال", "كيك", "سنبله الفرات", "جبه سايبه", "سديم",
      "كاتل كهراء", "مولتو", "العروسة", "حوا", "بسكويت شاي"], "المكتبة": ["كرسات وكشكيل", "لزق", "وصلات وشوحن",
        "اعياد ميلاد"],


  "المحمصة": ["المقلاة", "بن العروبه", "المناخلي", "هيلس", "فاخر", "ريحانه", "ايمن افندى",
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

// ============================================================
// Helper: Clean and extract real image URL
// (Handles Google Images imgurl params, whitespace, protocol-relative)
// ============================================================
export const cleanAndExtractImageUrl = (url: string): string => {
  let trimmed = String(url ?? "").trim();
  if (!trimmed) return "";

  try {
    // If user copied a Google Images search URL containing imgurl parameter:
    if (trimmed.includes("google.") && trimmed.includes("imgurl=")) {
      const parsed = new URL(trimmed);
      const extracted = parsed.searchParams.get("imgurl");
      if (extracted) return decodeURIComponent(extracted);
    }
    if (trimmed.includes("imgurl=")) {
      const match = trimmed.match(/imgurl=([^&]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }
  } catch {
    // ignore parsing failure and use trimmed
  }

  // Prepend https: to protocol-relative URLs (e.g., //cdn.example.com/...)
  if (trimmed.startsWith("//")) {
    trimmed = `https:${trimmed}`;
  }

  return trimmed;
};

// ============================================================
// Helper: Validate image URLs
// ============================================================
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  const trimmed = cleanAndExtractImageUrl(url);
  if (!trimmed) return false;

  if (trimmed.length > 2048) return false;

  // Local/relative paths
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("products/") ||
    trimmed.startsWith("storage/")
  ) {
    return true;
  }

  // Reject search engine result HTML pages (unless extracted above)
  const searchEnginePages = [
    "google.com/search",
    "google.com/imgres",
    "yahoo.com/search",
    "bing.com/search",
    "duckduckgo.com/",
    "yandex.com/search",
  ];
  if (searchEnginePages.some((engine) => trimmed.includes(engine))) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// ============================================================
// Helper: Get final normalized image URL with safe fallback
// ============================================================
export const normalizeProductImageUrl = (image?: string | null): string => {
  const raw = cleanAndExtractImageUrl(String(image ?? ""));

  if (!raw || raw.startsWith("data:image/") || raw.startsWith("blob:")) {
    return "/main_logo.png";
  }

  // If the database has a search engine webpage URL instead of an image, fallback gracefully
  const searchEnginePages = [
    "google.com/search",
    "google.com/imgres",
    "yahoo.com/search",
    "bing.com/search",
    "duckduckgo.com/",
    "yandex.com/search",
  ];
  if (searchEnginePages.some((engine) => raw.includes(engine))) {
    return "/main_logo.png";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const apiBase = String(
    import.meta.env.VITE_API_URL ||
    "https://awlad-hakem-backend.onrender.com/api"
  )
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");

  if (raw.startsWith("/storage/")) {
    return `${apiBase}${raw}`;
  }

  if (raw.startsWith("storage/")) {
    return `${apiBase}/${raw}`;
  }

  if (raw.startsWith("/")) {
    return `${apiBase}${raw}`;
  }

  if (raw.startsWith("products/")) {
    return `${apiBase}/storage/${raw}`;
  }

  return `${apiBase}/${raw}`;
};

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

  // IMPORTANT:
  // Always reload products from the backend when this page mounts.
  // Do NOT depend on the existing `products` state/localStorage here,
  // otherwise an old product object can survive a browser refresh and
  // hide the latest image saved in the database.
  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);

      const response = await apiFetch("/products");
      const loadedProducts =
        (response?.products ?? response?.data ?? response) as IProduct[];

      if (Array.isArray(loadedProducts)) {
        console.log("🔄 PRODUCTS LOADED FROM BACKEND:", loadedProducts);
        setProducts(loadedProducts);
      } else {
        console.error("❌ INVALID PRODUCTS RESPONSE:", response);
        toast.error("فشل تحميل المنتجات");
      }
    } catch (error) {
      console.error("❌ LOAD PRODUCTS ERROR:", error);
      toast.error(
        error instanceof Error ? error.message : "فشل تحميل المنتجات"
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [setProducts]);

  useEffect(() => {
    // Always fetch the latest database state after refresh/navigation.
    loadProducts();
  }, [loadProducts]);

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
    if (!(file instanceof File)) {
      throw new Error("ملف الصورة غير صحيح");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("الملف المختار ليس صورة");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("حجم الصورة يجب ألا يتجاوز 5MB");
    }

    // =========================================================
    // 1) Primary Strategy: Direct upload to Supabase Storage
    //    (Matches the product-images bucket where existing products live)
    // =========================================================
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

      console.log("📤 UPLOADING TO SUPABASE STORAGE:", fileName);
      const { error: supabaseError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (!supabaseError) {
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          console.log("✅ SUPABASE STORAGE SUCCESS:", urlData.publicUrl);
          return urlData.publicUrl;
        }
      } else {
        console.warn("⚠️ Supabase Storage failed, trying backend upload fallback:", supabaseError);
      }
    } catch (supabaseErr) {
      console.warn("⚠️ Supabase Storage threw error, trying backend fallback:", supabaseErr);
    }

    // =========================================================
    // 2) Fallback Strategy: Backend Laravel upload-image endpoint
    // =========================================================
    const formData = new FormData();
    formData.append("image", file, file.name);

    const tokenKeys = [
      "staff_token",
      "auth_token",
      "token",
      "admin_token",
    ];

    const tokens = tokenKeys
      .map((key) => ({
        key,
        value: localStorage.getItem(key)?.trim() || "",
      }))
      .filter(
        (item, index, array) =>
          item.value &&
          array.findIndex((candidate) => candidate.value === item.value) === index
      );

    const rawApiUrl = String(
      import.meta.env.VITE_API_URL ||
      "https://awlad-hakem-backend.onrender.com/api"
    )
      .trim()
      .replace(/\/+$/, "");

    const apiBase = /\/api$/i.test(rawApiUrl)
      ? rawApiUrl
      : `${rawApiUrl}/api`;

    const uploadUrl = `${apiBase}/products/upload-image`;

    console.log("📤 TRYING BACKEND UPLOAD FALLBACK:", {
      name: file.name,
      uploadUrl,
      tokensAvailable: tokens.length,
    });

    let lastError = "Unauthenticated.";

    for (const candidate of tokens) {
      try {
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${candidate.value}`,
          },
          body: formData,
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.status === 401) {
          lastError = data?.message || "Unauthenticated.";
          continue;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            "فشل رفع الصورة"
          );
        }

        const rawUrl =
          data?.url ??
          data?.data?.url ??
          data?.image_url ??
          data?.data?.image_url ??
          "";

        const url = String(rawUrl).trim();
        if (url) {
          console.log("✅ BACKEND IMAGE URL:", url);
          return url;
        }
      } catch (fetchErr: any) {
        if (fetchErr.message && !fetchErr.message.includes("Unauthenticated")) {
          throw fetchErr;
        }
      }
    }

    throw new Error(
      lastError.includes("Unauthenticated")
        ? "انتهت جلسة تسجيل الدخول للوحة الإدارة. سجّل الدخول مرة أخرى."
        : "فشل رفع الصورة. يرجى المحاولة مرة أخرى."
    );
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

      const normalizedSaleType =
        saleType === "weight" || saleType === "both"
          ? saleType
          : "piece";

      const resolvedUnit =
        String(unit ?? "").trim() ||
        (normalizedSaleType === "weight"
          ? "كيلو"
          : normalizedSaleType === "both"
          ? "قطعة / كيلو"
          : "قطعة");

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

        // =========================================================
        // 1) Upload the selected File first.
        //    We NEVER save blob:/data:image URLs in the database.
        // =========================================================
        if (imageFile instanceof File) {
          const toastId = toast.loading("جاري رفع الصورة...");

          try {
            imageUrl = await uploadImage(imageFile);
          } finally {
            toast.dismiss(toastId);
          }

          console.log("🟢 STEP 1 - IMAGE UPLOADED:", imageUrl);
        } else {
          const rawUrl = cleanAndExtractImageUrl(String(image ?? ""));

          if (rawUrl.startsWith("data:image/")) {
            if (editingProduct?.image) {
              imageUrl = String(editingProduct.image).trim();
            } else {
              throw new Error("اختار صورة من الجهاز لرفعها");
            }
          } else if (rawUrl && !rawUrl.startsWith("blob:")) {
            imageUrl = rawUrl;
          } else if (editingProduct?.image) {
            imageUrl = String(editingProduct.image).trim();
          }
        }

        // =========================================================
        // 2) Validate the final permanent image URL.
        // =========================================================
        if (!imageUrl) {
          throw new Error("اختر صورة للمنتج أو أدخل رابط صورة صحيح");
        }

        if (imageUrl.startsWith("blob:")) {
          throw new Error("الصورة ما زالت محلية ولم يتم رفعها للخادم");
        }

        if (imageUrl.startsWith("data:image/")) {
          throw new Error("لا يمكن حفظ صورة Base64 في قاعدة البيانات");
        }

        if (imageUrl.length > 2048) {
          throw new Error("رابط الصورة طويل جدًا");
        }

        // Validate image URL
        if (!isValidImageUrl(imageUrl)) {
          console.error("❌ INVALID IMAGE URL DETECTED:", {
            imageUrl,
            productName: name,
          });
          throw new Error("رابط الصورة غير صالح. يرجى التأكد من الرابط أو رفع صورة من جهازك.");
        }

        console.log("🟢 STEP 2 - FINAL IMAGE URL:", imageUrl);

        // =========================================================
        // 3) Build the product payload.
        // =========================================================
        const productData = {
          name: name.trim(),
          category,
          price: priceNum,
          unit: resolvedUnit,
          image: imageUrl,
          stock: stockNum,
          sale_type: normalizedSaleType,
          piece_price: piecePriceNum,
          weight_price: weightPriceNum,
        };

        console.log("🟢 STEP 3 - PRODUCT PAYLOAD:", productData);

        // =========================================================
        // 4) Save the product ONLY after image upload succeeds.
        // =========================================================
        if (editingProduct) {
          console.log("🚀 STEP 4 - UPDATE PRODUCT:", editingProduct.id);

          const response = await apiFetch(
            `/products/${editingProduct.id}`,
            {
              method: "PUT",
              body: JSON.stringify(productData),
            }
          );

          console.log("🟢 STEP 5 - UPDATE RESPONSE:", response);

          const updatedProduct =
            (response?.data ?? response?.product ?? response) as IProduct;

          if (!updatedProduct?.id) {
            throw new Error("الخادم لم يرجع بيانات المنتج بعد التعديل");
          }

          // Re-fetch the products list from the backend so the UI is
          // synchronized with the actual database value.
          await loadProducts();

          toast.success("تم تعديل المنتج بنجاح");
        } else {
          console.log("🚀 STEP 4 - CREATE PRODUCT");

          const response = await apiFetch("/products", {
            method: "POST",
            body: JSON.stringify(productData),
          });

          console.log("🟢 STEP 5 - CREATE RESPONSE:", response);

          const newProduct =
            (response?.data ?? response?.product ?? response) as IProduct;

          if (!newProduct?.id) {
            throw new Error("الخادم لم يرجع بيانات المنتج بعد الحفظ");
          }

          // Re-fetch from the backend so the displayed product is
          // exactly what was persisted in the database.
          await loadProducts();

          setCurrentPage(1);
          toast.success("تم إضافة المنتج بنجاح");
        }

        closeModal();
      } catch (error) {
        console.error("PRODUCT SAVE ERROR:", error);
        const msg = error instanceof Error ? error.message : "حدث خطأ أثناء حفظ المنتج";

        if (
          msg.includes("انتهت جلسة") ||
          msg.toLowerCase().includes("unauthenticated") ||
          msg.includes("401")
        ) {
          toast.error("انتهت جلسة لوحة الإدارة! يرجى تسجيل الدخول مرة أخرى لحفظ التعديلات", {
            duration: 6000,
          });
          setTimeout(() => {
            window.location.href = "/admin/login";
          }, 1500);
        } else {
          toast.error(msg);
        }
      } finally {
        setSaving(false);
      }
    },
    [
      editingProduct,
      uploadImage,
      loadProducts,
      setProducts,
      closeModal,
      categoryGroups,
    ]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      const product = products.find((p) => p.id === id);
      if (!product) return;

      const confirmed = await confirmDelete(
        `حذف منتج "${product.name}"`,
        "هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
      );

      if (!confirmed) {
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
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition ${mainCategory === item
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
                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition ${category === item
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
              className={`min-w-[42px] rounded-xl px-3 py-2.5 text-sm font-black transition ${currentPage === page
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

export default Products;