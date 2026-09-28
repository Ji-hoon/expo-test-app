import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import type { ProductSummary } from '@/src/api/generated/model';

import { PriceRow } from './PriceRow';

type Props = {
  product: ProductSummary;
  column: 0 | 1;
};

function ProductCardBase({ product, column }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={[styles.card, column === 0 ? styles.left : styles.right]}
      onPress={() =>
        router.push({ pathname: '/product/[id]', params: { id: String(product.id) } })
      }>
      <Image
        source={product.thumbnail}
        style={styles.image}
        contentFit="cover"
        transition={150}
        recyclingKey={String(product.id)}
      />
      <View style={styles.body}>
        <ThemedText style={styles.title} numberOfLines={2}>
          {product.title}
        </ThemedText>
        {product.brand ? (
          <ThemedText style={styles.brand} numberOfLines={1}>
            {product.brand}
          </ThemedText>
        ) : null}
        <PriceRow
          price={product.price}
          discountPercentage={product.discountPercentage}
          style={styles.priceRow}
        />
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardBase);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginBottom: 24,
  },
  left: { marginRight: 1 },
  right: { marginLeft: 1 },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#8882',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  brand: {
    fontSize: 13,
    lineHeight: 18,
    color: '#888',
  },
  priceRow: {
    marginTop: 4,
  },
});
