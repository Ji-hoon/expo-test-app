import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import type { ProductSummary } from '@/src/api/generated/model';
import { ProductCard } from '@/src/features/products/ProductCard';
import { useProductList } from '@/src/features/products/useProductList';

export default function HomeScreen() {
  const {
    data,
    error,
    isPending,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductList();

  // onEndReached can fire repeatedly; only one next-page request at a time.
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback<ListRenderItem<ProductSummary>>(
    ({ item, index }) => <ProductCard product={item} column={index % 2 === 0 ? 0 : 1} />,
    [],
  );

  let content: React.ReactNode;
  if (isPending) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  } else if (isError && !data) {
    content = (
      <View style={styles.center}>
        <ThemedText type="defaultSemiBold">{error.code}</ThemedText>
        <ThemedText style={styles.muted}>{error.message}</ThemedText>
        <Pressable style={styles.retry} onPress={() => refetch()}>
          <ThemedText>다시 시도</ThemedText>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <FlashList
        data={data.items}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching && !isFetchingNextPage}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.countBar}>
            <ThemedText style={styles.count}>{data.total}개 상품</ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <ThemedText style={styles.muted}>상품이 없습니다.</ThemedText>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : null
        }
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <ThemedText style={styles.headerTitle}>Shop</ThemedText>
      </SafeAreaView>
      {content}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8886',
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    paddingVertical: 12,
  },
  countBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  count: {
    fontSize: 15,
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
  footer: {
    paddingVertical: 24,
  },
});
