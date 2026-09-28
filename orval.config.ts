import { defineConfig } from 'orval';

// Contract comes from next-api's /api/openapi.json (committed as ./openapi.json).
// Never edit generated files; shared request handling lives in src/api/client.ts.
export default defineConfig({
  api: {
    input: './openapi.json',
    output: {
      target: './src/api/generated/index.ts',
      schemas: './src/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'tags-split',
      override: {
        mutator: { path: './src/api/client.ts', name: 'apiClient' },
        // apiClient throws on non-2xx, so hooks resolve to the response body only.
        fetch: { includeHttpResponseReturnType: false },
        query: {
          // Required: without it Orval may emit TanStack Query v4 hooks.
          version: 5,
          useInfinite: true,
          useInfiniteQueryParam: 'skip',
        },
      },
    },
  },
  zod: {
    input: './openapi.json',
    output: { target: './src/api/schemas.zod.ts', client: 'zod' },
  },
});
