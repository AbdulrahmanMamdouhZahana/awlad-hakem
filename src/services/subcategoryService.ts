import { apiFetch } from "./api";

export interface ISubcategoryItem {
  category: string;
  products_count: number;
}

export interface ISubcategoriesResponse {
  success: boolean;
  data: ISubcategoryItem[];
  total: number;
}

/**
 * Fetch all subcategories with their product counts from backend
 */
export async function getAdminSubcategories(search?: string): Promise<ISubcategoryItem[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.set("search", search.trim());
  }

  const endpoint = `/admin/subcategories${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await apiFetch(endpoint);

  return response?.data ?? [];
}

/**
 * Rename a subcategory across all products
 */
export async function renameSubcategory(
  oldName: string,
  newName: string
): Promise<{
  success: boolean;
  message: string;
  affected_products: number;
  old_name: string;
  new_name: string;
}> {
  const response = await apiFetch("/admin/subcategories/rename", {
    method: "PATCH",
    body: JSON.stringify({
      old_name: oldName.trim(),
      new_name: newName.trim(),
    }),
  });

  return response;
}

/**
 * Delete a subcategory if it has 0 products
 */
export async function deleteSubcategory(
  name: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await apiFetch("/admin/subcategories", {
    method: "DELETE",
    body: JSON.stringify({
      name: name.trim(),
    }),
  });

  return response;
}
