import { Link } from "react-router-dom"

const CTA = () => {
  return (
    <section
      dir="rtl"
      className="px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        <div className="relative overflow-hidden rounded-[2rem] bg-indigo-600 px-6 py-14 text-center shadow-xl sm:px-12 sm:py-16">

          {/* Decorative circles */}

          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />

          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10" />


          <div className="relative z-10">

            <h2 className="text-3xl font-black text-white sm:text-4xl">
              كل احتياجاتك في مكان واحد
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
              اكتشف مجموعة متنوعة من منتجات أولاد الحكيم
              واختر كل اللي محتاجه بسهولة.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-3 rounded-xl bg-white px-7 py-3.5 text-sm font-black text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              تصفح المنتجات

              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M13 6l6 6-6 6"
                />
              </svg>
            </Link>

          </div>

        </div>

      </div>
    </section>
  )
}

export default CTA