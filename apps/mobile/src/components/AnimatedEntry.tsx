import React, { useRef, useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AnimatedEntryProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: ViewStyle;
}

export default function AnimatedEntry({ children, index = 0, delay = 50, style }: AnimatedEntryProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, {
        toValue: 1,
        tension: 100,
        friction: 12,
        delay: index * delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 12,
        delay: index * delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, delay, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
