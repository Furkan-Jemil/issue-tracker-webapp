import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { LayoutDashboard, ListTodo, Users, Bell, Plus } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  TasksList: ListTodo,
  Members: Users,
  Notifications: Bell,
};

function TabIcon({ Icon, isFocused, color }: { Icon: React.ElementType; isFocused: boolean; color: string }) {
  const scale = useRef(new Animated.Value(isFocused ? 1 : 0.85)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1 : 0.85,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  }, [isFocused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon size={22} color={color} />
    </Animated.View>
  );
}

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, typography, radius, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.floatingBar,
          {
            backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(248,249,255,0.92)',
            borderColor: colors.outlineVariant,
            shadowColor: isDark ? '#000' : '#0b1c30',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const descriptor = descriptors[route.key];
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const Icon = TAB_ICONS[route.name];

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              {Icon && (
                <View
                  style={[
                    styles.iconWrap,
                    isFocused && {
                      backgroundColor: colors.primaryContainer + '20',
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <TabIcon Icon={Icon} isFocused={isFocused} color={isFocused ? colors.primary : colors.onSurfaceVariant} />
                </View>
              )}
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? colors.primary : colors.onSurfaceVariant,
                    marginTop: 2,
                  },
                ]}
              >
                {route.name === 'Dashboard'
                  ? 'Home'
                  : route.name === 'TasksList'
                    ? 'Issues'
                    : route.name === 'Notifications'
                      ? 'Alerts'
                      : route.name === 'Members'
                        ? 'Members'
                        : ''}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* FAB */}
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateTask' as any)}
          activeOpacity={0.85}
          style={[
            styles.fab,
            {
              backgroundColor: colors.primaryContainer,
              shadowColor: colors.primary,
            },
          ]}
        >
          <Plus size={28} color={colors.onPrimaryContainer} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    pointerEvents: 'box-none',
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '92%',
    maxWidth: 500,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    paddingHorizontal: 8,
    gap: 4,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {}),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    top: -20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
});
