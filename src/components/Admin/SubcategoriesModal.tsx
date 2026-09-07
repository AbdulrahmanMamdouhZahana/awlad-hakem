import React, { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  TagIcon,
  FolderIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  getAdminSubcategories,
  renameSubcategory,
  deleteSubcategory,
  type ISubcategoryItem,
} from "../../services/subcategoryService";

interface SubcategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryGroups: Record<string, string[]>;
  onCategoryGroupsChange: (newGroups: Record<string, string[]>) => void;
  onSubcategoryRenamed?: (oldName: string, newName: string) => void;
  onSubcategoryDeleted?: (name: string) => void;
}

const customSwalClass = {
  popup: "rounded-3xl p-6 border border-slate-100 shadow-2xl font-sans",
  title: "text-lg font-black text-slate-900",
  htmlContainer: "text-sm font-bold text-slate-600",
  confirmButton: "rounded-xl font-black px-6 py-2.5 text-sm shadow-md transition hover:scale-105",
  cancelButton: "rounded-xl font-black px-6 py-2.5 text-sm shadow-sm transition hover:scale-105",
};

export const SubcategoriesModal: React.FC<SubcategoriesModalProps> = ({
  isOpen,
  onClose,
  categoryGroups,
  onCategoryGroupsChange,
  onSubcategoryRenamed,
  onSubcategoryDeleted,
}) => {
  const [subcategories, setSubcategories] = useState<ISubcategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMainCat, setSelectedMainCat] = useState<string>("الكل");

  // Edit subcategory state
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Add new subcategory state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubMainCat, setNewSubMainCat] = useState<string>("");

  const mainCategories = useMemo(() => Object.keys(categoryGroups), [categoryGroups]);

  // Load subcategories from API
  const fetchSubcategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminSubcategories();
      setSubcategories(data);
    } catch (error) {
      console.error("Failed to load subcategories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSubcategories();
      if (mainCategories.length > 0 && !newSubMainCat) {
        setNewSubMainCat(mainCategories[0]);
      }
    }
  }, [isOpen, fetchSubcategories, mainCategories, newSubMainCat]);

  // Map subcategory to its main category
  const getSubcategoryMainCategory = useCallback(
    (subName: string): string => {
      for (const [main, subs] of Object.entries(categoryGroups)) {
        if (subs.includes(subName)) {
          return main;
        }
      }
      return "السوبر ماركت";
    },
    [categoryGroups]
  );

  // Combine database subcategories with local category groups subcategories
  const allSubcategoryNames = useMemo(() => {
    const namesSet = new Set<string>();
    subcategories.forEach((s) => namesSet.add(s.category));
    Object.values(categoryGroups).flat().forEach((s) => namesSet.add(s));
    return Array.from(namesSet);
  }, [subcategories, categoryGroups]);

  // Filtered subcategories
  const filteredSubcategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSubcategoryNames
      .filter((subName) => {
        const matchesSearch = !q || subName.toLowerCase().includes(q);
        const subMain = getSubcategoryMainCategory(subName);
        const matchesMain = selectedMainCat === "الكل" || subMain === selectedMainCat;
        return matchesSearch && matchesMain;
      })
      .map((subName) => {
        const found = subcategories.find((s) => s.category === subName);
        return {
          category: subName,
          products_count: found ? found.products_count : 0,
          mainCategory: getSubcategoryMainCategory(subName),
        };
      })
      .sort((a, b) => b.products_count - a.products_count || a.category.localeCompare(b.category));
  }, [allSubcategoryNames, search, selectedMainCat, subcategories, getSubcategoryMainCategory]);

  // Open Edit inline modal
  const handleStartEdit = (subName: string) => {
    setEditingSub(subName);
    setEditNameValue(subName);
  };

  // Submit Rename
  const handleSaveRename = async () => {
    if (!editingSub) return;
    const trimmedNew = editNameValue.trim();

    if (!trimmedNew) {
      await Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "اسم القسم الفرعي مطلوب ولا يمكن أن يكون فارغاً.",
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
        customClass: customSwalClass,
      });
      return;
    }

    if (trimmedNew === editingSub) {
      setEditingSub(null);
      return;
    }

    // Check if new name already exists
    if (allSubcategoryNames.includes(trimmedNew)) {
      const confirmMerge = await Swal.fire({
        title: "القسم موجود بالفعل",
        text: `القسم "${trimmedNew}" موجود بالفعل. هل تريد دمج المنتجات في هذا القسم؟`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#64748b",
        confirmButtonText: "نعم، دمج",
        cancelButtonText: "إلغاء",
        reverseButtons: true,
        customClass: customSwalClass,
      });

      if (!confirmMerge.isConfirmed) {
        return;
      }
    }

    try {
      setSavingEdit(true);
      const res = await renameSubcategory(editingSub, trimmedNew);

      // Update local state
      const oldSub = editingSub;
      setSubcategories((prev) =>
        prev.map((s) =>
          s.category === oldSub ? { ...s, category: trimmedNew } : s
        )
      );

      // Update categoryGroups
      const nextGroups: Record<string, string[]> = {};
      for (const [main, subs] of Object.entries(categoryGroups)) {
        nextGroups[main] = subs.map((s) => (s === oldSub ? trimmedNew : s));
      }
      onCategoryGroupsChange(nextGroups);

      // Notify parent
      onSubcategoryRenamed?.(oldSub, trimmedNew);

      setEditingSub(null);

      await Swal.fire({
        icon: "success",
        title: "تم التعديل بنجاح",
        text: `تم تغيير اسم القسم إلى "${trimmedNew}" وتحديث ${res.affected_products ?? 0} منتج.`,
        timer: 2000,
        showConfirmButton: false,
        customClass: customSwalClass,
      });

      await fetchSubcategories();
    } catch (error) {
      console.error("Rename subcategory error:", error);
      await Swal.fire({
        icon: "error",
        title: "فشل التعديل",
        text: error instanceof Error ? error.message : "حدث خطأ أثناء تعديل القسم الفرعي",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "حسناً",
        customClass: customSwalClass,
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete subcategory
  const handleDeleteSubcategory = async (subName: string, count: number) => {
    if (count > 0) {
      await Swal.fire({
        icon: "error",
        title: "لا يمكن حذف القسم الفرعي",
        html: `القسم الفرعي <b>"${subName}"</b> مرتبط حالياً بـ <b>${count}</b> منتج في المتجر.<br><br>لحماية بيانات المتجر، يرجى نقل أو تعديل المنتجات المرتبطة به أولاً قبل حذفه.`,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "حسناً، فهمت",
        customClass: customSwalClass,
      });
      return;
    }

    const confirmRes = await Swal.fire({
      title: `حذف القسم الفرعي "${subName}"`,
      text: "هل أنت متأكد من حذف هذا القسم الفرعي؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "نعم، حذف",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      customClass: customSwalClass,
    });

    if (!confirmRes.isConfirmed) {
      return;
    }

    try {
      await deleteSubcategory(subName);

      // Update state
      setSubcategories((prev) => prev.filter((s) => s.category !== subName));

      // Remove from categoryGroups
      const nextGroups: Record<string, string[]> = {};
      for (const [main, subs] of Object.entries(categoryGroups)) {
        nextGroups[main] = subs.filter((s) => s !== subName);
      }
      onCategoryGroupsChange(nextGroups);

      onSubcategoryDeleted?.(subName);

      await Swal.fire({
        icon: "success",
        title: "تم الحذف",
        text: `تم حذف القسم الفرعي "${subName}" بنجاح.`,
        timer: 1800,
        showConfirmButton: false,
        customClass: customSwalClass,
      });

      await fetchSubcategories();
    } catch (error) {
      console.error("Delete subcategory error:", error);
      await Swal.fire({
        icon: "error",
        title: "تعذر الحذف",
        text: error instanceof Error ? error.message : "حدث خطأ أثناء محاولة حذف القسم الفرعي",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "حسناً",
        customClass: customSwalClass,
      });
    }
  };

  // Add new subcategory
  const handleAddNewSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubName.trim();
    if (!trimmed) {
      await Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "اكتب اسم القسم الفرعي الجديد.",
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
        customClass: customSwalClass,
      });
      return;
    }

    const targetMain = newSubMainCat || mainCategories[0] || "السوبر ماركت";

    const currentSubs = categoryGroups[targetMain] ?? [];
    if (currentSubs.includes(trimmed)) {
      await Swal.fire({
        icon: "warning",
        title: "موجود بالفعل",
        text: `القسم الفرعي "${trimmed}" موجود بالفعل داخل "${targetMain}".`,
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
        customClass: customSwalClass,
      });
      return;
    }

    const nextGroups = {
      ...categoryGroups,
      [targetMain]: [...currentSubs, trimmed],
    };

    onCategoryGroupsChange(nextGroups);
    setNewSubName("");
    setShowAddForm(false);

    await Swal.fire({
      icon: "success",
      title: "تمت الإضافة",
      text: `تم إضافة القسم الفرعي "${trimmed}" بنجاح.`,
      timer: 1800,
      showConfirmButton: false,
      customClass: customSwalClass,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 shadow-sm">
              <FolderIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                إدارة الأقسام الفرعية
              </h2>
              <p className="text-xs font-bold text-slate-500">
                عرض وتعديل وحذف الأقسام الفرعية ومتابعة عدد المنتجات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/70 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            aria-label="إغلاق"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="border-b border-slate-100 p-4 sm:px-6 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن قسم فرعي..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-9 text-xs sm:text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchSubcategories}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              title="تحديث القائمة"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            {/* Add Subcategory Toggle */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              <span>إضافة قسم فرعي</span>
            </button>
          </div>

          {/* Main Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold shrink-0">القسم الرئيسي:</span>
            {["الكل", ...mainCategories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedMainCat(cat)}
                className={`shrink-0 rounded-lg px-3 py-1.5 font-bold transition ${
                  selectedMainCat === cat
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Add Form (Collapsible) */}
          {showAddForm && (
            <form
              onSubmit={handleAddNewSubcategory}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl bg-indigo-50/60 p-3 border border-indigo-100 animate-fadeIn"
            >
              <select
                value={newSubMainCat}
                onChange={(e) => setNewSubMainCat(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                {mainCategories.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="اسم القسم الفرعي الجديد..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Subcategories List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 bg-slate-50/50">
          {loading && subcategories.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
              <p className="mt-3 text-xs font-bold text-slate-500">
                جاري تحميل الأقسام الفرعية...
              </p>
            </div>
          ) : filteredSubcategories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
              <TagIcon className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-slate-700">
                لا توجد أقسام فرعية مطابقة
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                جرّب البحث باسم آخر أو اختر قسماً رئيسياً مختلفاً
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubcategories.map((sub) => {
                const isEditingThis = editingSub === sub.category;

                return (
                  <div
                    key={sub.category}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md hover:border-slate-300"
                  >
                    {isEditingThis ? (
                      /* Inline Edit Form */
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          className="w-full rounded-xl border border-indigo-400 bg-white px-3 py-2 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename();
                            if (e.key === "Escape") setEditingSub(null);
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleSaveRename}
                            disabled={savingEdit}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>حفظ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSub(null)}
                            disabled={savingEdit}
                            className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Card */
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4
                              className="text-sm font-black text-slate-900 truncate"
                              title={sub.category}
                            >
                              {sub.category}
                            </h4>
                            <span className="mt-1 inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {sub.mainCategory}
                            </span>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                              sub.products_count > 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {sub.products_count} منتج
                          </span>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(sub.category)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200"
                            title="تعديل اسم القسم الفرعي"
                          >
                            <PencilSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>تعديل</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSubcategory(sub.category, sub.products_count)
                            }
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition border ${
                              sub.products_count > 0
                                ? "bg-slate-50 text-slate-400 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            }`}
                            title={
                              sub.products_count > 0
                                ? "مرتبط بمنتجات (لا يمكن الحذف)"
                                : "حذف القسم الفرعي"
                            }
                          >
                            <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3.5 sm:px-6 text-xs text-slate-500 font-bold">
          <div>
            إجمالي الأقسام الفرعية المعروضة:{" "}
            <span className="text-slate-900 font-black">
              {filteredSubcategories.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-5 py-2 font-black text-slate-800 transition hover:bg-slate-300"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubcategoriesModal;
