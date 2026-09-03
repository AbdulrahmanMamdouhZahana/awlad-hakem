// src/services/api.ts

const API_URL = import.meta.env.VITE_API_URL

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

  // تحديد إذا كان body هو FormData
  const isFormData = options.body instanceof FormData

  // استخدام Headers بدل Record<string, string>
  const headers = new Headers(options.headers)

  headers.set("Accept", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  // لا نضع Content-Type مع FormData
  // لأن browser هو اللي بيحدد multipart/form-data + boundary
  if (!isFormData) {
    headers.set("Content-Type", "application/json")
  }

  console.log("========== API REQUEST ==========")
  console.log("URL:", `${API_URL}${endpoint}`)
  console.log("Endpoint:", endpoint)
  console.log("Token exists:", !!token)
  console.log("Is FormData:", isFormData)
  console.log("=================================")

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  )

  const data = await response
    .json()
    .catch(() => null)

  console.log("========== API RESPONSE ==========")
  console.log("Status:", response.status)
  console.log("OK:", response.ok)
  console.log("Data:", data)
  console.log("==================================")

  // Unauthorized
  if (response.status === 401) {
    if (isCustomerRequest) {
      localStorage.removeItem("customer_token")
      localStorage.removeItem("customer_user")

      window.location.href = "/customer/login"
    } else {
      localStorage.removeItem("staff_token")
      localStorage.removeItem("staff_user")

      window.location.href = "/admin/login"
    }

    throw new Error("انتهت جلسة تسجيل الدخول")
  }

  // Other errors
  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      "حدث خطأ في الاتصال بالخادم"
    )
  }

  return data
}