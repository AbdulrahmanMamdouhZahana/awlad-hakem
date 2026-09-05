interface IProps {}

const Hero = ({}: IProps) => {
  return (
    <section
      id="home"
      dir="rtl"
      className="
        relative
        mx-auto
        my-3
        sm:my-5
        w-full
        max-w-6xl
        overflow-hidden
        rounded-[16px]
        sm:rounded-[20px]
        lg:rounded-[24px]
        bg-indigo-600
        px-4
        py-6
        sm:px-8
        sm:py-8
        lg:px-20
        lg:py-12
        min-h-[280px]
        sm:min-h-[320px]
        lg:min-h-[370px]
        font-cairo
      "
    >

      {/* =====================================================
          Background
      ===================================================== */}

      <div className="absolute inset-0 bg-[#17656b]" />

      {/* Glow */}

      <div
        className="
          animate-hero-glow
          absolute
          -left-20
          -top-24
          h-64
          w-64
          rounded-full
          bg-white/10
          blur-3xl
        "
        style={{
          animationDelay: "300ms",
        }}
      />

      <div
        className="
          animate-hero-glow
          absolute
          -bottom-28
          right-24
          h-72
          w-72
          rounded-full
          bg-indigo-800/20
          blur-3xl
        "
        style={{
          animationDelay: "600ms",
        }}
      />


      {/* =====================================================
          Hero Image - LEFT
      ===================================================== */}

      <div
        className="
          animate-hero-image
          pointer-events-none
          absolute
          bottom-0
          left-0
          z-10
          flex
          h-full
          w-[35%]
          items-end
          justify-start
          sm:left-2
          sm:w-[38%]
          lg:left-8
          lg:w-[35%]
        "
        style={{
          animationDelay: "450ms",
        }}
      >
        <img
          src="/preson.png"
          alt="أولاد الحكيم"
          className="
            h-[85%]
            w-auto
            max-w-none
            object-contain
            object-bottom
            sm:h-[88%]
            lg:h-[92%]
            xl:h-[96%]
          "
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      </div>


      {/* =====================================================
          Content - RIGHT
      ===================================================== */}

      <div
        className="
          relative
          z-20
          flex
          min-h-[240px]
          items-center
          justify-start
          sm:min-h-[280px]
          lg:min-h-[330px]
        "
      >

        <div
          className="
            w-[60%]
            max-w-[610px]
            text-right
            sm:w-[58%]
            lg:w-[56%]
            xl:w-[55%]
          "
        >

          {/* =========================
              Badge
          ========================= */}

          <div
            className="
              animate-hero-badge
              mb-2
              inline-flex
              items-center
              gap-1.5
              rounded-md
              bg-white/10
              px-2.5
              py-1
              text-[8px]
              font-medium
              text-white
              backdrop-blur-sm
              sm:mb-3
              sm:gap-2
              sm:px-3
              sm:py-1.5
              sm:text-[9px]
              lg:mb-4
              lg:text-[10px]
            "
            style={{
              animationDelay: "650ms",
            }}
          >

            <svg
              className="h-3 w-3 sm:h-3.5 sm:w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="
                  M3 7h11v10H3V7Zm11 3h4l3 3v4h-7v-7Zm-8 9
                  a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm9 0
                  a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z
                "
              />
            </svg>

            <span>
              توصيل مجاني على أول طلب
            </span>

          </div>


          {/* =========================
              Heading
          ========================= */}

          <h1
            className="
              animate-hero-title
              max-w-[560px]
              text-2xl
              font-extrabold
              leading-[1.05]
              tracking-tight
              text-white
              sm:text-3xl
              lg:text-[42px]
              xl:text-[48px]
            "
            style={{
              animationDelay: "800ms",
            }}
          >
            كل احتياجاتك

            <span className="block text-lime-200">
              في مكان واحد
            </span>
          </h1>


          {/* =========================
              Description
          ========================= */}

          <p
            className="
              animate-hero-text
              mt-2
              max-w-[480px]
              text-[10px]
              font-medium
              leading-5
              text-white/80
              sm:mt-3
              sm:text-[11px]
              lg:mt-4
              lg:text-xs
              xl:text-sm
            "
            style={{
              animationDelay: "950ms",
            }}
          >
            سوبر ماركت، مكتبة، محمصة لب ومكسرات.

            <br />

            منتجات متنوعة بجودة كويسة وأسعار مناسبة،

            <br />

            وكل اللي محتاجه تقدر تطلبه بسهولة.
          </p>


          {/* =========================
              CTA
          ========================= */}

          <div
            className="
              animate-hero-button
              mt-3
              sm:mt-4
              lg:mt-5
            "
            style={{
              animationDelay: "1100ms",
            }}
          >

            <a
              href="#products"
              className="
                group
                inline-flex
                items-center
                justify-center
                gap-1.5
                rounded-md
                bg-white
                px-4
                py-2
                text-[10px]
                font-extrabold
                text-[#17656b]
                shadow-sm
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-md
                hover:bg-slate-50
                active:scale-95
                sm:gap-2
                sm:px-5
                sm:py-2.5
                sm:text-xs
                lg:px-6
                lg:py-3
                lg:text-sm
              "
            >

              <span>
                تسوق الآن
              </span>

              <svg
                className="
                  h-3
                  w-3
                  transition-transform
                  duration-200
                  group-hover:-translate-x-1
                  sm:h-3.5
                  sm:w-3.5
                "
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

            </a>

          </div>

        </div>

      </div>

    </section>
  )
}

export default Hero