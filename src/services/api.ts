

const RAW_API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

// Normalize API URL
const API_URL =
  RAW_API_URL
    .replace(/\/+$/, "")
    .replace(/\/api$/, "") + "/api"


// =====================================
// API Fetch
// =====================================

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  // ---------------------------------
  // Normalize endpoint
  // ---------------------------------

  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`


  // ---------------------------------
  // Get Authentication Tokens
  // ---------------------------------

  const staffToken =
    localStorage.getItem("staff_token") ||
    localStorage.getItem("auth_token")

  const customerToken =
    localStorage.getItem("customer_token")


  // ---------------------------------
  // Determine Request Type
  // ---------------------------------

  const isCustomerRequest =
    cleanEndpoint.startsWith("/customer/")


  const token = isCustomerRequest
    ? customerToken
    : staffToken


  // ---------------------------------
  // Prepare Headers
  // ---------------------------------

  const headers = new Headers(options.headers)

  headers.set(
    "Accept",
    "application/json"
  )


  // ---------------------------------
  // Authentication
  // ---------------------------------

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    )
  }


  // ---------------------------------
  // FormData
  // ---------------------------------
  // IMPORTANT:
  // Don't manually set Content-Type
  // for FormData.
  //
  // Browser automatically adds:
  // multipart/form-data + boundary
  // ---------------------------------

  const isFormData =
    options.body instanceof FormData


  if (!isFormData) {
    headers.set(
      "Content-Type",
      "application/json"
    )
  } else {
    headers.delete(
      "Content-Type"
    )
  }


  // ---------------------------------
  // Final URL
  // ---------------------------------

  const finalUrl =
    `${API_URL}${cleanEndpoint}`


  try {

    // ---------------------------------
    // Request
    // ---------------------------------

    const response =
      await fetch(
        finalUrl,
        {
          ...options,
          headers,
        }
      )


    // ---------------------------------
    // Parse Response
    // ---------------------------------

    const data =
      await response
        .json()
        .catch(() => null)


    // ---------------------------------
    // Authentication Endpoint
    // ---------------------------------

    const isAuthEndpoint =
      cleanEndpoint.includes("/login") ||
      cleanEndpoint.includes("/register") ||
      cleanEndpoint.includes("/forgot-password") ||
      cleanEndpoint.includes("/reset-password")


    // =================================
    // 401 Unauthorized
    // =================================

    if (response.status === 401) {

      // Login/Register errors
      // should NOT redirect.
      if (isAuthEndpoint) {

        const errorMsg =
          data?.message ||
          data?.error ||
          (
            data?.errors &&
              typeof data.errors === "object"
              ? Object
                .values(data.errors)
                .flat()
                .join(" - ")
              : null
          ) ||
          "البريد الإلكتروني أو كلمة المرور غير صحيحة"


        throw new Error(errorMsg)
      }


      // ---------------------------------
      // Customer Authentication
      // ---------------------------------

      if (isCustomerRequest) {

        localStorage.removeItem(
          "customer_token"
        )

        localStorage.removeItem(
          "customer_user"
        )


        if (
          window.location.pathname !==
          "/customer/login"
        ) {

          window.location.href =
            "/customer/login"
        }

      }


      // ---------------------------------
      // Staff / Admin Authentication
      // ---------------------------------

      else {

        localStorage.removeItem(
          "staff_token"
        )

        localStorage.removeItem(
          "staff_user"
        )


        localStorage.removeItem(
          "auth_token"
        )

        localStorage.removeItem(
          "auth_user"
        )


        if (
          window.location.pathname !==
          "/admin/login" &&
          window.location.pathname !==
          "/login"
        ) {

          window.location.href =
            "/admin/login"
        }
      }


      throw new Error(
        "انتهت جلسة تسجيل الدخول"
      )
    }


    // =================================
    // Other HTTP Errors
    // =================================

    if (!response.ok) {

      const errorMsg =
        data?.message ||
        data?.error ||
        (
          data?.errors &&
            typeof data.errors === "object"
            ? Object
              .values(data.errors)
              .flat()
              .join(" - ")
            : null
        ) ||
        "حدث خطأ في الاتصال بالخادم"


      throw new Error(errorMsg)
    }


    // =================================
    // Success
    // =================================

    return data


  } catch (error) {

    console.error(
      "❌ API FETCH ERROR:",
      error
    )


    if (
      error instanceof Error
    ) {
      throw error
    }


    throw new Error(
      "حدث خطأ في الاتصال بالخادم"
    )
  }
}
