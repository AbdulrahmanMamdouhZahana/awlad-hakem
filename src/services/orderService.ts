import { supabase } from "../lib/supabase"

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
}

export const createOrder = async (
  order: CreateOrderInput
) => {

  // =========================
  // Create Order
  // =========================

  const { data: orderData, error: orderError } =
    await supabase
      .from("orders")
     .insert({
  customer_name: order.customerName,
  phone: order.phone,
  address: order.address,
  notes: order.notes,
  payment_method: order.paymentMethod,
  total: order.total,
  latitude: order.latitude,
  longitude: order.longitude,
  status: "pending",
})
      .select()
      .single()


  if (orderError) {
    console.error("CREATE ORDER ERROR:", orderError)
    throw orderError
  }


  // =========================
  // Create Order Items
  // =========================

  const items = order.items.map((item) => ({
    order_id: orderData.id,
    product_id: item.productId,
    product_name: item.productName,
    price: item.price,
    quantity: item.quantity,
  }))


  const { error: itemsError } =
    await supabase
      .from("order_items")
      .insert(items)


  if (itemsError) {

    console.error(
      "CREATE ORDER ITEMS ERROR:",
      itemsError
    )

    // Rollback order if items failed
    await supabase
      .from("orders")
      .delete()
      .eq("id", orderData.id)

    throw itemsError
  }


  return orderData
}