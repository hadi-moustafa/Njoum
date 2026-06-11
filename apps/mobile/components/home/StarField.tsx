import { useRef, useEffect, memo } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// Generated once at module load — stable across renders
const STAR_DATA = Array.from({ length: 32 }, (_, i) => ({
  id:    i,
  x:     Math.random() * W,
  y:     Math.random() * H * 0.55,
  size:  Math.random() * 2.6 + 0.4,
  delay: Math.random() * 3500,
  dur:   Math.random() * 1400 + 1000,
  // Larger stars get a golden tint
  color: Math.random() > 0.8 ? '#E8C86A' : (Math.random() > 0.5 ? '#C4B2FF' : '#FFFFFF'),
}));

// Shooting star positions
const SHOOTING_STARS = [
  { x: W * 0.2, y: H * 0.08, angle: 30 },
  { x: W * 0.65, y: H * 0.15, angle: 25 },
];

interface StarProps {
  x: number; y: number; size: number;
  delay: number; dur: number; color: string;
}

const Star = memo(function Star({ x, y, size, delay, dur, color }: StarProps) {
  const opacity = useRef(new Animated.Value(0.15)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const durRef = useRef(dur).current;
  const delayRef = useRef(delay).current;

  useEffect(() => {
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: durRef, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.12, duration: durRef, useNativeDriver: true }),
      ]),
    );
    // Subtle scale pulse on larger stars
    const pulse = size > 2 ? Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.4, duration: durRef * 1.2, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,   duration: durRef * 1.2, useNativeDriver: true }),
      ]),
    ) : null;

    const timer = setTimeout(() => {
      twinkle.start();
      pulse?.start();
    }, delayRef);

    return () => {
      clearTimeout(timer);
      twinkle.stop();
      pulse?.stop();
    };
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x, top: y,
        width: size, height: size,
        borderRadius: size,
        backgroundColor: color,
        opacity,
        transform: [{ scale: scaleAnim }],
      }}
    />
  );
});

function ShootingStar({ x, y, angle }: { x: number; y: number; angle: number }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = () => {
      const delay = Math.random() * 12000 + 6000;
      const rad = (angle * Math.PI) / 180;
      translateX.setValue(0); translateY.setValue(0); opacity.setValue(0);
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.9, duration: 150, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
          Animated.timing(translateX, { toValue: Math.cos(rad) * 120, duration: 750, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: Math.sin(rad) * 120, duration: 750, useNativeDriver: true }),
        ]).start(run);
      }, delay);
      return timer;
    };
    const t = run();
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x, top: y,
        width: 60, height: 1.5,
        borderRadius: 1,
        backgroundColor: '#FFFFFF',
        opacity,
        transform: [
          { rotate: `${angle}deg` },
          { translateX },
          { translateY },
        ],
      }}
    />
  );
}

export function StarField() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {STAR_DATA.map(s => <Star key={s.id} {...s} />)}
      {SHOOTING_STARS.map((s, i) => <ShootingStar key={i} {...s} />)}
    </View>
  );
}
