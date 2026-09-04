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

  console.log("========== API REQUEST ==========")
  console.log("RAW_API_URL:", RAW_API_URL)
  console.log("API_URL:", API_URL)
  console.log("FINAL URL:", finalUrl)
  console.log("Endpoint:", endpoint)
  console.log("Token exists:", !!token)
  console.log("Is FormData:", isFormData)
  console.log("=================================")

  try {
    const response = await fetch(finalUrl, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => null)

    console.log("========== API RESPONSE ==========")
    console.log("Status:", response.status)
    console.log("OK:", response.ok)
    console.log("Data:", data)
    console.log("==================================")

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

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error ||
        "حدث خطأ في الاتصال بالخادم"
      )
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