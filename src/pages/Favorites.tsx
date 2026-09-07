import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import ProductCard from "../components/Products"
import { HeartIcon } from "@heroicons/react/24/solid"

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

interface IProps {
  products: iProducts[]
  onAddToCart: (product: iProducts) => void
}

const FAVORITES_KEY = "favorite_products"

const Favorites = ({
  products,
  onAddToCart,
}: IProps) => {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])

  const loadFavorites = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(FAVORITES_KEY) || "[]"
      )

      setFavoriteIds(
        Array.isArray(saved) ? saved : []
      )
    } catch {
      setFavoriteIds([])
    }
  }

  useEffect(() => {
    loadFavorites()

    const handleFavoritesChanged = () => {
      loadFavorites()
    }

    window.addEventListener(
      "favoritesChanged",
      handleFavoritesChanged
    )

    window.addEventListener(
      "storage",
      handleFavoritesChanged
    )

    return () => {
      window.removeEventListener(
        "favoritesChanged",
        handleFavoritesChanged
      )

      window.removeEventListener(
        "storage",
        handleFavoritesChanged
      )
    }
  }, [])

  const favoriteProducts = products.filter(
    (product) =>
      favoriteIds.includes(product.id)
  )

  return (
    <section
      dir="rtl"
      className="min-h-screen bg-slate-50 py-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}

        <div className="mb-8">
          <span className="text-sm font-bold text-indigo-600">
            المفضلة
          </span>

          <h1 className="mt-1 text-3xl font-black text-slate-900">
            منتجاتي المفضلة
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            المنتجات التي قمت بإضافتها إلى المفضلة
          </p>
        </div>

        {/* Products */}

        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-lg font-black text-slate-900">
              لا توجد منتجات في المفضلة
            </h2>

            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
              اضغط على
              <HeartIcon className="h-4 w-4 text-rose-500 inline" />
              بجانب أي منتج لإضافته هنا
            </p>

            <Link
              to="/products"
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              تصفح المنتجات
            </Link>

          </div>
        )}

      </div>
    </section>
  )
}

export default Favorites