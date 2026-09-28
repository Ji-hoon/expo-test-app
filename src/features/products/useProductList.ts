import type { InfiniteData } from '@tanstack/react-query';
import { z } from 'zod';

import type { ApiError } from '@/src/api/client';
import type { ProductListResponse } from '@/src/api/generated/model';
import { useListProductsInfinite } from '@/src/api/generated/products/products';
import { listProductsResponse } from '@/src/api/schemas.zod';

const PAGE_SIZE = 20;

// Large arrays: validate only the page envelope, not every item (JS thread cost).
const PageEnvelope = listProductsResponse
  .pick({ total: true, skip: true, limit: true })
  .extend({ items: z.array(z.unknown()) });

// Module-level so TanStack Query memoizes it; reruns only when pages change.
function selectProducts(data: InfiniteData<ProductListResponse, number | undefined>) {
  for (const page of data.pages) {
    const result = PageEnvelope.safeParse(page);
    if (!result.success) console.warn('[listProducts] unexpected response', result.error.issues);
  }
  return {
    items: data.pages.flatMap((p) => p.items),
    total: data.pages[0]?.total ?? 0,
  };
}

export function useProductList() {
  return useListProductsInfinite<ReturnType<typeof selectProducts>, ApiError>(
    { limit: PAGE_SIZE },
    {
      query: {
        initialPageParam: 0,
        // Relies on the server echoing the requested skip/limit (TECH_DECISIONS 6.1).
        getNextPageParam: (last) => {
          const next = last.skip + last.limit;
          return next < last.total ? next : undefined;
        },
        select: selectProducts,
        staleTime: 5 * 60 * 1000,
      },
    },
  );
}
