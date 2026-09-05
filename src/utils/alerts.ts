import Swal from "sweetalert2";

/**
 * إعدادات أساسية موحدة لـ SweetAlert2 لتناسب هوية وتصميم الموقع ودعم RTL
 */
const customClass = {
  popup: "rounded-3xl p-6 border border-slate-100 shadow-2xl font-sans",
  title: "text-lg font-black text-slate-900",
  htmlContainer: "text-sm font-bold text-slate-500",
  confirmButton: "rounded-xl font-black px-6 py-2.5 text-sm shadow-md transition hover:scale-105",
  cancelButton: "rounded-xl font-black px-6 py-2.5 text-sm shadow-sm transition hover:scale-105",
  input: "rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500",
};

/**
 * نافذة تأكيد حذف (تحذير باللون الأحمر)
 */
export const confirmDelete = async (
  title: string,
  text: string = "لا يمكن التراجع عن هذه العملية بعد إتمامها.",
  confirmText: string = "نعم، حذف"
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: confirmText,
    cancelButtonText: "إلغاء",
    reverseButtons: true,
    customClass,
  });

  return Boolean(result.isConfirmed);
};

/**
 * نافذة تأكيد إجراء عام (سؤال / تنبيه)
 */
export const confirmAction = async (
  title: string,
  text: string = "",
  options?: {
    confirmText?: string;
    cancelText?: string;
    icon?: "question" | "warning" | "info";
    confirmColor?: string;
  }
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: options?.icon || "question",
    showCancelButton: true,
    confirmButtonColor: options?.confirmColor || "#4f46e5",
    cancelButtonColor: "#64748b",
    confirmButtonText: options?.confirmText || "نعم، تأكيد",
    cancelButtonText: options?.cancelText || "إلغاء",
    reverseButtons: true,
    customClass,
  });

  return Boolean(result.isConfirmed);
};

/**
 * نافذة إدخال نص (بديل احترافي لـ window.prompt)
 */
export const promptText = async (
  title: string,
  placeholder: string = "اكتب هنا...",
  validator?: (value: string) => string | null
): Promise<string | null> => {
  const result = await Swal.fire({
    title,
    input: "text",
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonColor: "#4f46e5",
    cancelButtonColor: "#64748b",
    confirmButtonText: "تأكيد",
    cancelButtonText: "إلغاء",
    reverseButtons: true,
    customClass,
    inputValidator: (value) => {
      const trimmed = value?.trim();
      if (!trimmed) {
        return "هذا الحقل مطلوب!";
      }
      if (validator) {
        const error = validator(trimmed);
        if (error) return error;
      }
      return null;
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value.trim();
  }

  return null;
};

/**
 * نافذة نجاح (Success Modal)
 */
export const showSuccess = async (
  title: string,
  text: string = "",
  timer: number = 2200
): Promise<void> => {
  await Swal.fire({
    icon: "success",
    title,
    text,
    timer,
    showConfirmButton: timer <= 0,
    confirmButtonColor: "#4f46e5",
    confirmButtonText: "تم",
    customClass,
  });
};

/**
 * نافذة خطأ (Error Modal)
 */
export const showError = async (
  title: string,
  text: string = ""
): Promise<void> => {
  await Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "حسناً",
    customClass,
  });
};

/**
 * نافذة تنبيه (Warning Modal)
 */
export const showWarning = async (
  title: string,
  text: string = ""
): Promise<void> => {
  await Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonColor: "#f59e0b",
    confirmButtonText: "حسناً",
    customClass,
  });
};

export default Swal;
