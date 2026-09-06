// src/services/authService.ts

const RAW_API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

const API_URL =
  RAW_API_URL
    .replace(/\/+$/, "")
    .replace(/\/api$/, "") + "/api"

export interface CustomerUser {
  id: number
  name: string
  email: string
  phone?: string | null
  role: string
  is_active: boolean
  email_verified: boolean
  email_verified_at?: string | null
}

export interface CustomerAuthResponse {
  success: boolean
  message?: string
  user?: CustomerUser
}

/**
 * Event name fired whenever customer auth status changes
 */
export const CUSTOMER_AUTH_CHANGED_EVENT = "customer-auth-changed"

/**
 * Notify all components of auth change
 */
export const notifyCustomerAuthChanged = (user: CustomerUser | null) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(CUSTOMER_AUTH_CHANGED_EVENT, { detail: { user } })
    )
  }
}

/**
 * One-time migration/cleanup to purge deprecated plain-text tokens from localStorage.
 * Preserves shopping cart, favorites, and admin caches.
 */
export const cleanupLegacyCustomerTokens = (): void => {
  try {
    if (localStorage.getItem("customer_token")) {
      localStorage.removeItem("customer_token")
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetch current authenticated customer from backend via HttpOnly session cookie
 */
export const getCurrentCustomer = async (): Promise<CustomerUser | null> => {
  try {
    const response = await fetch(`${API_URL}/customer/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })

    if (response.status === 401 || response.status === 403) {
      try {
        localStorage.removeItem("customer_user")
      } catch {}
      return null
    }

    if (!response.ok) {
      return null
    }

    const data = await response.json().catch(() => null)
    const user = data?.user || null
    if (user) {
      try {
        localStorage.setItem("customer_user", JSON.stringify(user))
      } catch {}
    }
    return user
  } catch {
    return null
  }
}

/**
 * Log in customer via Laravel Sanctum session cookie
 */
export const loginCustomer = async (
  login: string,
  password: string
): Promise<CustomerUser> => {
  const response = await fetch(`${API_URL}/customer/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ login, password }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        "البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة."
    )
  }

  if (!data?.user) {
    throw new Error("لم يتم استلام بيانات المستخدم من الخادم.")
  }

  // Purge any lingering customer_token and save user cache
  cleanupLegacyCustomerTokens()
  try {
    localStorage.setItem("customer_user", JSON.stringify(data.user))
  } catch {}

  notifyCustomerAuthChanged(data.user)
  return data.user
}

/**
 * Register a new customer (triggers OTP email)
 */
export const registerCustomer = async (formData: {
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
}) => {
  const response = await fetch(`${API_URL}/customer/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(formData),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors).flat().join(" - ")
        : null) ||
      "فشل إنشاء الحساب."

    throw new Error(errorMsg)
  }

  return data
}

/**
 * Verify customer registration OTP and establish session cookie
 */
export const verifyCustomerEmail = async (
  email: string,
  code: string
): Promise<CustomerUser> => {
  const response = await fetch(`${API_URL}/customer/verify-email`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, code }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || "رمز التحقق غير صحيح.")
  }

  if (!data?.user) {
    throw new Error("تم التحقق ولكن حدث خطأ في استلام بيانات المستخدم.")
  }

  cleanupLegacyCustomerTokens()
  try {
    localStorage.setItem("customer_user", JSON.stringify(data.user))
  } catch {}
  notifyCustomerAuthChanged(data.user)
  return data.user
}

/**
 * Log out customer: terminates Laravel session and clears HttpOnly cookie
 */
export const logoutCustomer = async (): Promise<void> => {
  try {
    await fetch(`${API_URL}/customer/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
  } catch {
    // Ignore network error on logout
  } finally {
    cleanupLegacyCustomerTokens()
    try {
      localStorage.removeItem("customer_user")
    } catch {}
    notifyCustomerAuthChanged(null)
  }
}
