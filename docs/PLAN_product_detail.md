# expo-test-app: 상품 수 sticky + 상품 상세 화면(캐러셀 + 3탭)

## Context
홈 목록(2컬럼, 무한 스크롤)은 구현이 끝났다. 이번 요구사항은 두 가지다.
1. `{total}개 상품` 바를 스크롤해도 항상 상단에 고정한다.
2. 카드를 탭하면 상세 화면으로 이동한다. 상세 화면은 이미지 캐러셀 아래에 **상품정보 | 고객리뷰 | 취향분석** 3개 탭을 둔다. 상품정보 외의 두 탭은 더미 텍스트로 채운다.

막히는 점: 상세 데이터(`images`, `description` 등)를 줄 API가 없다.
- 라이브 서버의 `GET /api/products/1`은 404다.
- 목록 응답(`ProductSummary`)에는 썸네일 1장뿐이다.
- 문서 TECH_DECISIONS 4.4장과 6장에 따르면 앱은 DummyJSON을 직접 호출하지 않는다. 상세 API `/api/products/:id`(`getProduct`)는 "예정"으로 잡혀 있다.

그래서 **next-api(portfolio)에 상세 API를 먼저 추가**하고, 앱은 Orval로 생성한 `useGetProduct`를 쓴다.

## 1. next-api 상세 API (`/Users/ted/Documents/__personal/portfolio`)
목록 API와 같은 구조로 만든다.
- **`lib/shop/schemas/common.ts`**: `ErrorCode` enum에 `NOT_FOUND`를 추가한다.
- **`lib/shop/schemas/product.ts`**
  - `ProductDetail = ProductSummary.extend({...}).meta({ id: "ProductDetail" })`
    - 추가 필드: `description`, `category`, `images: z.array(z.url())`, `stock`, `availabilityStatus?`, `shippingInformation?`, `warrantyInformation?`, `returnPolicy?`
    - `reviews`, `dimensions` 같은 나머지 필드는 제외한다.
  - `ProductIdParam = z.object({ id: z.coerce.number().int().min(1) })`
- **`lib/shop/dummyjson.ts`**: `fetchProduct(id)`를 추가한다.
  - `"use cache"`와 `cacheLife("hours")`를 적용한다.
  - `/products/{id}?select=...`를 호출한다.
  - DummyJSON이 404를 주면 `ProductNotFoundError`를 던진다. 그 밖의 실패는 기존처럼 `Error`를 던진다.
  - 응답은 `ProductDetail`로 non-strict 검증한다.
- **`app/api/products/[id]/route.ts`**
  - 파라미터 검증에 실패하면 400 `VALIDATION_ERROR`를 반환한다.
  - 상품이 없으면 404 `NOT_FOUND`, 그 밖의 실패는 502 `UPSTREAM_ERROR`를 반환한다.
- **`lib/shop/openapi.ts`**: `/api/products/{id}` 경로(operationId `getProduct`, tag `products`)와 200/400/404/502 응답을 추가한다.
- **확인**: 먼저 로컬 `npm run dev`(포트 4000)에서 동작을 확인한다.
- **배포**: portfolio 커밋 후 push하면 라이브 서버(jihoonkim.com)에 배포된다. **push는 실행 직전에 사용자에게 확인받는다.**

## 2. API 재생성 (expo-test-app)
- **재생성**: `API_URL=http://localhost:4000 npm run api:pull && npm run api:gen`을 실행한다. 배포가 끝난 뒤에는 기본값(라이브 서버)으로 다시 pull해서 커밋한다.
- **생성 결과 확인**
  - `src/api/generated/products/products.ts`에 `useGetProduct(id)`와 `getProductQueryKey`가 생겼는지 확인한다.
  - `schemas.zod.ts`에 `getProductResponse`가 생겼는지 확인한다.
- **`src/features/products/useProduct.ts`**
  - `useGetProduct<ProductDetail, ApiError>(id, { query: { staleTime: 5min, select } })`로 감싼다.
  - `select` 안에서 `getProductResponse.safeParse`를 하고, 실패하면 `console.warn`을 남긴다(목록 훅 `useProductList.ts`와 같은 패턴). 단건 응답이므로 전체 필드를 검증한다.

## 3. 상품 수 sticky (`app/(tabs)/index.tsx`)
- `ListHeaderComponent`에 있던 count 바를 FlashList **밖으로** 옮긴다. `Shop` 헤더 바로 아래에 고정되고, 목록만 스크롤된다.
  - 이렇게 하면 `stickyHeaderIndices` 없이 항상 상단에 고정된다.
  - 당겨서 새로고침 스피너는 count 바 아래에서 나온다.
- count 바는 `data`가 있을 때만 렌더링한다(로딩·에러 중에는 숨김).
- 구분선은 `borderBottomWidth: hairlineWidth`로 넣는다.

## 4. 상세 라우트
- **라우트 파일**: `app/product/[id].tsx`. 루트 Stack에 있으므로 탭바가 가려지는 전체 화면으로 push된다.
- **`app/_layout.tsx`**: `<Stack.Screen name="product/[id]" options={{ title: '', headerBackButtonDisplayMode: 'minimal' }} />`를 추가한다.
  - 화면 안에서 데이터가 오면 `<Stack.Screen options={{ title: product.title }} />`로 제목을 설정한다.
