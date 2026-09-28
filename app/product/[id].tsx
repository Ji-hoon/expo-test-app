import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useProduct } from '@/src/features/products/useProduct';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const validId = Number.isInteger(productId) && productId > 0;
  // An invalid id disables the query (Orval sets enabled: !!id), so guard it here.
  const { data: product, error, isPending, isError, refetch } = useProduct(
    validId ? productId : 0,
  );

  let content: React.ReactNode;
  if (!validId || error?.code === 'NOT_FOUND') {
    content = (
      <View style={styles.center}>
        <ThemedText style={styles.muted}>상품을 찾을 수 없습니다.</ThemedText>
      </View>
    );
  } else if (isError) {
    content = (
      <View style={styles.center}>
        <ThemedText type="defaultSemiBold">{error.code}</ThemedText>
        <ThemedText style={styles.muted}>{error.message}</ThemedText>
        <Pressable style={styles.retry} onPress={() => refetch()}>
          <ThemedText>다시 시도</ThemedText>
        </Pressable>
      </View>
    );
  } else if (isPending) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  } else {
    content = (
      <ScrollView>
        <ThemedText style={styles.title}>{product.title}</ThemedText>
      </ScrollView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: product?.title ?? '' }} />
      {content}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  muted: {
    color: '#888',
    fontSize: 14,
  },
  retry: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#8886',
    borderRadius: 6,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    padding: 20,
  },
});
