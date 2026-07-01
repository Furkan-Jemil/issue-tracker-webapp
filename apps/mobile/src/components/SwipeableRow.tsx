import React, { useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Trash2 } from 'lucide-react-native';

const THRESHOLD = -80;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export default function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if ((!isOpen.current && g.dx < 0) || (isOpen.current && g.dx > 0)) {
          pan.x.setValue(g.dx + (isOpen.current ? THRESHOLD : 0));
        }
      },
      onPanResponderRelease: (_, g) => {
        const finalX = g.dx + (isOpen.current ? THRESHOLD : 0);
        if (finalX < THRESHOLD * 0.6) {
          Animated.spring(pan.x, { toValue: THRESHOLD, useNativeDriver: true }).start();
          isOpen.current = true;
        } else {
          Animated.spring(pan.x, { toValue: 0, useNativeDriver: true }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const onDeletePress = () => {
    Animated.timing(pan.x, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => {
      onDelete();
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.deleteContainer}>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDeletePress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Delete issue">
          <Trash2 size={18} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={{ transform: [{ translateX: pan.x }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden' },
  deleteContainer: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center', width: 80 },
  deleteBtn: { flex: 1, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', gap: 4 },
  deleteText: { color: '#fff', fontFamily: 'Outfit_600SemiBold', fontSize: 11 },
});
