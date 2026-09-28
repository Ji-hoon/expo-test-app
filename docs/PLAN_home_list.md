# expo-test-app: 하단 탭 변경 + 홈 상품 목록(2컬럼·무한 스크롤)

## Context
`TECH_DECISIONS_0928.md` 기준으로 next-api의 `GET /api/products`는 구현이 끝났지만(`/Users/ted/Documents/__personal/portfolio`, 포트 4000), RN 쪽(`expo-test-app`)은 아직 create-expo-app 템플릿 그대로다(Home/Explore 탭, ParallaxScrollView 데모).
이번 작업으로 rn-app 쪽 첫 흐름을 세운다.
- 하단 탭을 **홈 / 계정**으로 바꾼다.
- 홈에 첨부 이미지 스타일의 **2컬럼 상품 카드 + 무한 스크롤**을 넣는다.
- 문서 4.4·8장의 스택을 쓴다: Orval 생성 훅, `apiClient` mutator, TanStack Query v5 `useInfiniteQuery`, FlashList, zod, focus/online 연결.

확정된 결정:
- **가격 표시(Q1=C):** 정가와 할인율 배지만 보여 준다(예: `10%` 배지 + `$40.00`). 할인가·취소선은 없고 클라이언트에서 가격을 계산하지 않는다. 서버 변경도 없다.
- **상단 영역(Q2=A):** 타이틀 헤더와 `N개 상품`(첫 페이지의 `total`)만 둔다. 카테고리 탭, 정렬, 필터, 하트, 얼굴/눈 토글은 제외한다.

## 1. 의존성 (`expo-test-app/expo-test-app`)
- `npx expo install @tanstack/react-query @shopify/flash-list @react-native-community/netinfo expo-image`
- `npm i zod@^4` (현재 node_modules의 3.25.76은 다른 패키지를 통해 들어온 것. Orval zod 출력과 문서 8.2 기준으로 4를 쓴다.)
- `npm i -D orval`
- netinfo와 expo-image는 네이티브 모듈이다. 기존 `android/`가 있으므로 설치 후 `npx expo run:android`로 다시 빌드해야 한다.

## 2. API 계층 (문서 4.4)
- **`openapi.json`**: 프로젝트 루트에 커밋한다. next-api `npm run dev` 상태에서 `npm run api:pull`로 받는다.
- **`package.json` scripts**:
  - `"api:pull": "curl -o openapi.json $API_URL/api/openapi.json"`
  - `"api:gen": "orval"`
- **`orval.config.ts`**: 문서 4.4 예시를 그대로 따르고 다음을 더한다.
  - `httpClient: 'fetch'`
  - `override.query`에 `{ version: 5, useInfinite: true, useInfiniteQueryParam: 'skip' }` (문서 8.3)
  - output target: `src/api/generated/` (tags-split), zod 출력: `src/api/schemas.zod.ts`
- **`src/api/client.ts`** (`apiClient` mutator)
  - `process.env.EXPO_PUBLIC_API_URL`을 base URL로 붙인다.
  - non-2xx 응답은 `{ code, message }` 형태의 `ApiError`로 바꿔 throw한다. JSON 파싱에 실패하면 `UPSTREAM_ERROR` 계열로 대체한다.
  - 인증 헤더, `If-Match`, `Idempotency-Key`는 이번에는 넣지 않는다. 대신 들어갈 자리를 주석으로 남긴다(장바구니 작업 때 추가).
  - 시그니처는 Orval fetch mutator 형식 `(url, init) => Promise<T>`에 맞춘다. 생성 결과를 보고 확인한다.
- **생성 결과 확인**: `useListProductsInfinite`가 `getNextPageParam`을 받아서 `skip`을 쿼리 파라미터로 넘기는지 본다.
  - 기대대로 동작하지 않으면 문서 8.3의 대안을 쓴다. 생성된 `listProducts` 함수만 가져와 `src/features/products/useProductList.ts`에서 `useInfiniteQuery`를 직접 작성한다.
