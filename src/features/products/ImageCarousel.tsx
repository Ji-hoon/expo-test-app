import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

type Props = {
  images: string[];
};

export function ImageCarousel({ images }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ width, height: width }}>
      <FlatList
        data={images}
        keyExtractor={(uri, i) => `${i}:${uri}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <Image
            source={item}
            style={[styles.image, { width, height: width }]}
            contentFit="cover"
            transition={150}
          />
        )}
      />
      {images.length > 1 ? (
        <View style={styles.indicator}>
          <Text style={styles.indicatorText}>
            {index + 1} / {images.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#8882',
  },
  indicator: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#0008',
  },
  indicatorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
