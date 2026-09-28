import { Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

export type DetailTab = 'info' | 'reviews' | 'taste';

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'info', label: '상품정보' },
  { key: 'reviews', label: '고객리뷰' },
  { key: 'taste', label: '취향분석' },
];

type Props = {
  value: DetailTab;
  onChange: (tab: DetailTab) => void;
  onLayout?: (e: LayoutChangeEvent) => void;
};

// Opaque background: it sticks over scrolling content in the detail screen.
export function DetailTabBar({ value, onChange, onLayout }: Props) {
  const activeColor = useThemeColor({}, 'text');

  return (
    <ThemedView style={styles.bar} onLayout={onLayout}>
      {TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, active && { borderBottomColor: activeColor }]}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <ThemedText style={[styles.label, active ? styles.activeLabel : styles.muted]}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8886',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: {
    fontSize: 15,
  },
  activeLabel: {
    fontWeight: '700',
  },
  muted: {
    color: '#888',
  },
});