- **`ProductCard.tsx`**: `Pressable`의 `onPress`에서 `router.push({ pathname: '/product/[id]', params: { id: String(product.id) } })`를 호출한다.
  - `useRouter`는 카드 안에서 사용한다. memo는 그대로 유지된다.

## 5. 상세 화면 (`app/product/[id].tsx`)
- **id 처리**: `useLocalSearchParams<{ id: string }>()`로 받아 `Number(id)`로 바꾸고 `useProduct`에 넘긴다.
- **화면 상태**: 로딩, 에러, 404 상태는 홈과 같은 스타일로 보여 준다.
  - 에러: `code`와 `message`, 다시 시도 버튼.
  - `NOT_FOUND`: "상품을 찾을 수 없습니다" 문구만.
- **레이아웃**: `ScrollView`에 `stickyHeaderIndices={[1]}`을 준다.
  0. `ImageCarousel`
  1. `DetailTabBar`: 캐러셀 아래에 오고, 스크롤하면 상단에 고정된다.
  2. 선택된 탭의 내용
- **`src/features/products/ImageCarousel.tsx`**: 새 네이티브 의존성은 추가하지 않는다. 따라서 재빌드가 필요 없다.
  - 가로 `FlatList`에 `pagingEnabled`를 주고, 너비는 `useWindowDimensions().width`, 높이는 정사각형으로 한다.
  - 각 페이지는 `expo-image`로 그린다.
  - `onMomentumScrollEnd`에서 현재 인덱스를 계산하고, 우하단에 `1 / N` 인디케이터를 보여 준다.
  - `images`가 비어 있으면 `thumbnail` 1장으로 대체한다.
- **`src/features/products/DetailTabBar.tsx`**: 탭 3개를 가로로 배치한다.
  - 선택된 탭은 굵은 글씨와 하단 2px 인디케이터로 표시한다.
  - 배경은 불투명하게 한다. sticky 상태일 때 아래 내용이 비치지 않게 하려는 것이다.
  - 상태는 화면의 `useState<'info' | 'reviews' | 'taste'>`로 관리한다.
  - 탭 간 스와이프는 이번 범위에서 제외한다.
- **탭 내용**
  - **상품정보**
    - 브랜드와 카테고리
    - 제목
    - 할인율 배지와 `$price`: 카드와 같은 규칙이다. 클라이언트에서 가격을 계산하지 않는다(Q1=C 유지).
    - 평점과 재고
    - `description`
    - 배송, 보증, 반품 정보: 값이 있는 항목만 key-value 행으로 보여 준다.
  - **고객리뷰, 취향분석**: 제목과 더미 문단 몇 개(`ThemedText`). 스크롤이 생기도록 적당한 길이로 채운다.
- **배지 스타일 공유**: 카드와 상세가 같은 배지와 가격 행을 쓰도록 `src/features/products/PriceRow.tsx`로 분리한다. `ProductCard`도 이 컴포넌트를 쓰게 바꾼다.

## 수정·생성 파일
- **portfolio**
  - 수정: `lib/shop/schemas/{common,product}.ts`, `lib/shop/dummyjson.ts`, `lib/shop/openapi.ts`
  - 생성: `app/api/products/[id]/route.ts`
- **expo-test-app**
  - 수정: `app/(tabs)/index.tsx`, `app/_layout.tsx`, `src/features/products/ProductCard.tsx`, `openapi.json`, `src/api/generated/**`, `src/api/schemas.zod.ts`
  - 생성: `app/product/[id].tsx`, `src/features/products/{useProduct,ImageCarousel,DetailTabBar,PriceRow}.tsx?`

## 커밋 (단계별, 작성자 김지훈)
- **portfolio**: `Add product detail API` 1개.
- **expo-test-app**: 아래 순서로 나눈다.
  1. count 바 sticky
  2. 상세 API 재생성 + `useProduct`
  3. 상세 라우트, 카드 탭 이동
  4. 캐러셀과 탭 UI

## 검증
1. **portfolio**
   - `curl localhost:4000/api/products/1`: 200이고 `images`가 있는지 확인.
   - `/api/products/99999`는 404 `NOT_FOUND`, `/api/products/abc`는 400인지 확인.
   - `/api/openapi.json`에 `getProduct`가 있는지 확인.
   - `npm run lint`와 `tsc`가 통과하는지 확인.
2. **expo-test-app**: `npx tsc --noEmit`와 `npm run lint`에서 새 오류가 없는지 확인한다. 기존 템플릿 오류는 제외한다.
3. **에뮬레이터**(Pixel_3a_API_33, `npx expo start` → Android)
   - 목록을 스크롤해도 `194개 상품` 바가 헤더 아래에 고정되어 있다.
   - 카드를 탭하면 상세로 이동한다. 헤더 제목과 뒤로 가기가 동작한다.
   - 캐러셀이 페이지 단위로 스와이프되고 `n / N`이 갱신된다.
   - 3개 탭 전환이 되고, 스크롤하면 탭바가 상단에 붙는다.
   - 할인 배지와 가격이 카드와 같다.
   - 여러 상품을 오가도 이전 데이터가 잠깐 보이지 않는다(쿼리 키가 id별로 나뉘는지 확인).
4. **배포 후**: 라이브 서버 기준으로 `api:pull`을 다시 실행했을 때 diff가 없는지 확인하고, 앱이 라이브 서버에서 동작하는지 확인한다.
5. **문서**: TECH_DECISIONS 6장 표의 `getProduct` 상태를 ✅로 바꾸자고 제안한다.
