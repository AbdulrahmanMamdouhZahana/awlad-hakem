import Card from "./Card";

export interface IProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  stock: number;
  sale_type?: "piece" | "weight" | "both";
  piece_price?: number | null;
  weight_price?: number | null;
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

  const saleType = product.sale_type || "piece";
  const piecePrice = product.piece_price ?? product.price;
  const weightPrice = product.weight_price;

  return (
    <Card className={`group ${className}`}>
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

      <div className="p-5">
        <h3 className="truncate text-lg font-black text-slate-950">
          {product.name}
        </h3>

        <p className="mt-1 text-sm font-bold text-slate-400">
          {saleType === "piece"
            ? "بيع بالقطعة"
            : saleType === "weight"
            ? "بيع بالوزن"
            : "بيع بالقطعة والوزن"}
        </p>

        <div className="mt-4 space-y-2">
          {saleType !== "weight" && (
            <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2">
              <span className="text-xs font-bold text-slate-500">
                سعر القطعة
              </span>
              <span className="font-black text-indigo-700">
                {Number(piecePrice).toLocaleString("ar-EG")} ج.م
              </span>
            </div>
          )}

          {saleType !== "piece" && weightPrice != null && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
              <span className="text-xs font-bold text-slate-500">
                سعر الكيلو
              </span>
              <span className="font-black text-emerald-700">
                {Number(weightPrice).toLocaleString("ar-EG")} ج.م
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="text-left">
            <p className="text-[10px] font-bold text-slate-400">المخزون</p>
            <p className="text-sm font-black text-slate-800">
              {product.stock} {saleType === "piece" ? "قطعة" : "كجم"}
            </p>
          </div>
        </div>

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