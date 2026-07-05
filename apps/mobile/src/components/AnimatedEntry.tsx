import React, { useEffect, useRef } from 'react';
import { ViewStyle, Animated } from 'react-native';

interface AnimatedEntryProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
}

export default function AnimatedEntry({ children, index = 0, delay = 50, style }: AnimatedEntryProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: index * Math.min(delay, 50),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * Math.min(delay, 50),
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
