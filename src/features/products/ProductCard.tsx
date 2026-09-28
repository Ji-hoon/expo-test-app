import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import type { ProductSummary } from '@/src/api/generated/model';

type Props = {
  product: ProductSummary;
  column: 0 | 1;
};

// Prices are shown as delivered by the server; no client-side discount math.
function ProductCardBase({ product, column }: Props) {
  const discount = Math.round(product.discountPercentage);

  return (
    <Pressable style={[styles.card, column === 0 ? styles.left : styles.right]}>
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
        <View style={styles.priceRow}>
          {discount > 0 ? (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{discount}%</ThemedText>
            </View>
          ) : null}
          <ThemedText style={styles.price}>${product.price.toFixed(2)}</ThemedText>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#EF7A92',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  price: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
});
