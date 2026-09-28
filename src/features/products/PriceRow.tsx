import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type Props = {
  price: number;
  discountPercentage: number;
  style?: ViewStyle;
};

// Prices are shown as delivered by the server; no client-side discount math.
export function PriceRow({ price, discountPercentage, style }: Props) {
  const discount = Math.round(discountPercentage);

  return (
    <View style={[styles.row, style]}>
      {discount > 0 ? (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{discount}%</ThemedText>
        </View>
      ) : null}
      <ThemedText style={styles.price}>${price.toFixed(2)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
