// Sapiens illustration component.
// Drop-in wrapper for the figure PNGs in assets/illustrations/.
import { Image, StyleSheet, View } from 'react-native';

export type IllustrationName =
  | 'girl-standing'
  | 'girl-phone'
  | 'girl-desk'
  | 'girl-walking'
  | 'girl-cycling';

const SOURCES: Record<IllustrationName, ReturnType<typeof require>> = {
  'girl-standing': require('../../assets/illustrations/girl-standing.png'),
  'girl-phone':    require('../../assets/illustrations/girl-phone.png'),
  'girl-desk':     require('../../assets/illustrations/girl-desk.png'),
  'girl-walking':  require('../../assets/illustrations/girl-walking.png'),
  'girl-cycling':  require('../../assets/illustrations/girl-cycling.png'),
};

interface Props {
  name: IllustrationName;
  height?: number;
  width?: number;
}

export function Illustration({ name, height = 140, width }: Props) {
  return (
    <View style={{ height, width: width ?? height * 0.9, overflow: 'hidden' }}>
      <Image
        source={SOURCES[name]}
        style={styles.img}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  img: {
    width: '100%',
    height: '100%',
  },
});
