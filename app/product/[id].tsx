import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { DetailTabBar, type DetailTab } from '@/src/features/products/DetailTabBar';
import { DetailTabContent } from '@/src/features/products/DetailTabContent';
import { ImageCarousel } from '@/src/features/products/ImageCarousel';
import { useProduct } from '@/src/features/products/useProduct';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const validId = Number.isInteger(productId) && productId > 0;
  // An invalid id disables the query (Orval sets enabled: !!id), so guard it here.
  const { data: product, error, isPending, isError, refetch } = useProduct(
    validId ? productId : 0,
  );
  const [tab, setTab] = useState<DetailTab>('info');
  const [viewportHeight, setViewportHeight] = useState(0);
  const [tabBarHeight, setTabBarHeight] = useState(0);

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
      // Child 1 (tab bar) pins to the top once the carousel scrolls away. Content is at
      // least as tall as the space under the pinned bar so short tabs can still reach it.
      <ScrollView
        stickyHeaderIndices={[1]}
        onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}>
        <ImageCarousel images={product.images.length ? product.images : [product.thumbnail]} />
        <DetailTabBar
          value={tab}
          onChange={setTab}
          onLayout={(e) => setTabBarHeight(e.nativeEvent.layout.height)}
        />
        <View style={{ minHeight: Math.max(0, viewportHeight - tabBarHeight) }}>
          <DetailTabContent tab={tab} product={product} />
        </View>
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
});
