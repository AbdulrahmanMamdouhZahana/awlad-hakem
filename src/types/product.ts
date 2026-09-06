export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  tax_rate?: number | null;
  unit: string;
  image: string;
  stock: number;
  sale_type?: "piece" | "weight" | "both";
  piece_price?: number | null;
  weight_price?: number | null;
  created_at?: string;
  is_offer?: boolean;
  offer_price?: number | null;
  original_price?: number | null;
  discount_percentage?: number | null;
  offer_badge?: string | null;
  offer_expires_at?: string | null;
}
