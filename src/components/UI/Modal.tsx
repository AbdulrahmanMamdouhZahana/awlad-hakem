import type { ReactNode } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  actions?: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
  actions,
  loading = false,
  icon,
  className = "",
}: ModalProps) => {
  const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-6xl",
  };

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel
            dir="rtl"
            className={`w-full ${sizeClasses[size]} overflow-hidden rounded-3xl bg-white text-right shadow-2xl ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div className="flex items-center gap-3">
                {icon && (
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    {icon}
                  </span>
                )}

                <div>
                  {subtitle && (
                    <p className="text-xs font-black text-indigo-600">
                      {subtitle}
                    </p>
                  )}

                  <Dialog.Title
                    as="h2"
                    className="text-xl font-black text-slate-950"
                  >
                    {title}
                  </Dialog.Title>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleClose}
                aria-label="إغلاق"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {children}
            </div>

            {/* Actions */}
            {actions && (
              <div className="border-t border-slate-100 bg-white px-6 py-4">
                {actions}
              </div>
            )}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;