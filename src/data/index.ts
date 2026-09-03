// src/data.ts
export interface iProducts {
  id: number | undefined;
  name: string;
  category: string;
  price: string;
  unit: string;
  image: string;
}

export const allProducts: iProducts[] = [
  {
    id: 1,
    name: "لبن كامل الدسم",
    category: "السوبر ماركت",
    price: "45",
    unit: "عبوة 1 لتر",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "أرز بسمتي",
    category: "السوبر ماركت",
    price: "85",
    unit: "كيلو",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "مكرونة",
    category: "السوبر ماركت",
    price: "25",
    unit: "عبوة",
    image:
      "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "كشكول 100 ورقة",
    category: "المكتبة",
    price: "35",
    unit: "قطعة",
    image:
      "https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    name: "أقلام جاف",
    category: "المكتبة",
    price: "30",
    unit: "علبة",
    image:
      "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    name: "وجبة فراخ",
    category: "المقلاة",
    price: "120",
    unit: "وجبة",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 7,
    name: "بطاطس مقلية",
    category: "المقلاة",
    price: "45",
    unit: "وجبة",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 8,
    name: "ساندوتش برجر",
    category: "المقلاة",
    price: "95",
    unit: "قطعة",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  },
];