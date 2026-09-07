import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

  // Real Edit Modal State
  const [editingTarget, setEditingTarget] = useState<ISubcategoryItem | null>(null);
  const [editNewName, setEditNewName] = useState("");
  const [editMainCat, setEditMainCat] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

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
      return mainCategories[0] || "السوبر ماركت";
    },
    [categoryGroups, mainCategories]
  );

  // Combine database subcategories with local category groups subcategories
  const allSubcategoryNames = useMemo(() => {
    const namesSet = new Set<string>();
    subcategories.forEach((s) => {
      if (s.category && s.category.trim()) namesSet.add(s.category.trim());
    });
    Object.values(categoryGroups).flat().forEach((s) => {
      if (s && s.trim()) namesSet.add(s.trim());
    });
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

  // Open real Edit Modal
  const handleOpenEditModal = (item: { category: string; products_count: number; mainCategory: string }) => {
    setEditingTarget({ category: item.category, products_count: item.products_count });
    setEditNewName(item.category);
    setEditMainCat(item.mainCategory);
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 100);
  };

  const handleCloseEditModal = () => {
    if (savingEdit) return;
    setEditingTarget(null);
    setEditNewName("");
    setEditMainCat("");
  };

  // Submit Rename via Real Modal
  const handleSaveEditModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingTarget) return;

    const oldName = editingTarget.category;
    const trimmedNew = editNewName.trim();

    // 1. Validation: Required & Trim
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

    // If only changing main category (name remained the same)
    if (trimmedNew === oldName) {
      const currentMain = getSubcategoryMainCategory(oldName);
      if (editMainCat && editMainCat !== currentMain) {
        // Move to new main category
        const nextGroups: Record<string, string[]> = {};
        for (const [main, subs] of Object.entries(categoryGroups)) {
          nextGroups[main] = subs.filter((s) => s !== oldName);
        }
        nextGroups[editMainCat] = [...(nextGroups[editMainCat] || []), oldName];
        onCategoryGroupsChange(nextGroups);
        await Swal.fire({
          icon: "success",
          title: "تم تحديث التصنيف",
          text: `تم نقل القسم الفرعي "${oldName}" إلى تصنيف "${editMainCat}".`,
          timer: 1800,
          showConfirmButton: false,
          customClass: customSwalClass,
        });
      }
      handleCloseEditModal();
      return;
    }

    // 2. Duplicate validation check
    if (allSubcategoryNames.includes(trimmedNew)) {
      const confirmMerge = await Swal.fire({
        title: "القسم موجود بالفعل",
        text: `القسم "${trimmedNew}" موجود بالفعل. هل تريد دمج منتجات "${oldName}" داخل هذا القسم؟`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#64748b",
        confirmButtonText: "نعم، دمج المنتجات",
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
      const res = await renameSubcategory(oldName, trimmedNew);

      // Update subcategories state
      setSubcategories((prev) =>
        prev.map((s) =>
          s.category === oldName ? { ...s, category: trimmedNew } : s
        )
      );

      // Update categoryGroups
      const targetMain = editMainCat || getSubcategoryMainCategory(oldName);
      const nextGroups: Record<string, string[]> = {};
      for (const [main, subs] of Object.entries(categoryGroups)) {
        // remove oldName from everywhere
        nextGroups[main] = subs.filter((s) => s !== oldName && s !== trimmedNew);
      }
      // Add trimmedNew into targetMain
      nextGroups[targetMain] = [...(nextGroups[targetMain] || []), trimmedNew];
      onCategoryGroupsChange(nextGroups);

      // Notify parent
      onSubcategoryRenamed?.(oldName, trimmedNew);

      handleCloseEditModal();

      await Swal.fire({
        icon: "success",
        title: "تم التعديل بنجاح",
        text: `تم تغيير اسم القسم إلى "${trimmedNew}" وتحديث ${res.affected_products ?? 0} منتج مرتبط.`,
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

  // Delete subcategory with protection
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
      text: "هل أنت متأكد من حذف هذا القسم الفرعي نهائياً؟",
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
      text: `تم إضافة القسم الفرعي "${trimmed}" داخل "${targetMain}" بنجاح.`,
      timer: 1800,
      showConfirmButton: false,
      customClass: customSwalClass,
    });
  };

  if (!isOpen) return null;

  return (
    <>
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
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-right text-xs sm:text-sm">

                <thead className="bg-slate-50/90 text-slate-700 font-black">
                  <tr>
                    <th scope="col" className="py-3 px-4 sm:px-6">
                      القسم الرئيسي
                    </th>
                    <th scope="col" className="py-3 px-4 sm:px-6">
                      القسم الفرعي
                    </th>
                    <th scope="col" className="py-3 px-4 sm:px-6 text-center">
                      عدد المنتجات
                    </th>
                    <th scope="col" className="py-3 px-4 sm:px-6 text-center">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-bold">
                  {filteredSubcategories.map((sub) => (
                    <tr
                      key={sub.category}
                      className="transition hover:bg-slate-50/80"
                    >
                      {/* Main Category */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
                          <FolderIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{sub.mainCategory}</span>
                        </span>
                      </td>

                      {/* Subcategory Name */}
                      <td className="py-3.5 px-4 sm:px-6 text-slate-900 font-black whitespace-nowrap">
                        {sub.category}
                      </td>

                      {/* Products Count */}
                      <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-black ${
                            sub.products_count > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {sub.products_count} منتج
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(sub)}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200"
                            title="تعديل اسم القسم الفرعي"
                          >
                            <PencilSquareIcon className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
                            <span>تعديل</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSubcategory(sub.category, sub.products_count)
                            }
                            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black transition border ${
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* ============================================================ */}
      {/* REAL DEDICATED EDIT SUBCATEGORY MODAL */}
      {/* ============================================================ */}
      {editingTarget && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingEdit) handleCloseEditModal();
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    تعديل القسم الفرعي
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    تحديث الاسم ينعكس تلقائياً على كافة المنتجات المرتبطة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={savingEdit}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditModal} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  الاسم الحالي:
                </label>
                <div className="rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-600 border border-slate-200">
                  {editingTarget.category}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  الاسم الجديد <span className="text-red-500">*</span>:
                </label>
                <input
                  ref={editInputRef}
                  type="text"
                  value={editNewName}
                  onChange={(e) => setEditNewName(e.target.value)}
                  placeholder="اكتب الاسم الجديد..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  القسم الرئيسي التابع له:
                </label>
                <select
                  value={editMainCat}
                  onChange={(e) => setEditMainCat(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                >
                  {mainCategories.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status info */}
              <div className="rounded-xl bg-indigo-50/70 p-3 border border-indigo-100 text-xs text-indigo-700 font-bold flex items-center justify-between">
                <span>المنتجات المرتبطة بهذا القسم:</span>
                <span className="font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[11px]">
                  {editingTarget.products_count} منتج
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={savingEdit}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>حفظ التعديلات</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SubcategoriesModal;
