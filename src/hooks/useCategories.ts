import { useState, useEffect } from 'react';
import { categoryService, type Category } from '@/services/category.service';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.list()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}

/** Retorna a cor hex de uma categoria pelo nome, ou um fallback */
export function useCategoryColor(name: string | undefined, fallback = '#6366f1'): string {
  const { categories } = useCategories();
  if (!name) return fallback;
  return categories.find((c) => c.name === name)?.color ?? fallback;
}

/** Retorna se uma categoria é faturável (entra no cálculo de horas) */
export function isBillableCategory(categories: Category[], name: string | undefined): boolean {
  if (!name) return true;
  const cat = categories.find((c) => c.name === name);
  return cat ? cat.billable : true; // default: faturável
}
