import { useEffect, useState } from "react"

import type { Dispatch, SetStateAction } from "react"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"

import ProductCard from "../Products"

import {
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "../../services/productService"

import { supabase } from "../../lib/supabase"
import { apiFetch } from "../../services/api"
import ProductModal from "../UI/ProductModal"

// =====================================================
// Product
// =====================================================

interface iProducts {
  id: number
  name: string
  category: string
  price: number
  unit: string
  image: string
  stock: number
  created_at?: string
}


// =====================================================
// Order
// =====================================================

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  price: number
  quantity: number
  sale_type?: "piece" | "weight"
  weight?: number | null
}

// =====================================================
// Delivery
// =====================================================

interface Delivery {
  id: number
  name: string
  email: string
  phone: string
  password?: string
  role: string
  is_active: boolean
  created_at?: string
  user_id?: string
}

interface BankAccount {
  id: number
  bank_name: string
  account_name: string
  account_number: string
  account_type: string
  is_active: boolean
}

interface Order {
  id: number
  customer_name: string
  phone: string
  address: string
  notes: string
  payment_method: string
  total: number
  status: string
  latitude: number | null
  longitude: number | null
  delivery_id?: number | null
  delivery?: Delivery | null

  bank_account_id?: number | null
  bank_account?: BankAccount | null

  transfer_image?: string | null
  delivery_proof_image?: string | null

  created_at?: string
  updated_at?: string
  assigned_at?: string | null
  picked_up_at?: string | null
  delivered_at?: string | null

  order_items?: OrderItem[]
}


// =====================================================
// Props
// =====================================================

interface IProps {
  products: iProducts[]
  setProducts: Dispatch<SetStateAction<iProducts[]>>
}

const PUBLIC_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]

const sanitizeImageName = (value: string) =>
  value.trim().replace(/[\\/:*?"<>|]+/g, "")

const buildPublicImageCandidates = (value: string) => {
  const cleaned = sanitizeImageName(value)

  if (!cleaned) return []

  const base = `/${encodeURI(cleaned)}`

  return [
    base,
    ...PUBLIC_IMAGE_EXTENSIONS.map(
      (ext) => `${base}${ext}`
    ),
  ]
}

const canLoadImage = (src: string) =>
  new Promise<boolean>((resolve) => {
    const img = new Image()

    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })

const resolveDashboardImageUrl = async (
  name: string,
  imageInput: string
) => {
  const trimmedInput = imageInput.trim()

  if (trimmedInput) {
    if (
      /^(https?:|data:|blob:)/i.test(trimmedInput) ||
      trimmedInput.startsWith("/")
    ) {
      return trimmedInput
    }

    const inputCandidates = buildPublicImageCandidates(
      trimmedInput
    )

    for (const candidate of inputCandidates) {
      if (await canLoadImage(candidate)) {
        return candidate
      }
    }
  }

  const nameCandidates = buildPublicImageCandidates(name)

  for (const candidate of nameCandidates) {
    if (await canLoadImage(candidate)) {
      return candidate
    }
  }

  return ""
}

// =====================================================
// Categories State (for ProductModal)
// =====================================================

// =====================================================
// Dashboard
// =====================================================

const Dashboard = ({
  products,
  setProducts,
}: IProps) => {

  // =====================================================
  // Product State
  // =====================================================

  const [showModal, setShowModal] = useState(false)

  const [savingProduct, setSavingProduct] = useState(false)

  const [editingProduct, setEditingProduct] =
    useState<iProducts | null>(null)

  const [selectedCategory, setSelectedCategory] =
    useState("الكل")

  const [imageFile, setImageFile] =
    useState<File | null>(null)

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "السوبر ماركت",
    price: "",
    unit: "",
    image: "",
    stock: "0",
  })

  // Categories for ProductModal
  const [categories, setCategories] = useState<Record<string, string[]>>({
    "السوبر ماركت": ["السوبر ماركت"],
    "المكتبة": ["المكتبة"],
    "المقلاة": ["المقلاة"],
  })

  // =====================================================
  // Orders State
  // =====================================================

  const [orders, setOrders] = useState<Order[]>([])

  const [ordersLoading, setOrdersLoading] =
    useState(true)

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null)

  const [confirmingOrder, setConfirmingOrder] =
    useState<number | null>(null)
  const [cancellingOrder, setCancellingOrder] =
    useState<number | null>(null)
  const [deliverySelectionOrder, setDeliverySelectionOrder] =
    useState<Order | null>(null)
  const [selectedDeliveryId, setSelectedDeliveryId] =
    useState<number | null>(null)


  // =====================================================
  // Delivery State
  // =====================================================

  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [savingDelivery, setSavingDelivery] = useState(false)
  const [assigningDelivery, setAssigningDelivery] = useState<number | null>(null)
  const [newDelivery, setNewDelivery] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  })


  // =====================================================
  // Categories
  // =====================================================

  const categoryList = [
    "الكل",
    ...new Set(products.map((p) => p.category)),
  ]

  const filteredProducts =
    selectedCategory === "الكل"
      ? products
      : products.filter(
          (p) => p.category === selectedCategory
        )

  // Get only last 4 orders for display
  const recentOrders = orders.slice(0, 4)
  
  // Get only first 6 products for display (or filtered products)
  const displayedProducts = filteredProducts.slice(0, 8)
  const hasMoreProducts = filteredProducts.length > 8


  // =====================================================
  // Load Orders
  // =====================================================

