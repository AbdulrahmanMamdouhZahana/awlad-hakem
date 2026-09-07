import { type FormEvent, useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Adjust path as needed
import type { CartItem } from "../App"; // Adjust import path as needed
import { getCurrentCustomer, logoutCustomer, type CustomerUser } from "../services/authService";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EnvelopeIcon,
  ChevronRightIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL;

interface CustomerProfileProps {
  cart?: CartItem[];
  cartCount?: number;
  onAddToCart?: (product: any, options?: any) => void;
  onIncrease?: (productId: number) => void;
  onDecrease?: (productId: number) => void;
  onRemove?: (productId: number) => void;
  onCheckout?: () => void;
  products?: any[];
}

export default function CustomerProfile({
  cart = [],
  cartCount = 0,
  onAddToCart = () => {},
  onIncrease = () => {},
  onDecrease = () => {},
  onRemove = () => {},
  onCheckout = () => {},
  products = [],
}: CustomerProfileProps) {
  const navigate = useNavigate();

  // =====================================
  // STATE
  // =====================================

  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // =====================================
  // AUTH HELPERS (memoized)
  // =====================================

  const logout = useCallback(async () => {
    await logoutCustomer();
    navigate("/customer/login", { replace: true });
  }, [navigate]);

  // =====================================
  // LOAD CUSTOMER
  // =====================================

  const loadCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const user = await getCurrentCustomer();
      if (!user) {
        navigate("/customer/login", { replace: true });
        return;
      }

      setCustomer(user);
      setName(user.name || "");
      setEmail(user.email || "");
      setOriginalEmail(user.email || "");
      setPhone(user.phone || "");
    } catch (error) {
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء تحميل الحساب");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  // =====================================
  // SEND VERIFICATION OTP
  // =====================================

  const sendVerificationOTP = useCallback(
    async (emailToVerify: string) => {
      const response = await fetch(`${API_URL}/customer/verify-email/send`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailToVerify }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        await logout();
        throw new Error("انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.");
      }

      if (!response.ok) {
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            throw new Error(String(firstError[0]));
          }
        }
        throw new Error(data?.message || "فشل إرسال رمز التحقق.");
      }

      return true;
    },
    [logout]
  );

  // =====================================
  // UPDATE PROFILE
  // =====================================

  const updateProfile = useCallback(
    async (profileEmail: string) => {
      const response = await fetch(`${API_URL}/customer/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: profileEmail.trim(),
          phone: phone.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        await logout();
        throw new Error("انتهت جلسة تسجيل الدخول.");
      }

      if (!response.ok) {
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            throw new Error(String(firstError[0]));
          }
        }
        throw new Error(data?.message || "فشل تحديث بيانات الحساب");
      }

      return data;
    },
    [logout, name, phone]
  );

  // =====================================
  // HANDLE PROFILE SUBMIT
  // =====================================

  const handleProfileSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length > 0 && phoneDigits.length !== 11) {
        setPhoneError("رقم الهاتف يجب أن يتكون من 11 رقم");
        return;
      }
      setPhoneError("");

      const newEmail = email.trim().toLowerCase();
      const currentEmail = originalEmail.trim().toLowerCase();
      const emailChanged = newEmail !== currentEmail;

      setSavingProfile(true);
      setProfileMessage("");
      setError("");

      try {
        if (emailChanged) {
          setPendingEmail(newEmail);
          await sendVerificationOTP(newEmail);
          setVerificationCode("");
          setVerificationError("");
          setVerificationSuccess(false);
          setShowVerificationModal(true);
          setProfileMessage("تم إرسال رمز التحقق إلى بريدك الإلكتروني الجديد.");
          return;
        }

        const data = await updateProfile(currentEmail);
        const updatedUser: CustomerUser = data.user;
        setCustomer(updatedUser);
        setName(updatedUser.name || "");
        setEmail(updatedUser.email || "");
        setOriginalEmail(updatedUser.email || "");
        setPhone(updatedUser.phone || "");
        try {
          localStorage.setItem("customer_user", JSON.stringify(updatedUser));
        } catch {}
        window.dispatchEvent(new Event("customer-auth-changed"));
        setProfileMessage("تم تحديث بيانات حسابك بنجاح");
      } catch (error) {
        setError(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث الحساب");
      } finally {
        setSavingProfile(false);
      }
    },
    [phone, email, originalEmail, sendVerificationOTP, updateProfile]
  );

  // =====================================
  // HANDLE VERIFY EMAIL
  // =====================================

  const handleVerifyEmail = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!pendingEmail) {
        setVerificationError("لم يتم تحديد البريد الإلكتروني المطلوب التحقق منه.");
        return;
      }

      if (!/^\d{6}$/.test(verificationCode.trim())) {
        setVerificationError("يرجى إدخال رمز تحقق مكون من 6 أرقام.");
        return;
      }

      setVerificationError("");
      setVerifying(true);

      try {
        const response = await fetch(`${API_URL}/customer/verify-profile-email`, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: pendingEmail,
            code: verificationCode.trim(),
          }),
        });

        const data = await response.json().catch(() => null);

        if (response.status === 401) {
          await logout();
          return;
        }

        if (!response.ok) {
          if (data?.errors) {
            const firstError = Object.values(data.errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              throw new Error(String(firstError[0]));
            }
          }
          throw new Error(data?.message || "رمز التحقق غير صحيح.");
        }

        const updatedUser: CustomerUser = data.user;
        setCustomer(updatedUser);
        setName(updatedUser.name || "");
        setEmail(updatedUser.email || "");
        setOriginalEmail(updatedUser.email || "");
        setPhone(updatedUser.phone || "");
        try {
          localStorage.setItem("customer_user", JSON.stringify(updatedUser));
        } catch {}
        window.dispatchEvent(new Event("customer-auth-changed"));
        setVerificationSuccess(true);
        setProfileMessage("تم تأكيد البريد الإلكتروني وتحديث بيانات الحساب بنجاح");
        setTimeout(() => {
          setShowVerificationModal(false);
          setVerificationSuccess(false);
          setVerificationCode("");
          setPendingEmail(null);
        }, 1800);
      } catch (error) {
        setVerificationError(error instanceof Error ? error.message : "حدث خطأ أثناء التحقق من البريد الإلكتروني.");
      } finally {
        setVerifying(false);
      }
    },
    [pendingEmail, verificationCode, logout]
  );

  // =====================================
  // HANDLE RESEND CODE
  // =====================================

  const handleResendCode = useCallback(async () => {
    if (!pendingEmail) return;

    setResendLoading(true);
    setVerificationError("");

    try {
      await sendVerificationOTP(pendingEmail);
      setVerificationCode("");
      setProfileMessage("تم إعادة إرسال رمز التحقق إلى بريدك الإلكتروني.");
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "حدث خطأ أثناء إعادة إرسال رمز التحقق.");
    } finally {
      setResendLoading(false);
    }
  }, [pendingEmail, sendVerificationOTP]);

  // =====================================
  // HANDLE CLOSE MODAL
  // =====================================

  const handleCloseModal = useCallback(() => {
    setShowVerificationModal(false);
    setVerificationError("");
    setVerificationCode("");
    setPendingEmail(null);
    setEmail(originalEmail);
    setProfileMessage("");
  }, [originalEmail]);

  // =====================================
  // HANDLE PASSWORD SUBMIT
  // =====================================

  const handlePasswordSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      setPasswordMessage("");
      setError("");

      if (password !== passwordConfirmation) {
        setPasswordMessage("كلمة المرور الجديدة غير متطابقة.");
        return;
      }

      if (password.length < 8) {
        setPasswordMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
        return;
      }

      if (password === currentPassword) {
        setPasswordMessage("كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية.");
        return;
      }

      setChangingPassword(true);

      try {
        const response = await fetch(`${API_URL}/customer/profile/password`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: currentPassword,
            password: password,
            password_confirmation: passwordConfirmation,
          }),
        });

        const data = await response.json().catch(() => null);

        if (response.status === 401) {
          await logout();
          return;
        }

        if (!response.ok) {
          if (data?.errors) {
            const firstError = Object.values(data.errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
              throw new Error(String(firstError[0]));
            }
          }
          throw new Error(data?.message || "فشل تغيير كلمة المرور");
        }

        if (data?.user) {
          setCustomer(data.user);
          try {
            localStorage.setItem("customer_user", JSON.stringify(data.user));
          } catch {}
        }

        setCurrentPassword("");
        setPassword("");
        setPasswordConfirmation("");
        setShowCurrentPassword(false);
        setShowPassword(false);
        setShowPasswordConfirmation(false);
        setPasswordMessage("تم تغيير كلمة المرور بنجاح");
        window.dispatchEvent(new Event("customer-auth-changed"));
      } catch (error) {
        setPasswordMessage(error instanceof Error ? error.message : "حدث خطأ أثناء تغيير كلمة المرور");
      } finally {
        setChangingPassword(false);
      }
    },
    [password, passwordConfirmation, currentPassword, logout]
  );

  // =====================================
  // PASSWORD TOGGLE COMPONENT
  // =====================================

  const PasswordToggle = useCallback(
    ({ show, setShow }: { show: boolean; setShow: (value: boolean) => void }) => (
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#17656b] focus:outline-none"
        aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {show ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18 M10.6 10.6 a2 2 0 0 0 2.8 2.8 M9.9 4.3 A10.5 10.5 0 0 1 12 4 c5 0 8.5 4.5 9.5 6 -.4.6-1.2 1.7-2.5 2.8 M6.2 6.2 C4.1 7.6 2.9 9.5 2.5 10 c1 1.5 4.5 6 9.5 6 1 0 2-.2 2.9-.5" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.5 12 C3.5 10.5 7 6 12 6 s8.5 4.5 9.5 6 c-1 1.5-4.5 6-9.5 6 S3.5 13.5 2.5 12Z M12 15 a3 3 0 1 0 0-6 a3 3 0 0 0 0 6Z" />
          </svg>
        )}
      </button>
    ),
    []
  );

  // =====================================
  // HANDLE CHECKOUT FROM NAVBAR
  // =====================================

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    onCheckout();
  }, [cart.length, onCheckout]);

  // =====================================
  // MEMOIZED NAVBAR
  // =====================================

  const navbar = useMemo(
    () => (
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
    ),
    [cartCount, cart, products, onAddToCart, onIncrease, onDecrease, onRemove, handleCheckout]
  );

  // Loading state
  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#17656b]" />
          <p className="mt-4 text-sm font-bold text-slate-500">جاري تحميل بيانات حسابك...</p>
        </div>
      </div>
    );
  }

  // =====================================
  // RENDER
  // =====================================

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* NAVBAR */}
      {navbar}

      {/* PAGE HEADER */}
      <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#17656b] hover:underline"
              >
                <ChevronRightIcon className="h-4 w-4" /> العودة للمتجر
              </Link>

              <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                حسابي
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                أهلاً {customer?.name || "بك"} — إدارة بيانات حسابك الشخصية
              </p>
            </div>

            <div className="flex items-center gap-3">
              {customer?.email_verified === true && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  موثق
                </span>
              )}
              {customer?.email_verified === false && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  غير موثق
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ERROR */}
        {error && (
          <div className="mb-6 inline-flex w-full items-center gap-2 rounded-2xl border border-red-200 bg-red-50/90 px-5 py-4 text-sm font-bold text-red-600 shadow-sm">
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {/* PROFILE MESSAGE */}
        {profileMessage && (
          <div className="mb-6 inline-flex w-full items-center gap-2 rounded-2xl border border-green-200 bg-green-50/90 px-5 py-4 text-sm font-bold text-green-600 shadow-sm">
            <CheckCircleIcon className="h-5 w-5 shrink-0" /> {profileMessage}
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* CUSTOMER INFO CARD */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full" />

            <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#17656b]/10 to-[#17656b]/5 ring-4 ring-white shadow-lg">
              <svg className="h-14 w-14 text-[#17656b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 21v-2 a4 4 0 0 0-4-4H7 a4 4 0 0 0-4 4v2 M9 11 a4 4 0 1 0 0-8 a4 4 0 0 0 0 8Z" />
              </svg>
            </div>

            <div className="relative mt-5 text-center">
              <h2 className="text-xl font-black text-slate-900">{customer?.name}</h2>
              <p className="mt-2 break-all text-sm text-slate-500">{customer?.email}</p>
              {customer?.phone && <p className="mt-1 text-sm text-slate-500"> {customer.phone}</p>}
            </div>

            <div className="relative mt-6 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={logout}
                className="mt-2 w-full rounded-xl px-4 py-3 text-right text-sm font-bold text-red-600 transition hover:bg-red-50"
              >
                 تسجيل الخروج
              </button>
            </div>
          </div>

          {/* PROFILE FORM */}
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900">البيانات الشخصية</h2>
              <p className="mt-1.5 text-sm text-slate-500">عدّل بياناتك الشخصية واحفظ التغييرات.</p>
              {email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() && (
                <div className="mt-3 inline-flex w-full items-center gap-2 rounded-xl bg-amber-50/80 px-4 py-3 text-sm font-bold text-amber-700 border border-amber-200">
                  <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />
                  سيتم إرسال رمز تحقق إلى البريد الإلكتروني الجديد قبل حفظه
                </div>
              )}
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-black text-slate-700">
                  الاسم
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={255}
                  autoComplete="name"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm outline-none transition-all focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/10"
                  placeholder="أدخل اسمك"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-black text-slate-700">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  autoComplete="email"
                  className={`w-full rounded-2xl border-2 px-4 py-3.5 text-sm outline-none transition-all focus:ring-4 ${
                    email.trim().toLowerCase() !== originalEmail.trim().toLowerCase()
                      ? "border-amber-300 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500/10"
                      : "border-slate-200 bg-slate-50/50 focus:border-[#17656b] focus:bg-white focus:ring-[#17656b]/10"
                  }`}
                  placeholder="أدخل بريدك الإلكتروني"
                />
                {email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() && (
                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1.5">
                    <EnvelopeIcon className="h-3.5 w-3.5" /> سيتم إرسال رمز تحقق إلى هذا البريد الإلكتروني
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 flex items-center justify-between text-sm font-black text-slate-700">
                  <span>رقم الهاتف</span>
                  <span className="text-xs font-normal text-slate-400">{phone.replace(/\D/g, "").length}/11</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setPhone(value);
                    setPhoneError(value.length > 0 && value.length !== 11 ? "رقم الهاتف يجب أن يكون 11 رقم" : "");
                  }}
                  maxLength={11}
                  autoComplete="tel"
                  placeholder="مثال: 01012345678"
                  className={`w-full rounded-2xl border-2 px-4 py-3.5 text-sm outline-none transition-all focus:ring-4 ${
                    phoneError
                      ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                      : phone.length === 11
                      ? "border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500/10"
                      : phone.length > 0
                      ? "border-amber-300 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500/10"
                      : "border-slate-200 bg-slate-50/50 focus:border-[#17656b] focus:bg-white focus:ring-[#17656b]/10"
                  }`}
                  dir="ltr"
                />
                {phoneError && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <XCircleIcon className="h-3.5 w-3.5" /> {phoneError}
                  </p>
                )}
                {phone.length === 11 && !phoneError && phone.length > 0 && (
                  <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircleIcon className="h-3.5 w-3.5" /> رقم هاتف صحيح
                  </p>
                )}
                {phone.length > 0 && phone.length < 11 && (
                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5" /> يجب إدخال {11 - phone.length} أرقام إضافية
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={savingProfile || !!phoneError}
                className="group w-full rounded-2xl bg-[#17656b] px-4 py-4 text-sm font-black text-white shadow-lg shadow-[#17656b]/20 transition-all hover:scale-[1.02] hover:shadow-[#17656b]/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {savingProfile ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري حفظ التعديلات...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2"> حفظ التعديلات</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* CHANGE PASSWORD */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900"> تغيير كلمة المرور</h2>
            <p className="mt-1.5 text-sm text-slate-500">يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل.</p>
          </div>

          {passwordMessage && (
            <div
              className={`mb-5 inline-flex w-full items-center gap-2 rounded-2xl border px-5 py-4 text-sm font-bold shadow-sm ${
                passwordMessage.includes("بنجاح")
                  ? "border-green-200 bg-green-50/90 text-green-600"
                  : "border-red-200 bg-red-50/90 text-red-600"
              }`}
            >
              {passwordMessage.includes("بنجاح") ? (
                <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-red-600" />
              )}
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="current_password" className="mb-2 block text-sm font-black text-slate-700">
                كلمة المرور الحالية
              </label>
              <div className="relative">
                <input
                  id="current_password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3.5 pl-12 text-sm outline-none transition-all focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/10"
                  placeholder="••••••••"
                />
                <PasswordToggle show={showCurrentPassword} setShow={setShowCurrentPassword} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-black text-slate-700">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3.5 pl-12 text-sm outline-none transition-all focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/10"
                  placeholder="••••••••"
                />
                <PasswordToggle show={showPassword} setShow={setShowPassword} />
              </div>
            </div>

            <div>
              <label htmlFor="password_confirmation" className="mb-2 block text-sm font-black text-slate-700">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password_confirmation"
                  type={showPasswordConfirmation ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3.5 pl-12 text-sm outline-none transition-all focus:border-[#17656b] focus:bg-white focus:ring-4 focus:ring-[#17656b]/10"
                  placeholder="••••••••"
                />
                <PasswordToggle show={showPasswordConfirmation} setShow={setShowPasswordConfirmation} />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] hover:shadow-slate-900/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {changingPassword ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري تغيير كلمة المرور...
                  </span>
                ) : (
                  "تغيير كلمة المرور"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* =====================================
          VERIFICATION MODAL
      ===================================== */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300">
            <div className="relative bg-gradient-to-br from-[#17656b] to-[#0f4a4f] px-6 py-7 text-center text-white">
              <div className="absolute inset-0 opacity-10 bg-[url('/pattern.svg')]" />
              <div className="relative z-10">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 shadow-inner">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A2 2 0 003.954 4h12.092a2 2 0 001.788.999 2 2 0 000-1.998A2 2 0 0016.046 2H3.954a2 2 0 00-1.788 1 2 2 0 000 2zm11.703 2.267l-5.167 3.19-5.167-3.19A2 2 0 012 7.947V14a2 2 0 002 2h12a2 2 0 002-2V7.948a2 2 0 01-2.13 1.318z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black">تحقق من بريدك الإلكتروني</h2>
                <p className="mt-1.5 text-sm text-white/80">تم إرسال رمز التحقق إلى</p>
                <p className="mt-1 break-all text-sm font-bold text-white bg-white/10 px-4 py-1.5 rounded-full inline-block">
                  {pendingEmail}
                </p>
              </div>
            </div>

            <div className="p-6">
              {verificationSuccess ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-10 w-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-600">تم التحقق بنجاح!</h3>
                  <p className="mt-1.5 text-sm text-slate-500">تم تحديث بريدك الإلكتروني</p>
                </div>
              ) : (
                <>
                  <p className="mb-5 text-center text-sm text-slate-600">
                    أدخل رمز التحقق المكون من 6 أرقام الذي تم إرساله إلى بريدك الإلكتروني الجديد
                  </p>

                  {verificationError && (
                    <div className="mb-4 inline-flex w-full items-center gap-2 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-600">
                      <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                      {verificationError}
                    </div>
                  )}

                  <form onSubmit={handleVerifyEmail} className="space-y-5">
                    <div>
                      <label htmlFor="verification-code" className="mb-2 block text-sm font-black text-slate-700 text-center">
                        رمز التحقق
                      </label>
                      <input
                        id="verification-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="• • • • • •"
                        required
                        maxLength={6}
                        className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-4 text-center text-3xl font-black tracking-[0.75em] text-slate-900 outline-none transition-all placeholder:text-slate-300 placeholder:tracking-normal focus:border-[#17656b] focus:bg-white focus:shadow-[0_0_0_4px_rgba(23,101,107,0.15)]"
                        dir="ltr"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={verifying || verificationCode.length !== 6}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17656b] px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-[#17656b]/30 transition-all hover:scale-[1.02] hover:shadow-[#17656b]/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                      >
                        {verifying ? (
                          <>
                            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            جاري التحقق...
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <CheckIcon className="h-4 w-4" />
                            تحقق
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={verifying}
                        className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>

                  <div className="mt-5 text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendLoading || verifying || !pendingEmail}
                      className="text-sm font-bold text-[#17656b] transition-all hover:text-[#0f4a4f] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resendLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          جاري الإرسال...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <ArrowPathIcon className="h-4 w-4" />
                          إعادة إرسال رمز التحقق
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}