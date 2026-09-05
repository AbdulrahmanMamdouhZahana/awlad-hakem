// src/services/api.ts

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

const API_URL = RAW_API_URL
  .replace(/\/+$/, "")
  .replace(/\/api$/, "") + "/api"

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const staffToken = localStorage.getItem("staff_token")
  const customerToken = localStorage.getItem("customer_token")

  const isCustomerRequest = endpoint.startsWith("/customer/")

  const token = isCustomerRequest
    ? customerToken
    : staffToken

  const isFormData = options.body instanceof FormData

  const headers = new Headers(options.headers)

  headers.set("Accept", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (!isFormData) {
    headers.set("Content-Type", "application/json")
  }

  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`

  const finalUrl = `${API_URL}${cleanEndpoint}`

  try {
    const response = await fetch(finalUrl, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => null)

    const isAuthEndpoint =
      cleanEndpoint.includes("/login") ||
      cleanEndpoint.includes("/register") ||
      cleanEndpoint.includes("/forgot-password") ||
      cleanEndpoint.includes("/reset-password")

    if (response.status === 401) {
      if (isAuthEndpoint) {
        const errorMsg =
          data?.message ||
          data?.error ||
          (data?.errors && typeof data.errors === "object"
            ? Object.values(data.errors).flat().join(" - ")
            : null) ||
          "البريد الإلكتروني أو كلمة المرور غير صحيحة"

        throw new Error(errorMsg)
      }

      if (isCustomerRequest) {
        localStorage.removeItem("customer_token")
        localStorage.removeItem("customer_user")

        if (window.location.pathname !== "/customer/login") {
          window.location.href = "/customer/login"
        }
      } else {
        localStorage.removeItem("staff_token")
        localStorage.removeItem("staff_user")

        if (
          window.location.pathname !== "/admin/login" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/admin/login"
        }
      }

      throw new Error("انتهت جلسة تسجيل الدخول")
    }

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.error ||
        (data?.errors && typeof data.errors === "object"
          ? Object.values(data.errors).flat().join(" - ")
          : null) ||
        "حدث خطأ في الاتصال بالخادم"

      throw new Error(errorMsg)
    }

    return data

  } catch (error) {
    console.error("❌ API FETCH ERROR:", error)

    if (error instanceof Error) {
      throw error
    }

    throw new Error("حدث خطأ في الاتصال بالخادم")
  }
}