const loadOrders = async () => {
  try {
    setOrdersLoading(true)

    // =========================
    // 1. Get Orders
    // =========================
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (ordersError) throw ordersError

    const ordersList = ordersData ?? []

    // =========================
    // 2. Get Order Items
    // =========================
    let orderItemsList: OrderItem[] = []

    if (ordersList.length > 0) {
      const orderIds = ordersList.map((order) => order.id)

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          order_id,
          product_id,
          product_name,
          price,
          quantity,
          sale_type,
          weight,
          created_at,
          updated_at
        `)
        .in("order_id", orderIds)
        .order("id", { ascending: true })

      if (itemsError) throw itemsError

      orderItemsList = (itemsData ?? []).map((item) => ({
        ...item,
        id: Number(item.id),
        order_id: Number(item.order_id),
        product_id: Number(item.product_id),
        product_name: String(item.product_name ?? ""),
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 0),
        sale_type: item.sale_type === "weight" ? "weight" : "piece",
        weight:
          item.weight !== null && item.weight !== undefined
            ? Number(item.weight)
            : null,
      })) as OrderItem[]
    }

    // =========================
    // 3. Get Deliveries
    // =========================
    const deliveryResponse = await apiFetch("/admin/deliveries")

    const deliveryList: Delivery[] = Array.isArray(deliveryResponse)
      ? deliveryResponse
      : Array.isArray(deliveryResponse?.deliveries)
        ? deliveryResponse.deliveries
        : []

    // =========================
    // 4. Get Bank Accounts
    // =========================
    const { data: bankAccountsData, error: bankAccountsError } = await supabase
      .from("bank_accounts")
      .select(`
        id,
        bank_name,
        account_name,
        account_number,
        account_type,
        is_active
      `)

    if (bankAccountsError) throw bankAccountsError

    const bankAccountList: BankAccount[] = (bankAccountsData ?? []).map((account) => ({
      ...account,
      id: Number(account.id),
    }))

    // =========================
    // 5. Merge Orders + Items
    // =========================
    const mergedOrders: Order[] = ordersList.map((order) => {
      const items = orderItemsList.filter(
        (item) => Number(item.order_id) === Number(order.id)
      )

      return {
        ...order,
        id: Number(order.id),
        total: Number(order.total ?? 0),
        status:
          order.status === "pending_approval"
            ? "pending"
            : order.status,
        order_items: items,
        delivery:
          deliveryList.find(
            (delivery) => Number(delivery.id) === Number(order.delivery_id)
          ) ?? null,
        bank_account:
          bankAccountList.find(
            (account) => Number(account.id) === Number(order.bank_account_id)
          ) ?? null,
      }
    })

    console.log("ORDERS:", mergedOrders)
    console.log("ORDER ITEMS:", orderItemsList)

    setOrders(mergedOrders)
  } catch (error) {
    console.error("LOAD ORDERS ERROR:", error)
    toast.error(
      error instanceof Error
        ? error.message
        : "حدث خطأ أثناء تحميل الطلبات"
    )
  } finally {
    setOrdersLoading(false)
  }
}

  // =====================================================
  // Load Deliveries
  // =====================================================

  const loadDeliveries = async () => {
    try {
      const response = await apiFetch("/admin/deliveries")

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.deliveries)
          ? response.deliveries
          : []

      setDeliveries(list.filter((delivery: Delivery) => delivery.role === "delivery"))
    } catch (error) {
      console.error("LOAD DELIVERIES ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل الدليفري"
      )
    }
  }


  // =====================================================
  // Add Delivery
  // =====================================================

  const handleAddDelivery = async () => {
    const name = newDelivery.name.trim()
    const email = newDelivery.email.trim().toLowerCase()
    const phone = newDelivery.phone.trim()
    const password = newDelivery.password
    const passwordConfirmation = newDelivery.password_confirmation

    if (!name || !email || !phone || !password || !passwordConfirmation) {
      toast.error("من فضلك أكمل جميع بيانات الدليفري")
      return
    }

    if (password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      return
    }

    if (password !== passwordConfirmation) {
      toast.error("كلمة المرور وتأكيدها غير متطابقين")
      return
    }

    try {
      setSavingDelivery(true)

      const response = await apiFetch("/admin/deliveries", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          password_confirmation: passwordConfirmation,
        }),
      })

      const createdDelivery = response?.delivery ?? response

      if (createdDelivery) {
        setDeliveries((prev) => [createdDelivery, ...prev])
      } else {
        await loadDeliveries()
      }

      toast.success("تم إنشاء حساب الدليفري بنجاح")

      setNewDelivery({
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
      })
    } catch (error) {
      console.error("ADD DELIVERY ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إنشاء حساب الدليفري"
      )
    } finally {
      setSavingDelivery(false)
    }
  }


  // =====================================================
  // Delete Delivery
  // =====================================================

  const handleDeleteDelivery = async (deliveryId: number) => {
    const delivery = deliveries.find((d) => d.id === deliveryId)
    if (!delivery) return

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف "${delivery.name}"؟`
    )

    if (!confirmed) return

    try {
      await apiFetch(`/admin/deliveries/${deliveryId}`, {
        method: "DELETE",
      })

      setDeliveries((prev) =>
        prev.filter((d) => d.id !== deliveryId)
      )

      toast.success("تم حذف الدليفري بنجاح")
    } catch (error) {
      console.error("DELETE DELIVERY ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حذف الدليفري"
      )
    }
  }


  // =====================================================
  // Toggle Delivery Status
  // =====================================================

  const handleToggleDeliveryStatus = async (deliveryId: number) => {
    const delivery = deliveries.find((d) => d.id === deliveryId)
    if (!delivery) return

    try {
      const response = await apiFetch(
        `/admin/deliveries/${deliveryId}/toggle`,
        {
          method: "PATCH",
          body: JSON.stringify({
            is_active: !delivery.is_active,
          }),
        }
      )

      const updatedDelivery =
        response?.delivery ?? response

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? updatedDelivery
            : d
        )
      )

      toast.success(
        `تم ${updatedDelivery.is_active ? "تفعيل" : "تعطيل"} الدليفري بنجاح`
      )
    } catch (error) {
      console.error("TOGGLE DELIVERY STATUS ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تغيير حالة الدليفري"
      )
    }
  }


  // =====================================================
  // Assign Delivery to Order
  // =====================================================

const handleAssignDelivery = async (orderId: number, deliveryId: number) => {
    try {
      setAssigningDelivery(orderId)

      const { data, error } = await supabase
        .from("orders")
        .update({ delivery_id: deliveryId })
        .eq("id", orderId)
        .select(`
          *,
          order_items (
            id,
            order_id,
            product_id,
            product_name,
            price,
            quantity,
            sale_type,
            weight,
            created_at,
            updated_at
          )
        `)
        .single()

      if (error) throw error

      const delivery =
        deliveries.find(
          (item) => Number(item.id) === Number(deliveryId)
        ) ?? null

      const updatedOrder: Order = {
        ...data,
        delivery,
      }

      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? updatedOrder : order))
      )

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder)
      }

      return updatedOrder
    } catch (error) {
      console.error("ASSIGN DELIVERY ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تعيين الدليفري"
      )
      return null
    } finally {
      setAssigningDelivery(null)
    }
  }

  
  const openDeliverySelection = (order: Order) => {
    setDeliverySelectionOrder(order)
    setSelectedDeliveryId(order.delivery_id ?? null)
  }

  const normalizeEgyptPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "")

    if (digits.startsWith("20")) return digits
    if (digits.startsWith("0")) return `20${digits.slice(1)}`
    if (digits.startsWith("1") && digits.length === 10) return `20${digits}`

    return digits
  }

