import { supabase } from "../lib/supabase"

// =====================================================
// API CONFIG
// =====================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://awlad-hakem-backend.onrender.com/api"

// =====================================================
// Types
// =====================================================

export interface OrderItemInput {
  productId: number
  productName: string
  price: number
  quantity: number
}

export interface CreateOrderInput {
  customerName: string
  phone: string
  address: string
  notes: string
  paymentMethod: string
  total: number
  latitude: number | null
  longitude: number | null
  items: OrderItemInput[]
  transferImage?: string
  bankAccountId?: number | null
  status?: string
}

// =====================================================
// Create Order
// =====================================================
//
// الطلب بيتعمل من Laravel وليس مباشرة من Supabase.
//
// Laravel بيحدد العميل من:
// Authorization: Bearer customer_token
//
// وبالتالي customer_id لا يأتي من الـ frontend.
// =====================================================

export const createOrder = async (
  order: CreateOrderInput
) => {
  const token = localStorage.getItem("customer_token")

  if (!token) {
    throw new Error(
      "يجب تسجيل الدخول إلى حسابك أولاً لإنشاء الطلب"
    )
  }

  try {
    const response = await fetch(
      `${API_URL}/customer/orders`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          customerName: order.customerName,
          phone: order.phone,
          address: order.address,
          notes: order.notes,
          paymentMethod: order.paymentMethod,
          total: order.total,
          latitude: order.latitude,
          longitude: order.longitude,

          transferImage:
            order.transferImage || null,

          bankAccountId:
            order.bankAccountId || null,

          // الحالة التي تم إرسالها من Checkout
          status:
            order.status || "pending",

          items: order.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error(
        "CREATE ORDER API ERROR:",
        data
      )

      throw new Error(
        data?.message ||
          data?.error ||
          "فشل إنشاء الطلب"
      )
    }

    return data?.order || data
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    )

    throw error
  }
}

// =====================================================
// Get Bank Accounts
// =====================================================

export interface BankAccount {
  id: number
  bank_name: string
  account_name: string
  account_number: string
  account_type: string
  is_active: boolean
  created_at?: string
}

export const getBankAccounts =
  async (): Promise<BankAccount[]> => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("is_active", true)
        .order("bank_name")

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error(
        "GET BANK ACCOUNTS ERROR:",
        error
      )

      return []
    }
  }

// =====================================================
// Upload Transfer Image
// =====================================================

export const uploadTransferImage = async (
  file: File
): Promise<string> => {
  const fileExt =
    file.name.split(".").pop()

  const fileName =
    `transfer_${Date.now()}.${fileExt}`

  const filePath =
    `transfer_images/${fileName}`

  const {
    error: uploadError,
  } = await supabase.storage
    .from("transfer-images")
    .upload(
      filePath,
      file
    )

  if (uploadError) {
    console.error(
      "UPLOAD TRANSFER IMAGE ERROR:",
      uploadError
    )

    throw new Error(
      "فشل رفع صورة التحويل"
    )
  }

  const {
    data: urlData,
  } =
    supabase.storage
      .from("transfer-images")
      .getPublicUrl(filePath)

  return urlData.publicUrl
}

// =====================================================
// Get Order Status Label
// =====================================================

export const getOrderStatusLabel = (
  status: string
): string => {
  const statusMap: Record<
    string,
    string
  > = {
    pending: "قيد الانتظار",
    pending_approval: "قيد مراجعة الدفع",
    confirmed: "تم التأكيد",
    assigned: "تم التعيين",
    out_for_delivery:
      "خارج للتوصيل",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  }

  return (
    statusMap[status] ||
    status
  )
}

// =====================================================
// Get Order Status Color
// =====================================================

export const getOrderStatusColor = (
  status: string
): string => {
  const colorMap: Record<
    string,
    string
  > = {
    pending:
      "bg-amber-100 text-amber-700",

    pending_approval:
      "bg-orange-100 text-orange-700",

    confirmed:
      "bg-emerald-100 text-emerald-700",

    assigned:
      "bg-violet-100 text-violet-700",

    out_for_delivery:
      "bg-blue-100 text-blue-700",

    delivered:
      "bg-green-100 text-green-700",

    cancelled:
      "bg-red-100 text-red-700",
  }

  return (
    colorMap[status] ||
    "bg-slate-100 text-slate-700"
  )
}

// =====================================================
// Get Order Status Emoji
// =====================================================

export const getOrderStatusEmoji = (
  status: string
): string => {
  const emojiMap: Record<
    string,
    string
  > = {
    pending: "⏳",

    pending_approval: "💳",

    confirmed: "✅",

    assigned: "🚚",

    out_for_delivery: "🚚",

    delivered: "📦",

    cancelled: "❌",
  }

  return (
    emojiMap[status] ||
    "📋"
  )
}