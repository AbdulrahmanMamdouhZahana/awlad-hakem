import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

// const API_URL = import.meta.env.VITE_API_URL;
import { apiFetch } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // const response = await fetch(`${API_URL}/staff/login`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Accept: "application/json",
      //   },
      //   body: JSON.stringify({
      //     login: login.trim(),
      //     password,
      //   }),
      // });

      // const data = await response.json().catch(() => ({}));

      // // ==========================================
      // // LOGIN ERROR
      // // ==========================================

      // if (!response.ok) {
      //   throw new Error(
      //     data.message ||
      //       "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      //   );
      // }

      // // ==========================================
      // // CHECK TOKEN
      // // ==========================================

      // if (!data.token) {
      //   throw new Error(
      //     "لم يتم استلام رمز تسجيل الدخول من السيرفر"
      //   );
      // }



      const data = await apiFetch("/staff/login", {
  method: "POST",
  body: JSON.stringify({
    login: login.trim(),
    password,
  }),
});
      // ==========================================
      // CHECK USER
      // ==========================================

      if (!data.user) {
        throw new Error(
          "لم يتم استلام بيانات المستخدم من السيرفر"
        );
      }

      // ==========================================
      // GET ROLE
      // ==========================================

      const role = data.user.role;

      console.log("LOGIN USER:", data.user);
      console.log("LOGIN ROLE:", role);

      // ==========================================
      // ONLY ADMIN + DELIVERY
      // ==========================================

      if (role !== "admin" && role !== "delivery") {
        throw new Error(
          "نوع الحساب غير مسموح له بالدخول إلى لوحة التحكم"
        );
      }

      // ==========================================
      // SAVE STAFF AUTH
      // ==========================================

      localStorage.setItem(
        "staff_token",
        data.token
      );

      localStorage.setItem(
        "staff_user",
        JSON.stringify(data.user)
      );

      // ==========================================
      // REMOVE OLD AUTH
      // ==========================================

      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");

      // ==========================================
      // REDIRECT BASED ON ROLE
      // ==========================================

      if (role === "admin") {
        navigate("/admin", {
          replace: true,
        });
      }

      if (role === "delivery") {
        navigate("/delivery", {
          replace: true,
        });
      }
    } catch (error) {
      console.error("STAFF LOGIN ERROR:", error);

      // Clear authentication if something went wrong
      localStorage.removeItem("staff_token");
      localStorage.removeItem("staff_user");

      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تسجيل الدخول"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-3xl bg-white p-8 shadow-2xl">

          {/* Logo */}
          <div className="mb-8 text-center">

            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-lg">
              <img
                src="/main_logo.png"
                alt="أولاد حكيم"
                className="h-20 w-20 object-contain"
              />
            </div>

            <h1 className="text-2xl font-black text-slate-900">
              أولاد حكيم
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              تسجيل الدخول إلى لوحة التحكم
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email / Phone */}
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                البريد الإلكتروني أو رقم الهاتف
              </label>

              <input
                type="text"
                value={login}
                onChange={(e) =>
                  setLogin(e.target.value)
                }
                placeholder="admin@awlad-hakem.com أو 01012345678"
                required
                autoComplete="username"
                className="
                  w-full
                  rounded-xl
                  border border-slate-200
                  bg-slate-50
                  px-4 py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-indigo-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-indigo-100
                "
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">
                كلمة المرور
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="
                  w-full
                  rounded-xl
                  border border-slate-200
                  bg-slate-50
                  px-4 py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-indigo-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-indigo-100
                "
              />
            </div>

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                rounded-xl
                bg-indigo-600
                px-4 py-3
                text-sm
                font-black
                text-white
                shadow-lg
                shadow-indigo-100
                transition
                hover:bg-indigo-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading
                ? "جاري تسجيل الدخول..."
                : "تسجيل الدخول"}
            </button>

          </form>

        </div>

        <p className="mt-5 text-center text-xs font-medium text-slate-400">
          لوحة تحكم أولاد حكيم
        </p>

      </div>
    </div>
  );
}