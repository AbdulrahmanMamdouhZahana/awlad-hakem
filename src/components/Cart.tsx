// src/components/Cart.tsx

import { Link } from "react-router-dom"

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

interface CartItem {
  product: iProducts
  quantity: number
}

interface IProps {
  cart: CartItem[]
  onIncrease: (productId: number) => void
  onDecrease: (productId: number) => void
  onRemove: (productId: number) => void
  onClose: () => void
  onCheckout: () => void

  // dropdown from navbar
  mode?: "dropdown" | "page"
}

const Cart = ({
  cart,
  onIncrease,
  onDecrease,
  onRemove,
  onClose,
  onCheckout,
  mode = "page",
}: IProps) => {

  const total = cart.reduce((sum, item) => {
    if (item.product.stock <= 0) return sum

    return (
      sum +
      item.product.price * item.quantity
    )
  }, 0)

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  const hasUnavailableItems = cart.some(
    (item) => item.product.stock <= 0
  )

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (cart.length === 0) {

    if (mode === "dropdown") {
      return (
        <div
          dir="rtl"
          className="
            absolute
            right-0
            top-full
            z-[200]
            mt-3
            w-[340px]
            max-w-[calc(100vw-2rem)]
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-2xl
          "
        >

          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">
              سلة المشتريات
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-slate-700
              "
            >
              ✕
            </button>
          </div>

          <div className="py-8 text-center">

            <div
              className="
                mx-auto
                mb-3
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-indigo-50
                text-2xl
              "
            >
              🛒
            </div>

            <p className="text-sm font-bold text-slate-800">
              السلة فارغة
            </p>

            <p className="mt-1 text-xs text-slate-400">
              لم تضف أي منتجات بعد
            </p>

          </div>

          <Link
            to="/products"
            onClick={onClose}
            className="
              block
              w-full
              rounded-xl
              bg-indigo-600
              py-3
              text-center
              text-sm
              font-black
              text-white
              transition
              hover:bg-indigo-700
            "
          >
            تصفح المنتجات
          </Link>

        </div>
      )
    }

    // ===================================================
    // EMPTY FULL PAGE
    // ===================================================

    return (
      <div
        dir="rtl"
        className="
          min-h-screen
          bg-slate-50
          px-4
          py-10
          sm:px-6
          lg:px-8
        "
      >

        <div className="mx-auto max-w-6xl">

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-8
              shadow-sm
            "
          >

            <h1 className="text-2xl font-black text-slate-900">
              سلة المشتريات
            </h1>

            <div className="flex flex-col items-center justify-center py-20">

              <div
                className="
                  mb-5
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-100
                  text-3xl
                "
              >
                🛒
              </div>

              <h2 className="text-lg font-black text-slate-900">
                السلة فارغة
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                لم تقم بإضافة أي منتجات إلى السلة.
              </p>

              <Link
                to="/products"
                className="
                  mt-6
                  rounded-xl
                  bg-indigo-600
                  px-6
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-indigo-700
                "
              >
                تصفح المنتجات
              </Link>

            </div>

          </div>

        </div>

      </div>
    )
  }

  // =====================================================
  // DROPDOWN CART
  // =====================================================

  if (mode === "dropdown") {

    return (
      <div
        dir="rtl"
        className="
          absolute
          sm-100
          md:right-100
          lg:right-140
          top-full
          z-[200]
          mt-3
          w-[390px]
          max-w-[calc(100vw-2rem)]
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >

        {/* Header */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-5
            py-4
          "
        >

          <div>

            <h3 className="text-base font-black text-slate-900">
              سلة المشتريات
            </h3>

            <p className="mt-0.5 text-xs text-slate-400">
              {totalItems} منتجات
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
          >
            ✕
          </button>

        </div>

        {/* Products */}

        <div className="max-h-[360px] overflow-y-auto">

          {cart.map((item) => {

            const unavailable =
              item.product.stock <= 0

            const subtotal =
              unavailable
                ? 0
                : item.product.price * item.quantity

            return (
              <div
                key={item.product.id}
                className="
                  flex
                  gap-3
                  border-b
                  border-slate-100
                  px-5
                  py-4
                "
              >

                {/* Image */}

                <div
                  className="
                    h-16
                    w-16
                    shrink-0
                    overflow-hidden
                    rounded-xl
                    bg-slate-100
                  "
                >

                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className={`
                      h-full
                      w-full
                      object-contain
                      ${unavailable ? "opacity-50 grayscale" : ""}
                    `}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/100x100?text=Product"
                    }}
                  />

                </div>

                {/* Info */}

                <div className="min-w-0 flex-1">

                  <div className="flex items-start justify-between gap-2">

                    <div className="min-w-0">

                      <h4
                        className="
                          truncate
                          text-sm
                          font-bold
                          text-slate-900
                        "
                      >
                        {item.product.name}
                      </h4>

                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {item.product.unit}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onRemove(item.product.id)
                      }
                      className="
                        shrink-0
                        text-xs
                        text-slate-400
                        transition
                        hover:text-red-500
                      "
                    >
                      حذف
                    </button>

                  </div>

                  {unavailable ? (

                    <p className="mt-2 text-[10px] font-bold text-red-500">
                      غير متوفر
                    </p>

                  ) : (

                    <div className="mt-2 flex items-center justify-between">

                      <span className="text-sm font-black text-slate-900">
                        {subtotal.toFixed(2)} جنيه
                      </span>

                      {/* Quantity */}

                      <div
                        className="
                          flex
                          h-7
                          items-center
                          rounded-lg
                          border
                          border-slate-200
                        "
                      >

                        <button
                          type="button"
                          onClick={() =>
                            onDecrease(item.product.id)
                          }
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            text-sm
                            text-slate-500
                            hover:bg-slate-50
                          "
                        >
                          −
                        </button>

                        <span
                          className="
                            flex
                            h-7
                            min-w-7
                            items-center
                            justify-center
                            border-x
                            border-slate-200
                            text-xs
                            font-bold
                          "
                        >
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          disabled={
                            item.quantity >=
                            item.product.stock
                          }
                          onClick={() =>
                            onIncrease(item.product.id)
                          }
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            text-sm
                            text-slate-500
                            hover:bg-slate-50
                            disabled:text-slate-300
                          "
                        >
                          +
                        </button>

                      </div>

                    </div>

                  )}

                </div>

              </div>
            )
          })}

        </div>

        {/* Footer */}

        <div className="bg-slate-50 px-5 py-4">

          {hasUnavailableItems && (
            <div
              className="
                mb-3
                rounded-lg
                bg-red-50
                px-3
                py-2
                text-xs
                font-bold
                text-red-500
              "
            >
              يوجد منتج غير متوفر
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">

            <span className="text-sm font-medium text-slate-500">
              الإجمالي
            </span>

            <span className="text-lg font-black text-slate-900">
              {total.toFixed(2)} جنيه
            </span>

          </div>

          <div className="grid grid-cols-2 gap-2">

            <Link
              to="/cart"
              onClick={onClose}
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                py-3
                text-center
                text-xs
                font-black
                text-slate-700
                transition
                hover:bg-slate-100
              "
            >
              عرض السلة
            </Link>

            <button
              type="button"
              disabled={hasUnavailableItems}
              onClick={onCheckout}
              className="
                rounded-xl
                bg-indigo-600
                py-3
                text-xs
                font-black
                text-white
                transition
                hover:bg-indigo-700
                disabled:cursor-not-allowed
                disabled:bg-slate-300
              "
            >
              إتمام الطلب
            </button>

          </div>

        </div>

      </div>
    )
  }

  // =====================================================
  // FULL CART PAGE
  // =====================================================

  return (
    <div
      dir="rtl"
      className="
        min-h-screen
        bg-slate-100
        px-4
        py-8
        sm:px-6
        lg:px-8
      "
    >

      <div className="mx-auto max-w-6xl">

        {/* Main Card */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >

          {/* Header */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-200
              px-6
              py-5
            "
          >

            <div>

              <h1 className="text-xl font-black text-slate-900">
                Shopping Cart
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                {totalItems} منتجات في السلة
              </p>

            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg
                px-3
                py-2
                text-sm
                text-slate-400
                hover:bg-slate-100
              "
            >
              ✕
            </button>

          </div>

          {/* Content */}

          <div className="grid lg:grid-cols-[1fr_280px]">

            {/* Products */}

            <div className="px-5 py-5 sm:px-6">

              <div className="space-y-0">

                {cart.map((item) => {

                  const unavailable =
                    item.product.stock <= 0

                  const subtotal =
                    unavailable
                      ? 0
                      : item.product.price *
                        item.quantity

                  return (
                    <div
                      key={item.product.id}
                      className="
                        border-b
                        border-slate-200
                        py-4
                        last:border-b-0
                      "
                    >

                      <div className="flex gap-4">

                        {/* Image */}

                        <div
                          className="
                            h-24
                            w-24
                            shrink-0
                            overflow-hidden
                            rounded-lg
                            bg-slate-100
                          "
                        >

                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="
                              h-full
                              w-full
                              object-contain
                            "
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/150x150?text=Product"
                            }}
                          />

                        </div>

                        {/* Details */}

                        <div className="min-w-0 flex-1">

                          <div className="flex justify-between gap-3">

                            <div>

                              <h3 className="text-sm font-bold text-slate-900">
                                {item.product.name}
                              </h3>

                              <p className="mt-1 text-xs text-slate-400">
                                {item.product.category}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {item.product.unit}
                              </p>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                onRemove(
                                  item.product.id
                                )
                              }
                              className="
                                text-xs
                                text-slate-400
                                hover:text-red-500
                              "
                            >
                              حذف
                            </button>

                          </div>

                          {unavailable ? (

                            <p className="mt-3 text-xs font-bold text-red-500">
                              هذا المنتج غير متوفر
                            </p>

                          ) : (

                            <div
                              className="
                                mt-4
                                flex
                                items-center
                                justify-between
                                gap-4
                              "
                            >

                              <span className="font-black text-slate-900">
                                {subtotal.toFixed(2)} جنيه
                              </span>

                              <div
                                className="
                                  flex
                                  items-center
                                  rounded-lg
                                  border
                                  border-slate-200
                                "
                              >

                                <button
                                  type="button"
                                  onClick={() =>
                                    onDecrease(
                                      item.product.id
                                    )
                                  }
                                  className="
                                    h-8
                                    w-8
                                    text-slate-600
                                    hover:bg-slate-50
                                  "
                                >
                                  −
                                </button>

                                <span
                                  className="
                                    flex
                                    h-8
                                    min-w-8
                                    items-center
                                    justify-center
                                    border-x
                                    border-slate-200
                                    text-xs
                                    font-bold
                                  "
                                >
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    item.quantity >=
                                    item.product.stock
                                  }
                                  onClick={() =>
                                    onIncrease(
                                      item.product.id
                                    )
                                  }
                                  className="
                                    h-8
                                    w-8
                                    text-slate-600
                                    hover:bg-slate-50
                                    disabled:text-slate-300
                                  "
                                >
                                  +
                                </button>

                              </div>

                            </div>

                          )}

                        </div>

                      </div>

                    </div>
                  )
                })}

              </div>

            </div>

            {/* Order Summary */}

            <aside
              className="
                border-t
                border-slate-200
                bg-slate-50
                p-5
                lg:border-r
                lg:border-t-0
              "
            >

              <h2 className="text-sm font-black text-slate-900">
                Order summary
              </h2>

              <div className="mt-5 space-y-4">

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-bold text-slate-900">
                    {total.toFixed(2)} جنيه
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">
                    Shipping
                  </span>

                  <span className="font-bold text-slate-900">
                    0.00 جنيه
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">

                  <div className="flex justify-between">

                    <span className="text-sm font-black text-slate-900">
                      Order total
                    </span>

                    <span className="text-sm font-black text-indigo-600">
                      {total.toFixed(2)} جنيه
                    </span>

                  </div>

                </div>

                <button
                  type="button"
                  disabled={hasUnavailableItems}
                  onClick={onCheckout}
                  className="
                    w-full
                    rounded-lg
                    bg-indigo-600
                    py-3
                    text-xs
                    font-black
                    text-white
                    transition
                    hover:bg-indigo-700
                    disabled:cursor-not-allowed
                    disabled:bg-slate-300
                  "
                >
                  {hasUnavailableItems
                    ? "احذف المنتجات غير المتوفرة"
                    : "Checkout"}
                </button>

              </div>

            </aside>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Cart