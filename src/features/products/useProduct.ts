import type { ApiError } from '@/src/api/client';
import type { ProductDetail } from '@/src/api/generated/model';
import { useGetProduct } from '@/src/api/generated/products/products';
import { getProductResponse } from '@/src/api/schemas.zod';

// Single object: validate every field. Log drift but keep rendering the data.
function selectProduct(data: ProductDetail) {
  const result = getProductResponse.safeParse(data);
  if (!result.success) console.warn('[getProduct] unexpected response', result.error.issues);
  return data;
}

export function useProduct(id: number) {
  return useGetProduct<ProductDetail, ApiError>(id, {
    query: {
      select: selectProduct,
      staleTime: 5 * 60 * 1000,
    },
  });
}
