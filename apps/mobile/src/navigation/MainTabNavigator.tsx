import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import TasksListScreen from '../screens/TasksListScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MembersScreen from '../screens/MembersScreen';
import AuditLogScreen from '../screens/AuditLogScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BottomTabBar from './BottomTabBar';
import { useTheme } from '../theme/useTheme';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { isTablet } = useTheme();
  return (
    <Tab.Navigator
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