- **`.env`**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000` (Android 에뮬레이터 기준. iOS 시뮬레이터는 `localhost`, 실기기는 PC IP나 터널.)
- **Android HTTP**: 평문 HTTP가 막히면 `app.json`의 `expo-build-properties` `android`에 `usesCleartextTraffic: true`를 추가한다(개발용).

## 3. 앱 진입점 설정 (`app/_layout.tsx`)
- 모듈 스코프에서 `QueryClient`를 만들고 `<QueryClientProvider>`로 기존 `<Stack>`을 감싼다.
- 문서 8.1의 `onlineManager`(NetInfo)와 `focusManager`(AppState) 연결을 `src/api/queryClient.ts`에 두고, 이 파일을 import해서 실행한다.
- 문서 8.2의 Zod/Hermes 오류가 생길 때만 `z.config({ jitless: true })`를 적용한다.

## 4. 하단 탭: 홈 / 계정
- **`app/(tabs)/_layout.tsx`**
  - `index`: title `홈`, 아이콘 `house.fill`
  - `explore` 탭은 `account`로 바꾼다: title `계정`, 아이콘 `person.fill`
- **파일 교체**: `app/(tabs)/explore.tsx`를 삭제하고 `app/(tabs)/account.tsx`를 만든다. 로그인은 범위 밖이므로 "로그인 예정" 안내만 있는 플레이스홀더로 둔다(ThemedView/ThemedText 사용).
- **`components/ui/IconSymbol.tsx`**: MAPPING에 `'person.fill': 'person'`을 추가한다.
- **정리**: 쓰지 않게 되는 템플릿 컴포넌트(ParallaxScrollView, HelloWave, Collapsible, ExternalLink)는 import가 없어진 것을 확인한 뒤 삭제한다.

## 5. 홈 화면 (`app/(tabs)/index.tsx`)
- **구조**: SafeArea 상단에 헤더 → `FlashList`(`numColumns={2}`).
  - 헤더: 가운데 타이틀 `Shop`, 하단 구분선.
  - `ListHeaderComponent`: `{total}개 상품` 바.
- **데이터**
  - 무한 쿼리: `limit: 20`, `initialPageParam: 0`, `maxPages`는 적당히 제한.
  - `getNextPageParam: last => last.skip + last.limit < last.total ? last.skip + last.limit : undefined` (서버가 요청한 `skip`·`limit`을 그대로 돌려준다는 6.1의 전제에 기댄다).
  - `items = useMemo(() => data?.pages.flatMap(p => p.items) ?? [], [data])`
- **`onEndReached`**: `hasNextPage && !isFetchingNextPage`일 때만 `fetchNextPage()`를 호출한다. `onEndReachedThreshold`는 0.5.
- **화면 상태**
  - 최초 로딩: 가운데 스피너.
  - 에러: `code`와 메시지, 그리고 재시도 버튼(`refetch`).
  - 다음 페이지 로딩: `ListFooterComponent`에 스피너.
  - 당겨서 새로고침: `refreshing`, `onRefresh`.
  - 빈 목록: 빈 상태 문구.
- **하단 여백**: iOS 탭바가 `position: absolute`라서 `useBottomTabBarHeight()` 값을 `contentContainerStyle.paddingBottom`에 준다.
- **런타임 검증(문서 8.2)**: 큰 배열이라 필드 단위 전체 검증은 하지 않는다. 생성된 zod 스키마로 각 페이지 응답의 최상위(`items`가 배열인지, `total`·`skip`·`limit`)만 `safeParse`하고, 실패하면 `console.warn`으로 기록한다.

### `src/features/products/ProductCard.tsx` (`memo`)
- **이미지**: `expo-image`, 카드 폭 100%, `aspectRatio: 1`(DummyJSON 썸네일이 정사각형), 연회색 배경, `contentFit="cover"`.
- **텍스트 영역**: 패딩은 16 정도.
  - `title`: 16px, 2줄 말줄임.
  - `brand`: 있을 때만 13px 회색으로 표시(이미지의 "투명 | 원데이" 자리).
  - 가격 행: `discountPercentage`가 0보다 크면 분홍 배경(`#EF7A92` 계열)에 흰 글씨로 `{Math.round(d)}%` 배지를 붙이고, 그 옆에 `$` + `price.toFixed(2)`를 굵게 표시한다. 할인가·취소선은 없다.
- **컬럼 간격**: 이미지처럼 컬럼 사이 1–2px 여백. `index % 2`로 좌우 패딩을 준다.
- **탭 동작**: 상세 화면은 다음 작업이므로 `Pressable`만 두고 `onPress`는 비워 둔다.

## 수정·생성 파일 요약
- **수정**: `package.json`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `components/ui/IconSymbol.tsx`, (필요하면) `app.json`
- **생성**: `orval.config.ts`, `openapi.json`, `.env`, `src/api/client.ts`, `src/api/queryClient.ts`, `src/api/generated/**`(생성물, 직접 수정 금지), `src/api/schemas.zod.ts`, `src/features/products/ProductCard.tsx`, (대안 경로라면) `src/features/products/useProductList.ts`, `app/(tabs)/account.tsx`
- **삭제**: `app/(tabs)/explore.tsx`, 쓰지 않는 템플릿 컴포넌트

## 검증
1. **API 준비**: portfolio에서 `npm run dev`(포트 4000)를 띄운다. 이어서 `API_URL=http://localhost:4000 npm run api:pull && npm run api:gen`을 실행하고 생성 파일을 확인한다.
2. **정적 검사**: `npx tsc --noEmit`, `npm run lint`가 통과해야 한다.
3. **앱 실행**: `npx expo run:android`(에뮬레이터)로 실행하고 다음을 확인한다.
   - 하단 탭이 홈과 계정 두 개이고, 계정 탭에 플레이스홀더가 보인다.
   - 홈에 2컬럼 카드가 나오고 `194개 상품`이 표시된다. 할인율 배지와 `$` 가격이 보인다.
   - 끝까지 스크롤하면 `skip` 0→20→…→180 요청이 순서대로 가고, 마지막 페이지(14개) 뒤에는 추가 요청이 없다. next-api 서버 로그로 중복 요청과 빈 페이지 반복이 없는지 확인한다(문서 9.2 마지막 항목).
   - 당겨서 새로고침이 동작한다.
   - 서버를 끄면 에러 화면이 나오고, 서버를 다시 켠 뒤 재시도하면 복구된다.
   - 앱을 백그라운드로 보냈다가 돌아오면 재조회된다(focusManager 연결 확인).
4. **문서 갱신**: 결과에 따라 문서 8.3의 "rn-app 착수 시 확인 필요" 항목(Orval 무한 훅 생성 결과)을 갱신하자고 제안한다.
