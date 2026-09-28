import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import type { ProductDetail } from '@/src/api/generated/model';

import type { DetailTab } from './DetailTabBar';
import { PriceRow } from './PriceRow';

type Props = {
  tab: DetailTab;
  product: ProductDetail;
};

export function DetailTabContent({ tab, product }: Props) {
  if (tab === 'info') return <ProductInfo product={product} />;
  if (tab === 'reviews') {
    return <Placeholder title="고객리뷰" paragraphs={REVIEW_PARAGRAPHS} />;
  }
  return <Placeholder title="취향분석" paragraphs={TASTE_PARAGRAPHS} />;
}

function ProductInfo({ product }: { product: ProductDetail }) {
  const meta = [product.brand, product.category].filter(Boolean).join(' · ');
  const policies = [
    ['배송', product.shippingInformation],
    ['보증', product.warrantyInformation],
    ['반품', product.returnPolicy],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <View style={styles.section}>
      {meta ? <ThemedText style={styles.muted}>{meta}</ThemedText> : null}
      <ThemedText style={styles.title}>{product.title}</ThemedText>
      <PriceRow price={product.price} discountPercentage={product.discountPercentage} />
      <ThemedText style={styles.muted}>
        ★ {product.rating.toFixed(1)} · 재고 {product.stock}개
        {product.availabilityStatus ? ` · ${product.availabilityStatus}` : ''}
      </ThemedText>
      <ThemedText style={styles.body}>{product.description}</ThemedText>
      {policies.length > 0 ? (
        <View style={styles.table}>
          {policies.map(([label, value]) => (
            <View key={label} style={styles.tableRow}>
              <ThemedText style={[styles.muted, styles.tableLabel]}>{label}</ThemedText>
              <ThemedText style={styles.tableValue}>{value}</ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Placeholder({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {paragraphs.map((text, i) => (
        <ThemedText key={i} style={styles.body}>
          {text}
        </ThemedText>
      ))}
    </View>
  );
}

// Dummy copy until the reviews / taste features exist.
const REVIEW_PARAGRAPHS = [
  '아직 연결된 리뷰 데이터가 없습니다. 이 영역에는 구매 고객의 별점, 사진 리뷰, 옵션별 후기가 표시될 예정입니다.',
  '“배송이 빨랐고 사진과 실물이 거의 같아요. 재구매 의사 있습니다.” — 더미 리뷰',
  '“가격 대비 만족스럽습니다. 포장도 꼼꼼했어요.” — 더미 리뷰',
  '“색상이 화면보다 조금 더 밝지만 마음에 듭니다.” — 더미 리뷰',
  '“선물용으로 샀는데 받는 분이 좋아했어요.” — 더미 리뷰',
  '“사이즈가 생각보다 작아서 한 단계 큰 걸로 교환했습니다.” — 더미 리뷰',
];

const TASTE_PARAGRAPHS = [
  '취향분석은 준비 중입니다. 이 영역에는 비슷한 상품을 구매한 고객의 선호 경향이 표시될 예정입니다.',
  '예시: 이 상품을 본 고객의 68%가 같은 브랜드의 다른 상품도 함께 살펴봤습니다.',
  '예시: 20–30대 고객의 선호도가 높고, 주말 구매 비중이 큽니다.',
  '예시: 함께 많이 담은 카테고리는 뷰티, 액세서리 순입니다.',
  '예시: 재구매율이 동일 카테고리 평균보다 높습니다.',
];

const styles = StyleSheet.create({
  section: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  muted: {
    color: '#888',
    fontSize: 14,
  },
  table: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#8886',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8886',
  },
  tableLabel: {
    width: 56,
  },
  tableValue: {
    flex: 1,
    fontSize: 14,
  },
});
