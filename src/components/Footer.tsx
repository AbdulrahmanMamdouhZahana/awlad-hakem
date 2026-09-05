import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "الدعم",
      links: [
        { text: "تواصل معنا", to: "/#" },
      ],
    },
    {
      title: "الحساب",
      links: [
        { text: "تسجيل الدخول", to: "/login" },
        { text: "المنتجات", to: "/products" },
        { text: "المفضلة", to: "/favorites" },
      ],
    },
    {
      title: "روابط سريعة",
      links: [
        { text: "المنتجات", to: "/products" },
        { text: "الشروط والأحكام", to: "/#" },
        { text: "سياسة الخصوصية", to: "/#" },
      ],
    },
  ];

  return (
    <footer dir="rtl" className="bg-[#17656b] text-white">
      {/* Main Footer */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div className="space-y-4 text-right">
            <div>
              <h2 className="text-xl font-black text-white">
                أولاد الحكيم
              </h2>

              <p className="mt-3 max-w-sm text-sm leading-7 text-white/75">
                نوفر لك مجموعة متنوعة من المنتجات في السوبر ماركت والمكتبة
                والمحمصة، مع تجربة تسوق سهلة ومريحة.
              </p>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="text-right">
              <h3 className="mb-4 text-sm font-bold text-white">
                {section.title}
              </h3>

              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.text}>
                    <Link
                      to={link.to}
                      className="inline-block text-sm text-white/70 transition-all duration-200 hover:translate-x-[-3px] hover:text-white"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-[#155e63]">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-xs text-white/60">
              © {currentYear} أولاد الحكيم. جميع الحقوق محفوظة.
            </p>

            <p className="text-[11px] text-white/40">
              تسوق بسهولة، واختر اللي يناسبك.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
