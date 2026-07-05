import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import TasksListScreen from '../screens/TasksListScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MembersScreen from '../screens/MembersScreen';
import AuditLogScreen from '../screens/AuditLogScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BottomTabBar from './BottomTabBar';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { isTablet, colors } = useTheme();
  const { issues, user, initialized } = useAppContext();

  // Wait for the first data load so the landing decision is based on real data
  // rather than the momentarily-empty initial state.
  if (!initialized) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

   // Always start with Issues tab as requested
   const initialRouteName = 'TasksList';

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Sidebar on tablet (left rail), floating bar on phone (bottom).
        tabBarPosition: isTablet ? 'left' : 'bottom',
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="TasksList" component={TasksListScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Members" component={MembersScreen} />
      <Tab.Screen name="AuditLog" component={AuditLogScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