const buildDeliveryWhatsAppMessage = (
  order: Order,
  delivery: Delivery
) => {
  const items = (order.order_items ?? [])
    .map(
      (item) =>
        `• ${item.product_name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString("ar-EG")} جنيه`
    )
    .join("\n")

  const location =
    order.latitude !== null &&
    order.longitude !== null
      ? `📍 موقع العميل:\nhttps://www.google.com/maps?q=${order.latitude},${order.longitude}`
      : "📍 موقع العميل: لم يتم تحديد الموقع"

  return [
    "السلام عليكم 👋",
    "",
    "*طلب جديد - أولاد حكيم*",
    `📦 رقم الطلب: #${order.id}`,
    "",
    `👤 العميل: ${order.customer_name}`,
    `📞 رقم العميل: ${order.phone}`,
    `🏠 العنوان: ${order.address}`,
    "",
    location,
    order.notes ? `📝 ملاحظات: ${order.notes}` : "",
    "",
    "🛒 المنتجات:",
    items || "• لا توجد منتجات مسجلة",
    "",
    `💰 الإجمالي: ${Number(order.total).toLocaleString("ar-EG")} جنيه`,
    `💳 طريقة الدفع: ${order.payment_method}`,
    "",
    `🚚 الدليفري المسؤول: ${delivery.name}`,
    "",
    "من فضلك راجع بيانات الطلب وابدأ التوصيل.",
  ]
    .filter(Boolean)
    .join("\n")
}

  const handleConfirmWithDelivery = async () => {
  if (!deliverySelectionOrder) return

  const delivery = deliveries.find(
    (item) => item.id === selectedDeliveryId && item.is_active
  )

  if (!delivery) {
    toast.error("من فضلك اختر دليفري متاح أولاً")
    return
  }

  const whatsappWindow = window.open("about:blank", "_blank")

  try {
    setConfirmingOrder(deliverySelectionOrder.id)

    // تأكيد الطلب + تعيين الدليفري
    const { data, error } = await supabase
      .from("orders")
      .update({
        delivery_id: delivery.id,
        status: "confirmed",
      })
      .eq("id", deliverySelectionOrder.id)
      .select(`
        *,
        order_items (
          id,
          order_id,
          product_id,
          product_name,
          price,
          quantity
        )
      `)
      .single()

    if (error) {
      console.error("SUPABASE CONFIRM ERROR:", error)
      throw error
    }

    if (!data) {
      throw new Error(
        "لم يتم تعديل الطلب. تأكد من صلاحيات Supabase RLS على جدول orders."
      )
    }

    console.log("UPDATED ORDER:", data)

    const confirmedOrder: Order = {
      ...data,
      delivery,
    }

setOrders((prev) =>
  prev.map((order) =>
    order.id === deliverySelectionOrder.id
      ? confirmedOrder
      : order
  )
)

if (selectedOrder?.id === deliverySelectionOrder.id) {
  setSelectedOrder(confirmedOrder)
}

    // =========================
    // WhatsApp
    // =========================

    const whatsappNumber = normalizeEgyptPhone(delivery.phone)

    if (!whatsappNumber) {
      if (whatsappWindow) whatsappWindow.close()

      toast.error("رقم الدليفري غير صحيح لإرسال WhatsApp")
      return
    }

    const message = buildDeliveryWhatsAppMessage(
      confirmedOrder,
      delivery
    )

    const whatsappUrl =
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappUrl
    } else {
      window.location.href = whatsappUrl
    }

    setDeliverySelectionOrder(null)
    setSelectedDeliveryId(null)

    toast.success(
      "تم تأكيد الطلب وتعيين الدليفري وتجهيز رسالة WhatsApp"
    )

  } catch (error) {
    if (whatsappWindow) {
      whatsappWindow.close()
    }

    console.error("CONFIRM ORDER ERROR:", error)

    toast.error(
      error instanceof Error
        ? error.message
        : "حدث خطأ أثناء تأكيد الطلب"
    )

  } finally {
    setConfirmingOrder(null)
  }
}

  // =====================================================
  // Initial Orders Load
  // =====================================================

  useEffect(() => {

    loadOrders()
    loadDeliveries()

  }, [])


  // =====================================================
  // Confirm Order
  // =====================================================

  const handleConfirmOrder = (orderId: number) => {
    const order = orders.find((item) => item.id === orderId)

    if (!order) {
      toast.error("الطلب غير موجود")
      return
    }

    openDeliverySelection(order)
  }


  // =====================================================
  // Cancel Order
  // =====================================================

  const handleCancelOrder = async (orderId: number) => {
    const order = orders.find((item) => item.id === orderId)

    if (!order) {
      toast.error("الطلب غير موجود")
      return
    }

    const isPending = order.status === "pending"
    const isDelivered = order.status === "delivered"

    if (!isPending && !isDelivered) {
      toast.error("يمكن حذف الطلب فقط وهو قيد الانتظار أو بعد إتمام التوصيل")
      return
    }

    const actionText = isDelivered ? "حذف" : "إلغاء وحذف"

    const confirmed = window.confirm(
      `هل أنت متأكد من ${actionText} الطلب #${order.id}؟\nسيتم حذف الطلب نهائيًا ولا يمكن التراجع عنه.`
    )

    if (!confirmed) return

    try {
      setCancellingOrder(orderId)

      // Delete items first, then the order itself.
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId)

      if (itemsError) throw itemsError

      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId)

      if (orderError) throw orderError

      setOrders((prev) => prev.filter((item) => item.id !== orderId))

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null)
      }

      toast.success(`تم ${isDelivered ? "حذف" : "إلغاء وحذف"} الطلب #${orderId} بنجاح`)
    } catch (error) {
      console.error("CANCEL ORDER ERROR:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إلغاء الطلب"
      )
    } finally {
      setCancellingOrder(null)
    }
  }

  // =====================================================
  // Save Product (New Version with categories)
  // =====================================================

  const handleSaveProductWithCategories = async (data: {
    name: string
    mainCategory: string
    category: string
    price: number
    unit: string
    stock: number
    imageFile?: File
    image: string
  }) => {
    try {
      setSavingProduct(true)

      let imageUrl = ""

      // Upload image if file selected
      if (data.imageFile) {
        toast.loading("جاري رفع الصورة...", { id: "upload-image" })
        imageUrl = await uploadProductImage(data.imageFile)
        toast.dismiss("upload-image")
      } else if (data.image.trim()) {
        imageUrl = data.image.trim()
      } else {
        imageUrl = await resolveDashboardImageUrl(data.name, "")
      }

      if (!imageUrl) {
        toast.error("لم أجد صورة مطابقة في public/ أو رابط الصورة غير صحيح")
        return
      }

      const productData = {
        name: data.name.trim(),
        category: data.category, // Use sub-category as the main category field
        price: data.price,
        unit: data.unit.trim(),
        image: imageUrl,
        stock: data.stock,
      }

      if (editingProduct) {
        const updatedProduct = await updateProduct(editingProduct.id, productData)

        setProducts((prev) =>
          prev.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product
          )
        )

        toast.success("تم تعديل المنتج بنجاح")
      } else {
        const product = await addProduct(productData)

        setProducts((prev) => [product, ...prev])

        toast.success("تم إضافة المنتج بنجاح")
      }

      // Reset form
      setEditingProduct(null)
      setShowModal(false)
    } catch (error) {
      console.error("SAVE PRODUCT ERROR:", error)
      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء حفظ المنتج"
      )
    } finally {
      setSavingProduct(false)
    }
  }

  // =====================================================
  // Save Product (Legacy - keep for compatibility)
  // =====================================================

  const handleSaveProduct = async () => {

    if (
      !newProduct.name.trim() ||
      !newProduct.price ||
      !newProduct.unit.trim()
    ) {

      toast.error(
        "من فضلك أكمل بيانات المنتج"
      )

      return
    }


    const price = Number(
      newProduct.price
    )

    const stock = Number(
      newProduct.stock
    )


    if (
      Number.isNaN(price) ||
      price < 0
    ) {

      toast.error(
        "من فضلك أدخل سعر صحيح"
      )

      return
    }


    if (
      Number.isNaN(stock) ||
      stock < 0
    ) {

      toast.error(
        "من فضلك أدخل كمية مخزون صحيحة"
      )

      return
    }


    try {

      setSavingProduct(true)

      let imageUrl = ""


      // Upload image

      if (imageFile) {

        toast.loading(
          "جاري رفع الصورة...",
          {
            id: "upload-image",
          }
        )


        imageUrl =
          await uploadProductImage(
            imageFile
          )


        toast.dismiss(
          "upload-image"
        )

      } else {

        imageUrl =
          await resolveDashboardImageUrl(
            newProduct.name,
            newProduct.image
          )

      }


      if (!imageUrl) {
        toast.error(
          "لم أجد صورة مطابقة في public/ أو رابط الصورة غير صحيح"
        )
        return
      }


      const productData = {
        name:
          newProduct.name.trim(),

        category:
          newProduct.category,

        price,

        unit:
          newProduct.unit.trim(),

        image:
          imageUrl,

        stock,
      }


      // =================================================
      // EDIT
      // =================================================

      if (editingProduct) {

        const updatedProduct =
          await updateProduct(
            editingProduct.id,
            productData
          )


        setProducts((prev) =>
          prev.map((product) =>
            product.id ===
            updatedProduct.id
              ? updatedProduct
              : product
          )
        )


        toast.success(
          "تم تعديل المنتج بنجاح"
        )

      }


      // =================================================
      // ADD
      // =================================================

      else {

        const product =
          await addProduct(
            productData
          )


        setProducts((prev) => [
          product,
          ...prev,
        ])


        toast.success(
          "تم إضافة المنتج بنجاح"
        )
      }


      // Reset

      setNewProduct({
        name: "",
        category:
          "السوبر ماركت",
        price: "",
        unit: "",
        image: "",
        stock: "0",
      })

      setImageFile(null)

      setEditingProduct(null)

      setShowModal(false)

    } catch (error) {

      console.error(
        "SUPABASE SAVE ERROR:",
        error
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حفظ المنتج"
      )

    } finally {

      setSavingProduct(false)

    }
  }


  // =====================================================
  // Delete Product
  // =====================================================

  const handleDeleteProduct = async (
    productId: number
  ) => {

    const product =
      products.find(
        (p) => p.id === productId
      )

    if (!product) return


    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف "${product.name}"؟`
      )


    if (!confirmed) return


    try {

      await deleteProduct(
        productId
      )


      setProducts((prev) =>
        prev.filter(
          (product) =>
            product.id !== productId
        )
      )


      toast.success(
        "تم حذف المنتج بنجاح"
      )

    } catch (error) {

      console.error(
        "SUPABASE DELETE ERROR:",
        error
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حذف المنتج"
      )

    }
  }


  // =====================================================
  // Open Add Modal
  // =====================================================

  const handleOpenModal = () => {

    setEditingProduct(null)

    setImageFile(null)

    setNewProduct({
      name: "",
      category:
        "السوبر ماركت",
      price: "",
      unit: "",
      image: "",
      stock: "0",
    })

    setShowModal(true)
  }


  // =====================================================
  // Open Edit Modal
  // =====================================================

  const handleEditProduct = (
    product: iProducts
  ) => {

    setEditingProduct(product)

    setImageFile(null)

    setNewProduct({
      name: product.name,
      category: product.category,
      price: String(
        product.price
      ),
      unit: product.unit,
      image: product.image,
      stock: String(
        product.stock
      ),
    })

    setShowModal(true)
  }


  // =====================================================
  // Close Modal
  // =====================================================

  const handleCloseModal = () => {

    if (savingProduct) return

    setShowModal(false)

    setEditingProduct(null)

    setImageFile(null)
  }


  // =====================================================
  // Image Select
  // =====================================================

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      e.target.files?.[0]

    if (!file) return


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      toast.error(
        "من فضلك اختر ملف صورة"
      )

      return
    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      toast.error(
        "حجم الصورة يجب ألا يتجاوز 5MB"
      )

      return
    }


    setImageFile(file)


    setNewProduct((prev) => ({
      ...prev,
      image: "",
    }))
  }


  // =====================================================
  // Render - Dashboard content
  // Sidebar and main header are provided by AdminLayout.
  // =====================================================

  return (
      <section dir="rtl" className="min-h-screen bg-[#f7f8fc] text-slate-900">
        <div className="flex min-h-screen">


        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

              {/* Welcome */}
              <div id="overview" className="mb-7">
                <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-900/10 sm:p-8">
                  <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-indigo-100">مرحباً بك 👋</p>
                      <h1 className="text-2xl font-black sm:text-3xl">أهلاً بك في لوحة أولاد حكيم</h1>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
                        تابع الطلبات، أدِر المنتجات، وراقب حالة المتجر من مكان واحد.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                        <p className="text-xs text-indigo-100">المنتجات</p>
                        <p className="mt-1 text-2xl font-black">{products.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                        <p className="text-xs text-indigo-100">الطلبات</p>
                        <p className="mt-1 text-2xl font-black">{orders.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

    

              {/* Orders */}
              <div id="orders" className="mb-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-slate-900">الطلبات</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{orders.length}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">إدارة ومراجعة طلبات العملاء</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={loadOrders} disabled={ordersLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50">
                        <span className={ordersLoading ? "animate-spin" : ""}>↻</span> تحديث الطلبات
                      </button>
                      <Link to="/admin/orders" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500">
                        عرض الكل ←
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {ordersLoading ? (
                    <div className="py-14 text-center">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                      <p className="mt-4 text-sm font-semibold text-slate-500">جاري تحميل الطلبات...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 py-14 text-center">
                      <div className="text-5xl">📋</div>
                      <p className="mt-4 font-bold text-slate-700">لا توجد طلبات حالياً</p>
                      <p className="mt-1 text-sm text-slate-400">الطلبات الجديدة ستظهر هنا تلقائياً.</p>
                    </div>
                  ) : (
                    <div className="grid gap-5 xl:grid-cols-2">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-lg">
                          <div className="border-b border-slate-100 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-black text-slate-900">طلب #{order.id}</h3>
                                  {order.status === "pending" ? (
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">جديد</span>
                                  ) : order.status === "confirmed" ? (
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">مؤكد</span>
                                  ) : order.status === "assigned" ? (
                                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">🚚 تم التعيين</span>
                                  ) : order.status === "delivered" ? (
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">✓ تم التوصيل</span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{order.status}</span>
                                  )}
                                </div>
                                {order.created_at && <p className="mt-1 text-xs text-slate-400">{new Date(order.created_at).toLocaleString("ar-EG")}</p>}
                              </div>
                              <p className="text-lg font-black text-indigo-700">{Number(order.total).toLocaleString("ar-EG")} جنيه</p>
                            </div>
                          </div>

                          <div className="space-y-4 p-5">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-400">العميل</p><p className="mt-1 truncate text-sm font-bold text-slate-800">{order.customer_name}</p></div>
                              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-400">الهاتف</p><p className="mt-1 text-sm font-bold text-slate-800">{order.phone}</p></div>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-semibold text-slate-400">العنوان</p>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{order.address}</p>
                              {order.latitude != null && order.longitude != null && (
                                <a href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-500">📍 فتح الموقع</a>
                              )}
                            </div>

                            <div>
  <p className="mb-2 text-sm font-black text-slate-700">
    🛒 المنتجات
  </p>

  {Array.isArray(order.order_items) &&
  order.order_items.length > 0 ? (
    <div className="space-y-2">
      {order.order_items.map((item) => {
        const price = Number(item.price ?? 0)
        const quantity = Number(item.quantity ?? 0)
        const weight = Number(item.weight ?? 0)

        const itemTotal =
          item.sale_type === "weight"
            ? price * weight
            : price * quantity

        return (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-slate-900">
                  {item.product_name}
                </p>

                <div className="mt-1 text-xs font-bold text-slate-500">
                  {item.sale_type === "weight" ? (
                    <>
                      بالكيلو • الوزن: {weight} كجم • سعر الكيلو:{" "}
                      {price.toLocaleString("ar-EG")} جنيه
                    </>
                  ) : (
                    <>
                      بالقطعة • الكمية: {quantity} • سعر القطعة:{" "}
                      {price.toLocaleString("ar-EG")} جنيه
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-left">
                <p className="text-[11px] font-bold text-slate-400">
                  الإجمالي
                </p>

                <p className="font-black text-indigo-600">
                  {itemTotal.toLocaleString("ar-EG")} جنيه
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  ) : (
    <div className="rounded-xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-400">
      لا توجد منتجات لهذا الطلب
    </div>
  )}
</div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold text-slate-400">💳 الدفع</p>
                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {order.payment_method || "غير محدد"}
                              </p>

                              {order.bank_account && (
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  <div className="rounded-lg bg-white p-2.5">
                                    <p className="text-[10px] font-bold text-slate-400">البنك</p>
                                    <p className="mt-0.5 text-xs font-black text-slate-800">{order.bank_account.bank_name}</p>
                                  </div>
                                  <div className="rounded-lg bg-white p-2.5">
                                    <p className="text-[10px] font-bold text-slate-400">صاحب الحساب</p>
                                    <p className="mt-0.5 text-xs font-black text-slate-800">{order.bank_account.account_name}</p>
                                  </div>
                                  <div className="rounded-lg bg-white p-2.5">
                                    <p className="text-[10px] font-bold text-slate-400">رقم الحساب</p>
                                    <p className="mt-0.5 text-xs font-black text-slate-800">{order.bank_account.account_number}</p>
                                  </div>
                                  <div className="rounded-lg bg-white p-2.5">
                                    <p className="text-[10px] font-bold text-slate-400">نوع الحساب</p>
                                    <p className="mt-0.5 text-xs font-black text-slate-800">{order.bank_account.account_type}</p>
                                  </div>
                                </div>
                              )}

                              {order.transfer_image && (
                                <a
                                  href={order.transfer_image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-3 block overflow-hidden rounded-xl border border-slate-200 bg-white"
                                >
                                  <img
                                    src={order.transfer_image}
                                    alt="صورة تحويل الطلب"
                                    className="max-h-48 w-full object-contain"
                                  />
                                  <span className="block border-t border-slate-100 px-3 py-2 text-center text-xs font-bold text-indigo-600">
                                    فتح صورة التحويل
                                  </span>
                                </a>
                              )}
                            </div>

                            {/* Delivery Section */}
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-indigo-500">🚚 الدليفري</p>
                                  <p className="mt-1 text-sm font-bold text-indigo-900">
                                    {order.delivery?.name || "لم يتم التعيين بعد"}
                                  </p>
                                  {order.delivery?.phone && (
                                    <p className="mt-0.5 text-xs text-indigo-700">
                                      {order.delivery.phone}
                                    </p>
                                  )}
                                </div>

                                {order.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() => openDeliverySelection(order)}
                                    className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 sm:w-52"
                                  >
                                    🚚 اختيار الدليفري
                                  </button>
                                )}
                              </div>
                            </div>

                            {order.notes && <div className="rounded-xl bg-indigo-50 p-3 text-sm"><span className="font-bold text-indigo-700">ملاحظات:</span>{" "}<span className="text-indigo-900">{order.notes}</span></div>}

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-semibold text-slate-400">🕐 إنشاء الطلب</p>
                                <p className="mt-1 text-xs font-bold text-slate-700">
                                  {order.created_at
                                    ? new Date(order.created_at).toLocaleString("ar-EG")
                                    : "غير متوفر"}
                                </p>
                              </div>
                              <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-semibold text-slate-400">🆔 رقم الحساب البنكي</p>
                                <p className="mt-1 text-xs font-bold text-slate-700">
                                  {order.bank_account_id ?? "غير متوفر"}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button type="button" onClick={() =>
                                  setSelectedOrder(order)
                                } className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">عرض التفاصيل</button>
                              {order.status === "pending" && (
                                <>
                                  <button type="button" disabled={confirmingOrder === order.id || cancellingOrder === order.id} onClick={() => handleConfirmOrder(order.id)} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                                    {confirmingOrder === order.id ? "جاري التأكيد..." : "✓ تأكيد الطلب"}
                                  </button>
                                  <button type="button" disabled={confirmingOrder === order.id || cancellingOrder === order.id} onClick={() => handleCancelOrder(order.id)} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60">
                                    {cancellingOrder === order.id ? "جاري الإلغاء..." : "✕ إلغاء الطلب"}
                                  </button>
                                </>
                              )}

                              {order.status === "delivered" && (
                                <button
                                  type="button"
                                  disabled={cancellingOrder === order.id}
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {cancellingOrder === order.id
                                    ? "جاري الحذف..."
                                    : "🗑 حذف الطلب"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {orders.length > 4 && (
                    <div className="mt-6 text-center">
                      <Link to="/admin/orders" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-500">
                        عرض جميع الطلبات ({orders.length})
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Products - Improved with better styling */}
              <div id="products" className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-slate-900">المنتجات</h2>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{products.length}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">إضافة وتعديل وحذف المنتجات وإدارة المخزون</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null)
                          setShowModal(true)
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
                      >
                        <span className="text-lg">+</span> إضافة منتج جديد
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeliveryModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        🚚 إدارة الدليفري
                      </button>
                    </div>
                  </div>

                  {/* Categories Filter */}
                  {products.length > 0 && (
                    <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
                      {categoryList.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                            selectedCategory === category
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {category}
                          {category !== "الكل" && (
                            <span className="mr-1.5 text-xs opacity-70">
                              ({products.filter((p) => p.category === category).length})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  {products.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 py-16 text-center">
                      <div className="text-5xl">📦</div>
                      <p className="mt-4 text-lg font-bold text-slate-700">لا توجد منتجات حالياً</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null)
                          setShowModal(true)
                        }}
                        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-500"
                      >
                        + إضافة أول منتج
                      </button>
                    </div>
                  ) : displayedProducts.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="font-bold text-slate-600">لا توجد منتجات في هذا القسم</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {displayedProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onDelete={handleDeleteProduct}
                            onEdit={handleEditProduct}
                          />
                        ))}
                      </div>
                      {hasMoreProducts && (
                        <div className="mt-8 text-center">
                          <Link
                            to="/admin/products"
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
                          >
                            عرض جميع المنتجات ({filteredProducts.length})
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
        </div>

        {/* =================================================
            Order Details Modal - Same full data as OrderCard
        ================================================= */}

        {selectedOrder && (() => {
          const normalizedStatus = selectedOrder.status

          const isElectronicPayment =
            selectedOrder.payment_method === "الدفع إلكتروني" ||
            Boolean(selectedOrder.transfer_image)

          const formatDate = (date?: string | null) => {
            if (!date) return "غير متوفر"

            const parsed = new Date(date)

            if (Number.isNaN(parsed.getTime())) return "غير متوفر"

            return parsed.toLocaleString("ar-EG", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          }

          const formatMoney = (value: number) =>
            Number(value || 0).toLocaleString("ar-EG")

          const mapsUrl =
            selectedOrder.latitude !== null &&
            selectedOrder.longitude !== null
              ? `https://www.google.com/maps?q=${selectedOrder.latitude},${selectedOrder.longitude}`
              : null

          const statusClass =
            normalizedStatus === "pending"
              ? "bg-amber-100 text-amber-700"
              : normalizedStatus === "confirmed"
                ? "bg-emerald-100 text-emerald-700"
                : normalizedStatus === "delivered"
                  ? "bg-blue-100 text-blue-700"
                  : normalizedStatus === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-700"

          const statusLabel =
            normalizedStatus === "pending"
              ? "🟡 قيد الانتظار"
              : normalizedStatus === "confirmed"
                ? "🟢 مؤكد"
                : normalizedStatus === "delivered"
                  ? "🔵 تم التوصيل"
                  : normalizedStatus === "cancelled"
                    ? "🔴 ملغي"
                    : "غير محدد"

          return (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              dir="rtl"
            >
              <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-slate-900">
                        طلب #{selectedOrder.id}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-black ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      كل تفاصيل الطلب
                    </p>

                    {selectedOrder.created_at && (
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(selectedOrder.created_at)}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-slate-500 transition hover:bg-slate-100"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  {/* Customer */}
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="mb-4 text-base font-black text-slate-800">
                      👤 بيانات العميل
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-bold text-slate-400">
                          اسم العميل
                        </p>
                        <p className="mt-1 break-words text-sm font-black text-slate-800">
                          {selectedOrder.customer_name || "-"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-bold text-slate-400">
                          رقم الهاتف
                        </p>
                        <p className="mt-1 break-words text-sm font-black text-slate-800">
                          {selectedOrder.phone || "-"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2">
                        <p className="text-[11px] font-bold text-slate-400">
                          العنوان
                        </p>
                        <p className="mt-1 break-words text-sm font-black leading-7 text-slate-800">
                          {selectedOrder.address || "-"}
                        </p>
                      </div>
                    </div>

                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-500"
                      >
                        📍 عرض موقع العميل على الخريطة
                      </a>
                    )}

                    {(selectedOrder.latitude !== null ||
                      selectedOrder.longitude !== null) && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-bold text-slate-400">
                            Latitude
                          </p>
                          <p className="mt-1 break-words text-sm font-black text-slate-800">
                            {selectedOrder.latitude !== null
                              ? selectedOrder.latitude
                              : "غير متوفر"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-bold text-slate-400">
                            Longitude
                          </p>
                          <p className="mt-1 break-words text-sm font-black text-slate-800">
                            {selectedOrder.longitude !== null
                              ? selectedOrder.longitude
                              : "غير متوفر"}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Payment */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-base font-black text-slate-800">
                      💳 بيانات الدفع
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-bold text-slate-400">
                          طريقة الدفع
                        </p>
                        <p className="mt-1 break-words text-sm font-black text-slate-800">
                          {selectedOrder.payment_method || "-"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-bold text-slate-400">
                          نوع الدفع
                        </p>
                        <p className="mt-1 break-words text-sm font-black text-slate-800">
                          {isElectronicPayment
                            ? "دفع إلكتروني"
                            : "دفع عند الاستلام"}
                        </p>
                      </div>
                    </div>

                    {isElectronicPayment && selectedOrder.bank_account && (
                      <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                        <h4 className="mb-3 font-black text-indigo-800">
                          🏦 الحساب الذي تم التحويل إليه
                        </h4>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-white px-4 py-3">
                            <p className="text-[11px] font-bold text-slate-400">
                              البنك
                            </p>
                            <p className="mt-1 font-black text-slate-800">
                              {selectedOrder.bank_account.bank_name}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-4 py-3">
                            <p className="text-[11px] font-bold text-slate-400">
                              اسم صاحب الحساب
                            </p>
                            <p className="mt-1 font-black text-slate-800">
                              {selectedOrder.bank_account.account_name}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-4 py-3">
                            <p className="text-[11px] font-bold text-slate-400">
                              رقم الحساب
                            </p>
                            <p className="mt-1 font-black text-slate-800">
                              {selectedOrder.bank_account.account_number}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-4 py-3">
                            <p className="text-[11px] font-bold text-slate-400">
                              نوع الحساب
                            </p>
                            <p className="mt-1 font-black text-slate-800">
                              {selectedOrder.bank_account.account_type}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isElectronicPayment && selectedOrder.transfer_image && (
                      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <h4 className="mb-3 font-black text-emerald-800">
                          🧾 صورة التحويل
                        </h4>

                        <a
                          href={selectedOrder.transfer_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                          <img
                            src={selectedOrder.transfer_image}
                            alt="صورة تحويل الطلب"
                            className="max-h-[450px] w-full object-contain"
                          />
                        </a>

                        <p className="mt-2 text-center text-xs font-bold text-slate-400">
                          اضغط على الصورة لفتحها بالحجم الكامل
                        </p>
                      </div>
                    )}
                  </section>

                  {/* Products */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-800">
                        🛒 المنتجات
                      </h3>

                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                        {selectedOrder.order_items?.length || 0} منتج
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedOrder.order_items &&
                      selectedOrder.order_items.length > 0 ? (
                        selectedOrder.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="font-black text-slate-900">
                                  {item.product_name}
                                </p>

                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
                                  <span>الكمية: {item.quantity}</span>
                                  <span>
                                    سعر الوحدة: {formatMoney(item.price)} ج.م
                                  </span>
                                  <span>رقم المنتج: #{item.product_id}</span>
                                </div>
                              </div>

                              <div className="shrink-0 rounded-xl bg-white px-4 py-2 text-left shadow-sm">
                                <p className="text-[11px] font-bold text-slate-400">
                                  الإجمالي
                                </p>
                                <p className="font-black text-indigo-600">
                                  {formatMoney(item.price * item.quantity)} ج.م
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">
                          لا توجد منتجات مسجلة لهذا الطلب
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Total */}
                  <section className="rounded-2xl bg-indigo-600 p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black">
                        إجمالي الطلب
                      </span>
                      <span className="text-3xl font-black">
                        {formatMoney(selectedOrder.total)} ج.م
                      </span>
                    </div>
                  </section>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                      <h3 className="font-black text-indigo-700">
                        📝 ملاحظات العميل
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-7 text-indigo-950">
                        {selectedOrder.notes}
                      </p>
                    </section>
                  )}

                  {/* Delivery */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-base font-black text-slate-800">
                      🚚 بيانات التوصيل
                    </h3>

                    {selectedOrder.delivery ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-bold text-slate-400">
                            الدليفري
                          </p>
                          <p className="mt-1 font-black text-slate-800">
                            {selectedOrder.delivery.name}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-bold text-slate-400">
                            رقم الدليفري
                          </p>
                          <p className="mt-1 font-black text-slate-800">
                            {selectedOrder.delivery.phone}
                          </p>
                        </div>

                        {selectedOrder.delivery.email && (
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-[11px] font-bold text-slate-400">
                              إيميل الدليفري
                            </p>
                            <p className="mt-1 break-words font-black text-slate-800">
                              {selectedOrder.delivery.email}
                            </p>
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-bold text-slate-400">
                            رقم الدليفري الداخلي
                          </p>
                          <p className="mt-1 font-black text-slate-800">
                            #{selectedOrder.delivery.id}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-400">
                        لم يتم تعيين دليفري لهذا الطلب
                      </div>
                    )}

                    {normalizedStatus === "pending" && (
                      <button
                        type="button"
                        onClick={() => openDeliverySelection(selectedOrder)}
                        className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-500"
                      >
                        🚚 اختيار الدليفري وتأكيد الطلب
                      </button>
                    )}
                  </section>

                  {/* Dates */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-base font-black text-slate-800">
                      🕐 التواريخ
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["تاريخ إنشاء الطلب", selectedOrder.created_at],
                        ["آخر تحديث", selectedOrder.updated_at],
                        ["تم تعيين الدليفري", selectedOrder.assigned_at],
                        ["تم استلام الطلب", selectedOrder.picked_up_at],
                        ["تم التوصيل", selectedOrder.delivered_at],
                      ].map(([label, date]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <p className="text-[11px] font-bold text-slate-400">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-800">
                            {formatDate(date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Delivery Proof */}
                  {selectedOrder.delivery_proof_image && (
                    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                      <h3 className="mb-3 font-black text-blue-800">
                        🧾 إثبات التوصيل
                      </h3>

                      <a
                        href={selectedOrder.delivery_proof_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <img
                          src={selectedOrder.delivery_proof_image}
                          alt="إثبات توصيل الطلب"
                          className="max-h-[450px] w-full object-contain"
                        />
                      </a>
                    </section>
                  )}
                </div>

                {/* Actions */}
                {(normalizedStatus === "pending" ||
                  normalizedStatus === "delivered") && (
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      disabled={
                        confirmingOrder === selectedOrder.id ||
                        cancellingOrder === selectedOrder.id
                      }
                      onClick={() => handleConfirmOrder(selectedOrder.id)}
                      className="flex-1 rounded-xl bg-emerald-600 py-3.5 font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {confirmingOrder === selectedOrder.id
                        ? "جاري التأكيد..."
                        : "✓ تأكيد الطلب"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        confirmingOrder === selectedOrder.id ||
                        cancellingOrder === selectedOrder.id
                      }
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="flex-1 rounded-xl bg-red-600 py-3.5 font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancellingOrder === selectedOrder.id
                        ? "جاري الحذف..."
                        : normalizedStatus === "delivered"
                          ? "🗑 حذف الطلب"
                          : "✕ إلغاء الطلب"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* =================================================
            Confirm + Delivery Selection Modal
        ================================================= */}

        {deliverySelectionOrder && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    تأكيد الطلب #{deliverySelectionOrder.id}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    اختر الدليفري قبل تأكيد الطلب وإرسال بياناته على WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeliverySelectionOrder(null)
                    setSelectedDeliveryId(null)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-slate-500 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-700">
                  العميل: {deliverySelectionOrder.customer_name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  الإجمالي: {Number(deliverySelectionOrder.total).toLocaleString("ar-EG")} جنيه
                </p>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-black text-slate-700">
                  اختر الدليفري
                </label>
                <select
                  value={selectedDeliveryId ?? ""}
                  onChange={(e) => setSelectedDeliveryId(Number(e.target.value) || null)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="">-- اختر الدليفري --</option>
                  {deliveries.filter((d) => d.is_active).map((delivery) => (
                    <option key={delivery.id} value={delivery.id}>
                      {delivery.name} - {delivery.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDeliveryId && (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  {(() => {
                    const delivery = deliveries.find((d) => d.id === selectedDeliveryId)
                    if (!delivery) return null
                    return (
                      <>
                        <p className="font-black text-emerald-800">🚚 {delivery.name}</p>
                        <p className="mt-1 text-sm text-emerald-700">📞 {delivery.phone}</p>
                      </>
                    )
                  })()}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeliverySelectionOrder(null)
                    setSelectedDeliveryId(null)
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!selectedDeliveryId || confirmingOrder === deliverySelectionOrder.id}
                  onClick={handleConfirmWithDelivery}
                  className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirmingOrder === deliverySelectionOrder.id
                    ? "جاري التأكيد..."
                    : "✓ تأكيد وإرسال WhatsApp"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            Delivery Management Modal
        ================================================= */}

        {showDeliveryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl lg:p-8">
              
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">🚚 إدارة الدليفري</h2>
                  <p className="mt-1 text-sm text-slate-500">إضافة وتعديل وحذف مندوبي التوصيل</p>
                </div>
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-2xl text-slate-400 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              {/* Add Delivery Form */}
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 font-bold text-slate-700">➕ إضافة دليفري جديد</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={newDelivery.name}
                    onChange={(e) => setNewDelivery({ ...newDelivery, name: e.target.value })}
                    placeholder="اسم الدليفري *"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500"
                  />
                  <input
                    type="tel"
                    value={newDelivery.phone}
                    onChange={(e) => setNewDelivery({ ...newDelivery, phone: e.target.value })}
                    placeholder="رقم الهاتف *"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    value={newDelivery.email}
                    onChange={(e) =>
                      setNewDelivery({
                        ...newDelivery,
                        email: e.target.value,
                      })
                    }
                    placeholder="البريد الإلكتروني *"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500"
                  />
                  <input
                    type="password"
                    value={newDelivery.password}
                    onChange={(e) =>
                      setNewDelivery({
                        ...newDelivery,
                        password: e.target.value,
                      })
                    }
                    placeholder="كلمة المرور * (8 أحرف على الأقل)"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500"
                  />
                  <input
                    type="password"
                    value={newDelivery.password_confirmation}
                    onChange={(e) =>
                      setNewDelivery({
                        ...newDelivery,
                        password_confirmation: e.target.value,
                      })
                    }
                    placeholder="تأكيد كلمة المرور *"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={handleAddDelivery}
                  disabled={savingDelivery}
                  className="mt-3 w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {savingDelivery ? "⏳ جاري الإضافة..." : "➕ إضافة دليفري"}
                </button>
              </div>

              {/* Deliveries List */}
              <div>
                <h3 className="mb-3 font-bold text-slate-700">📋 قائمة الدليفري</h3>
                {deliveries.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 py-8 text-center">
                    <p className="text-slate-500">لا يوجد مندوبين توصيل حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold">
                            {delivery.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{delivery.name}</p>
                            <p className="text-sm text-slate-500">📱 {delivery.phone}</p>
                            {delivery.email && (
                              <p className="text-xs text-slate-400">📧 {delivery.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              delivery.is_active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {delivery.is_active ? "🟢 نشط" : "🔴 غير نشط"}
                          </span>
                          <button
                            onClick={() => handleToggleDeliveryStatus(delivery.id)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                              delivery.is_active
                                ? "border border-red-200 text-red-600 hover:bg-red-50"
                                : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {delivery.is_active ? "تعطيل" : "تفعيل"}
                          </button>
                          <button
                            onClick={() => handleDeleteDelivery(delivery.id)}
                            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* =================================================
            Product Modal - Using the new ProductModal component
        ================================================= */}

        <ProductModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSave={handleSaveProductWithCategories}
          editingProduct={editingProduct}
          loading={savingProduct}
          categories={categories}
          onCategoriesChange={setCategories}
        />

      </section>
    )
  }

export default Dashboard