import Card from "./Card";

export interface IProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  stock: number;
  created_at?: string;
}

interface ProductCardProps {
  product: IProduct;
  onEdit?: (product: IProduct) => void;
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
  showActions?: boolean;
  className?: string;
}

const ProductCard = ({
  product,
  onEdit,
  onDelete,
  isDeleting = false,
  showActions = true,
  className = "",
}: ProductCardProps) => {
  const stockStatus =
    product.stock <= 0
      ? { text: "نفد المخزون", className: "bg-red-100 text-red-700" }
      : product.stock <= 10
      ? { text: "مخزون منخفض", className: "bg-amber-100 text-amber-700" }
      : { text: "متوفر", className: "bg-emerald-100 text-emerald-700" };

  return (
    <Card className={`group ${className}`}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "/main_logo.png";
            e.currentTarget.className = "h-full w-full object-contain p-10";
          }}
        />
        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-black ${stockStatus.className}`}
        >
          {stockStatus.text}
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black text-slate-600 shadow-sm backdrop-blur">
          {product.category}
        </span>
      </div>

      {/* Details */}
      <div className="p-5">
        <h3 className="truncate text-lg font-black text-slate-950">
          {product.name}
        </h3>
        <p className="mt-1 text-sm font-bold text-slate-400">{product.unit}</p>

        <div className="mt-4 flex items-end justify-between">
          <p className="text-2xl font-black text-indigo-600">
            {Number(product.price).toLocaleString("ar-EG")}
            <span className="mr-1 text-xs">ج.م</span>
          </p>
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400">المخزون</p>
            <p className="text-sm font-black text-slate-800">{product.stock}</p>
          </div>
        </div>

        {/* Actions */}
        {showActions && (onEdit || onDelete) && (
          <div className="mt-5 flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="flex-1 rounded-xl border border-indigo-100 bg-indigo-50 py-3 text-xs font-black text-indigo-700 transition hover:bg-indigo-100"
              >
                تعديل
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(product.id)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-red-100 bg-red-50 py-3 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                {isDeleting ? "جاري..." : "حذف"}
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;