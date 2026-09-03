const TrustBar = () => {
  const items = [
    {
      title: "17 فرع",
      description: "على مستوى مصر",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 21h18M5 21V5l7-3 7 3v16M9 21v-4h6v4M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01"
          />
        </svg>
      ),
    },
    {
      title: "منتجات متنوعة",
      description: "كل احتياجاتك في مكان واحد",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7 12 3 4 7m16 0v10l-8 4-8-4V7m16 0-8 4-8-4m8 4v10"
          />
        </svg>
      ),
    },
    {
      title: "جودة موثوقة",
      description: "منتجات مختارة بعناية",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="m12 3 2.6 5.3L20.5 9l-4.25 4.15 1 5.85L12 16.25 6.75 19l1-5.85L3.5 9l5.9-.7L12 3Z"
          />
        </svg>
      ),
    },
    {
      title: "خدمة مريحة",
      description: "تجربة شراء سهلة",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7h11v10H3V7Zm11 3h4l3 3v4h-7v-7Zm-8 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm9 0a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"
          />
        </svg>
      ),
    },
  ]

  return (
    <section
      dir="rtl"
      className="bg-white py-5 sm:py-7"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">

          {items.map((item, index) => (
            <div
              key={item.title}
              className={`
                group
                flex
                min-h-[105px]
                flex-col
                items-center
                justify-center
                rounded-xl
                border
                px-3
                py-4
                text-center
                transition-all
                duration-200
                sm:min-h-[120px]
                ${
                  index === 0
                    ? "border-[#17656b] bg-[#17656b] text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-[#17656b]/40 hover:shadow-md"
                }
              `}
            >

              {/* Icon */}
              <div
                className={`
                  mb-2
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-lg
                  ${
                    index === 0
                      ? "bg-white/10 text-white"
                      : "bg-slate-50 text-slate-700"
                  }
                `}
              >
                {item.icon}
              </div>

              {/* Title */}
              <h3
                className={`
                  text-sm
                  font-bold
                  ${
                    index === 0
                      ? "text-white"
                      : "text-slate-800"
                  }
                `}
              >
                {item.title}
              </h3>

              {/* Description */}
              <p
                className={`
                  mt-1
                  text-[10px]
                  leading-4
                  ${
                    index === 0
                      ? "text-white/75"
                      : "text-slate-800"
                  }
                `}
              >
                {item.description}
              </p>

            </div>
          ))}

        </div>
      </div>
    </section>
  )
}

export default TrustBar
