import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import Dashboard from "../components/Admin/Dashboard"
import { getAdminProducts } from "../services/productService"


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


const Admin = () => {

  const [products, setProducts] = useState<iProducts[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {

    const loadProducts = async () => {

      try {

        const data = await getAdminProducts()

        setProducts(data)

      } catch (error) {

        console.error(error)

        toast.error("حدث خطأ أثناء تحميل المنتجات")

      } finally {

        setLoading(false)

      }

    }

    loadProducts()

  }, [])


  if (loading) {

    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 font-semibold text-slate-600">
            جاري تحميل لوحة التحكم...
          </p>

        </div>

      </div>
    )

  }


  return (
    <div dir="rtl">

      <Dashboard
        products={products}
        setProducts={setProducts}
      />

    </div>
  )
}


export default Admin