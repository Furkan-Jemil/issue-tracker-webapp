import React, { useEffect, useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Dimensions, LayoutRectangle, Animated } from 'react-native';
import { useTheme } from '../../theme/useTheme';

export interface ContextualPopoverProps {
  visible: boolean;
  onClose: () => void;
  /** Viewport coordinates of the triggering element */
  anchorRect: LayoutRectangle | null;
  children: React.ReactNode;
  /** Optional fixed width for the popover */
  width?: number;
  /** Gap between anchor and popover */
  offset?: number;
}

export default function ContextualPopover({
  visible,
  onClose,
  anchorRect,
  children,
  width = 200,
  offset = 8,
}: ContextualPopoverProps) {
  const { colors, radius, spacing } = useTheme();
  const [contentHeight, setContentHeight] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && anchorRect) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, anchorRect, fadeAnim]);

  if (!visible || !anchorRect) return null;

  const { width: screenW, height: screenH } = Dimensions.get('window');

  // Calculate X position
  // Prefer aligning right edge of popover with right edge of anchor
  let left = anchorRect.x + anchorRect.width - width;
  
  // If it goes off the left screen edge, snap to left margin
  if (left < spacing.md) {
    left = spacing.md;
  }
  // If it goes off the right screen edge, snap to right margin
  if (left + width > screenW - spacing.md) {
    left = screenW - width - spacing.md;
  }

  // Calculate Y position
  // Prefer rendering below the anchor
  let top = anchorRect.y + anchorRect.height + offset;
  
  // If it goes off the bottom screen edge, flip it to render above the anchor
  if (contentHeight > 0 && top + contentHeight > screenH - spacing.xl) {
    top = anchorRect.y - contentHeight - offset;
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close menu"
      />
      <Animated.View
        style={[
          styles.popover,
          {
            backgroundColor: colors.card,
            borderRadius: radius.xl,
            borderColor: colors.cardBorder,
            width,
            left,
            top,
            opacity: fadeAnim,
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          },
        ]}
        onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  popover: {
    position: 'absolute',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
});

export function ContextualAnchor({
  children,
  onPressAnchor,
  ...props
}: {
  children: React.ReactNode;
  onPressAnchor: (rect: LayoutRectangle) => void;
} & React.ComponentProps<typeof TouchableOpacity>) {
  const ref = React.useRef<View>(null);
  return (
    <View ref={ref} collapsable={false}>
      <TouchableOpacity
        {...props}
        onPress={(e) => {
          ref.current?.measureInWindow((x, y, width, height) => {
            onPressAnchor({ x, y, width, height });
          });
        }}
      >
        {children}
      </TouchableOpacity>
    </View>
  );
}
