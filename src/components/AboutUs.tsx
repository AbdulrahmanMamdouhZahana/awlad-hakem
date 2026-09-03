const AboutUs = () => {
  return (
    <section
      id="about"
      dir="rtl"
      className="bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* =========================
              Content
          ========================= */}

          <div>

            <span className="mb-3 inline-block text-sm font-black text-indigo-600">
              مين إحنا؟
            </span>

            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              أولاد حكيم
              <span className="block text-indigo-600">
                كل احتياجاتك في مكان واحد
              </span>
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              في أولاد حكيم بنسعى إننا نوفرلك تجربة تسوق سهلة
              ومريحة، من خلال مجموعة متنوعة من المنتجات اللي
              تناسب احتياجات البيت اليومية.
            </p>

            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              من منتجات السوبر ماركت والتسالي والمكسرات إلى
              مستلزمات المكتبة، تقدر تلاقي احتياجاتك في مكان واحد.
            </p>


            {/* =========================
                Stats
            ========================= */}

            <div className="mt-8 grid grid-cols-2 gap-4">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-3xl font-black text-indigo-600">
                  14
                </div>

                <div className="mt-1 text-sm font-semibold text-slate-600">
                  فرع على مستوى مصر
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-3xl font-black text-indigo-600">
                  3
                </div>

                <div className="mt-1 text-sm font-semibold text-slate-600">
                  أقسام رئيسية
                </div>
              </div>

            </div>

          </div>


          {/* =========================
              Visual
          ========================= */}

          <div className="relative">

            <div className="absolute -inset-4 rounded-[2rem] bg-indigo-50" />

            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-xl">

              <img
                src="/egypt.jpeg"
                alt="أولاد حكيم"
                className="h-[420px] w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute bottom-0 right-0 left-0 p-7 text-white">

                <p className="text-2xl font-black">
                  14 فرع
                </p>

                <p className="mt-1 text-sm font-medium text-white/80">
                  وجودنا في أنحاء مصر
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  )
}

export default AboutUs