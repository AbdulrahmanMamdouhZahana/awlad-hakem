import { Link } from "react-router-dom"

interface iProducts {
  id: number
  name: string
  category: string
  price: number
  unit: string
  image: string
  stock: number
  sale_type?: "piece" | "weight" | "both"
  piece_price?: number | null
  weight_price?: number | null
  created_at?: string
}

interface CartItem {
  product: iProducts
  quantity: number
  saleType: "piece" | "weight"
  weight?: number
  unitPrice: number
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
  const getItemTotal = (item: CartItem) => {
    if (item.product.stock <= 0) return 0

    if (item.saleType === "weight") {
      return Number(item.unitPrice) * Number(item.weight || 0)
    }

    return Number(item.unitPrice) * Number(item.quantity)
  }

  const total = cart.reduce(
    (sum, item) => sum + getItemTotal(item),
    0
  )

  const totalItems = cart.reduce(
    (sum, item) =>
      sum + (item.saleType === "weight" ? 1 : item.quantity),
    0
  )

  const hasUnavailableItems = cart.some(
    (item) => item.product.stock <= 0
  )

  // =====================================================
  // EMPTY CART - DROPDOWN
  // =====================================================
  if (cart.length === 0 && mode === "dropdown") {
    return (
      <div
        dir="rtl"
        className="
          w-full
          rounded-2xl
          border
          border-slate-200/90
          bg-white
          p-5
          sm:p-6
          shadow-2xl
        "
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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
              rounded-xl
              text-slate-400
              transition-colors
              hover:bg-slate-100
              hover:text-slate-700
            "
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <div className="py-7 text-center">
          <div
            className="
              mx-auto
              mb-3
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-[#17656b]/10
              text-2xl
              text-[#17656b]
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
            bg-gradient-to-r
            from-[#17656b]
            to-[#0f4a4f]
            py-2.5
            sm:py-3
            text-center
            text-xs
            sm:text-sm
            font-black
            text-white
            shadow-md
            shadow-[#17656b]/20
            transition-all
            hover:shadow-lg
            hover:shadow-[#17656b]/30
            active:scale-[0.98]
          "
        >
          تصفح المنتجات
        </Link>
      </div>
    )
  }

  // =====================================================
  // EMPTY CART - FULL PAGE
  // =====================================================
  if (cart.length === 0) {
    return (
      <div
        dir="rtl"
        className="
          min-h-[70vh]
          bg-slate-50
          px-3
          py-8
          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto max-w-4xl">
          <div
            className="
              rounded-2xl
              border
              border-slate-200/90
              bg-white
              p-6
              sm:p-10
              shadow-sm
            "
          >
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              سلة المشتريات
            </h1>

            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <div
                className="
                  mb-4
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-3xl
                  bg-[#17656b]/10
                  text-4xl
                "
              >
                🛒
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900">
                السلة فارغة حالياً
              </h2>

              <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-500">
                لم تقم بإضافة أي منتجات إلى السلة، تصفح قائمة منتجاتنا واختر ما يناسبك.
              </p>

              <Link
                to="/products"
                className="
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-[#17656b]
                  to-[#0f4a4f]
                  px-6
                  py-3
                  text-xs
                  sm:text-sm
                  font-bold
                  text-white
                  shadow-md
                  shadow-[#17656b]/20
                  transition-all
                  hover:shadow-lg
                  hover:shadow-[#17656b]/30
                  active:scale-95
                "
              >
                تصفح المنتجات الآن
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
          flex
          max-h-[calc(100dvh-82px)]
          sm:max-h-[min(620px,calc(100vh-100px))]
          w-full
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200/90
          bg-white
          shadow-2xl
        "
      >
        {/* Header */}
        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-slate-100
            px-4
            py-3.5
            sm:px-5
            sm:py-4
          "
        >
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              سلة المشتريات
            </h3>
            <span className="rounded-full bg-[#17656b]/10 px-2 py-0.5 text-[10px] font-bold text-[#17656b]">
              {totalItems} {totalItems === 1 ? "منتج" : "منتجات"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-7
              w-7
              sm:h-8
              sm:w-8
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition-colors
              hover:bg-slate-100
              hover:text-slate-700
            "
            aria-label="إغلاق السلة"
          >
            ✕
          </button>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-slate-100">
          {cart.map((item) => {
            const unavailable = item.product.stock <= 0
            const subtotal = unavailable ? 0 : getItemTotal(item)

            return (
              <div
                key={item.product.id}
                className="
                  flex
                  gap-3
                  p-3.5
                  sm:p-4
                  transition-colors
                  hover:bg-slate-50/50
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
                    border
                    border-slate-100
                    bg-slate-50
                    p-1
                  "
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className={`
                      h-full
                      w-full
                      object-contain
                      ${unavailable ? "opacity-40 grayscale" : ""}
                    `}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/100x100?text=Product"
                    }}
                  />
                </div>

                {/* Info Container */}
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  {/* Top info: Name + Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4
                        className="
                          line-clamp-2
                          text-xs
                          sm:text-sm
                          font-bold
                          text-slate-900
                          leading-snug
                          break-words
                        "
                        title={item.product.name}
                      >
                        {item.product.name}
                      </h4>

                      {/* Pricing Details Breakdown with BiDi Protection */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="inline-flex items-center rounded-md bg-[#17656b]/10 px-1.5 py-0.2 font-bold text-[#17656b] text-[10px]">
                          {item.saleType === "weight" ? "بالوزن" : "بالقطعة"}
                        </span>
                        <span className="text-slate-300">•</span>
                        {item.saleType === "weight" ? (
                          <span className="inline-flex flex-wrap items-center gap-1 text-slate-600">
                            <bdi className="font-semibold text-slate-700">
                              {Number(item.weight || 0).toFixed(3)} كجم
                            </bdi>
                            <span className="text-slate-400">×</span>
                            <bdi className="font-semibold text-[#17656b]">
                              {Number(item.unitPrice).toFixed(2)} ج.م/كجم
                            </bdi>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <bdi className="font-semibold text-[#17656b]">
                              {Number(item.unitPrice).toFixed(2)} ج.م
                            </bdi>
                            {item.product.unit && (
                              <>
                                <span className="text-slate-400">/</span>
                                <span className="text-slate-500 font-medium">
                                  {item.product.unit}
                                </span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => onRemove(item.product.id)}
                      className="
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        text-slate-400
                        transition-colors
                        hover:bg-red-50
                        hover:text-red-500
                      "
                      title="حذف من السلة"
                      aria-label="حذف"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Bottom info: Price & Quantity Controls */}
                  {unavailable ? (
                    <p className="mt-2 text-[11px] font-bold text-red-500">
                      هذا المنتج غير متوفر
                    </p>
                  ) : (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100/80 pt-2">
                      {/* Subtotal */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs sm:text-sm font-black text-[#17656b]">
                          <bdi>{subtotal.toFixed(2)}</bdi>
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">
                          جنيه
                        </span>
                      </div>

                      {/* Quantity / Weight Stepper */}
                      <div className="flex items-center">
                        {item.saleType === "weight" ? (
                          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/70 p-0.5">
                            <button
                              type="button"
                              onClick={() => onDecrease(item.product.id)}
                              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 active:scale-95"
                              aria-label="تقليل الكمية"
                            >
                              −
                            </button>

                            <span
                              className="min-w-[56px] px-1 text-center text-xs font-bold text-slate-800"
                              dir="ltr"
                            >
                              {Number(item.weight || 0).toFixed(3)}{" "}
                              <span className="text-[10px] font-normal text-slate-500">
                                كجم
                              </span>
                            </span>

                            <button
                              type="button"
                              disabled={
                                Number(item.weight || 0) >=
                                Number(item.product.stock)
                              }
                              onClick={() => onIncrease(item.product.id)}
                              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white active:scale-95"
                              aria-label="زيادة الكمية"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/70 p-0.5">
                            <button
                              type="button"
                              onClick={() => onDecrease(item.product.id)}
                              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 active:scale-95"
                              aria-label="تقليل الكمية"
                            >
                              −
                            </button>

                            <span className="min-w-[28px] px-1 text-center text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              disabled={item.quantity >= item.product.stock}
                              onClick={() => onIncrease(item.product.id)}
                              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white active:scale-95"
                              aria-label="زيادة الكمية"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5 sm:py-4">
          {hasUnavailableItems && (
            <div className="mb-2.5 rounded-lg bg-red-50 px-3 py-1.5 text-center text-xs font-bold text-red-600">
              يوجد منتج غير متوفر بالسلة
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-600">
              المجموع الإجمالي:
            </span>

            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-[#17656b]">
                <bdi>{total.toFixed(2)}</bdi>
              </span>
              <span className="text-xs font-bold text-slate-600">
                جنيه
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/cart"
              onClick={onClose}
              className="
                flex
                items-center
                justify-center
                rounded-xl
                border
                border-slate-200
                bg-white
                py-2.5
                text-center
                text-xs
                font-bold
                text-slate-700
                shadow-sm
                transition-all
                hover:bg-slate-100
                active:scale-95
              "
            >
              عرض السلة
            </Link>

            <button
              type="button"
              disabled={hasUnavailableItems}
              onClick={onCheckout}
              className="
                flex
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-r
                from-[#17656b]
                to-[#0f4a4f]
                py-2.5
                text-center
                text-xs
                font-black
                text-white
                shadow-md
                shadow-[#17656b]/20
                transition-all
                hover:shadow-lg
                hover:shadow-[#17656b]/30
                disabled:cursor-not-allowed
                disabled:bg-slate-300
                disabled:shadow-none
                active:scale-95
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
        bg-slate-50/60
        px-3
        py-6
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
            border-slate-200/90
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
              px-4
              py-4
              sm:px-6
              sm:py-5
            "
          >
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                سلة المشتريات
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                لديك {totalItems} {totalItems === 1 ? "منتج" : "منتجات"} في سلتك
              </p>
            </div>

            <Link
              to="/products"
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                py-1.5
                text-xs
                font-bold
                text-[#17656b]
                transition-all
                hover:bg-slate-50
              "
            >
              <span>متابعة التسوق</span>
              <span>←</span>
            </Link>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
            {/* Products List */}
            <div className="divide-y divide-slate-100 px-3 py-2 sm:px-6 sm:py-4">
              {cart.map((item) => {
                const unavailable = item.product.stock <= 0
                const subtotal = unavailable ? 0 : getItemTotal(item)

                return (
                  <div
                    key={item.product.id}
                    className="
                      flex
                      gap-3
                      sm:gap-4
                      py-4
                      first:pt-2
                      last:pb-2
                    "
                  >
                    {/* Image */}
                    <div
                      className="
                        h-16
                        w-16
                        sm:h-20
                        sm:w-20
                        md:h-24
                        md:w-24
                        shrink-0
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-100
                        bg-slate-50
                        p-1.5
                      "
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className={`
                          h-full
                          w-full
                          object-contain
                          ${unavailable ? "opacity-40 grayscale" : ""}
                        `}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/150x150?text=Product"
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      {/* Top Row: Title, Category, Unit, Delete */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3
                            className="
                              line-clamp-2
                              text-sm
                              sm:text-base
                              font-bold
                              text-slate-900
                              leading-snug
                              break-words
                            "
                          >
                            {item.product.name}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            {item.product.category && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {item.product.category}
                              </span>
                            )}

                            <span className="rounded-md bg-[#17656b]/10 px-2 py-0.5 text-[11px] font-bold text-[#17656b]">
                              {item.saleType === "weight" ? "بالوزن" : "بالقطعة"}
                            </span>

                            <span className="text-slate-300">•</span>

                            {item.saleType === "weight" ? (
                              <span className="inline-flex flex-wrap items-center gap-1 text-[11px] font-medium text-slate-600">
                                <bdi className="font-semibold text-slate-700">
                                  {Number(item.weight || 0).toFixed(3)} كجم
                                </bdi>
                                <span className="text-slate-400">×</span>
                                <bdi className="font-semibold text-[#17656b]">
                                  {Number(item.unitPrice).toFixed(2)} جنيه/كجم
                                </bdi>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                                <bdi className="font-semibold text-[#17656b]">
                                  {Number(item.unitPrice).toFixed(2)} جنيه
                                </bdi>
                                {item.product.unit && (
                                  <>
                                    <span className="text-slate-400">/</span>
                                    <span>{item.product.unit}</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => onRemove(item.product.id)}
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            transition-colors
                            hover:bg-red-50
                            hover:text-red-500
                          "
                          title="حذف هذا المنتج"
                          aria-label="حذف"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Bottom Row: Subtotal and Stepper */}
                      {unavailable ? (
                        <p className="mt-3 text-xs font-bold text-red-500">
                          هذا المنتج غير متوفر حالياً بالمخزن
                        </p>
                      ) : (
                        <div
                          className="
                            mt-3
                            flex
                            flex-wrap
                            items-center
                            justify-between
                            gap-2.5
                            border-t
                            border-slate-100
                            pt-2.5
                          "
                        >
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-slate-400 font-medium">
                              المجموع:
                            </span>
                            <span className="text-sm sm:text-base font-black text-[#17656b]">
                              <bdi>{subtotal.toFixed(2)}</bdi>
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              جنيه
                            </span>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center">
                            {item.saleType === "weight" ? (
                              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                                <button
                                  type="button"
                                  onClick={() => onDecrease(item.product.id)}
                                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 active:scale-95"
                                  aria-label="تقليل الكمية"
                                >
                                  −
                                </button>

                                <span
                                  className="min-w-[70px] px-1 text-center text-xs sm:text-sm font-bold text-slate-800"
                                  dir="ltr"
                                >
                                  {Number(item.weight || 0).toFixed(3)}{" "}
                                  <span className="text-xs font-normal text-slate-500">
                                    كجم
                                  </span>
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    Number(item.weight || 0) >=
                                    Number(item.product.stock)
                                  }
                                  onClick={() => onIncrease(item.product.id)}
                                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white active:scale-95"
                                  aria-label="زيادة الكمية"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                                <button
                                  type="button"
                                  onClick={() => onDecrease(item.product.id)}
                                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 active:scale-95"
                                  aria-label="تقليل الكمية"
                                >
                                  −
                                </button>

                                <span className="min-w-[36px] px-1.5 text-center text-xs sm:text-sm font-bold text-slate-800">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={item.quantity >= item.product.stock}
                                  onClick={() => onIncrease(item.product.id)}
                                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white active:scale-95"
                                  aria-label="زيادة الكمية"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary Sidebar */}
            <aside
              className="
                border-t
                border-slate-200
                bg-slate-50/80
                p-4
                sm:p-6
                lg:border-r
                lg:border-t-0
              "
            >
              <h2 className="text-base font-black text-slate-900">
                ملخص الطلب
              </h2>

              <div className="mt-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">المجموع الفرعي</span>
                  <span className="font-bold text-slate-900">
                    <bdi>{total.toFixed(2)}</bdi> جنيه
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">تكلفة التوصيل</span>
                  <span className="font-bold text-emerald-600">
                    تحدد عند التأكيد
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      إجمالي الطلب
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg sm:text-xl font-black text-[#17656b]">
                        <bdi>{total.toFixed(2)}</bdi>
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        جنيه
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={hasUnavailableItems}
                  onClick={onCheckout}
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    bg-gradient-to-r
                    from-[#17656b]
                    to-[#0f4a4f]
                    py-3.5
                    text-center
                    text-xs
                    sm:text-sm
                    font-black
                    text-white
                    shadow-md
                    shadow-[#17656b]/20
                    transition-all
                    hover:shadow-lg
                    hover:shadow-[#17656b]/30
                    disabled:cursor-not-allowed
                    disabled:bg-slate-300
                    disabled:shadow-none
                    active:scale-[0.99]
                  "
                >
                  {hasUnavailableItems
                    ? "يرجى إزالة المنتجات غير المتوفرة أولاً"
                    : "إتمام الطلب الآن"}
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