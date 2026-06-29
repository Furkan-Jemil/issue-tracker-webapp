import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Outfit_700Bold, Outfit_600SemiBold, Outfit_500Medium, Outfit_400Regular } from '@expo-google-fonts/outfit';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { AppProvider } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import CreateTaskScreen from './src/screens/CreateTaskScreen';
import AuditLogScreen from './src/screens/AuditLogScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminSettingsScreen from './src/screens/AdminSettingsScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import { useTheme } from './src/theme/useTheme';

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={MainTabNavigator} />
      <MainStack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <MainStack.Screen name="CreateTask" component={CreateTaskScreen} />
      <MainStack.Screen name="AuditLog" component={AuditLogScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    </MainStack.Navigator>
  );
}

function NavShell() {
  const { colors } = useTheme();
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.foreground,
          border: colors.border,
          notification: colors.error,
        },
        fonts: {
          regular: { fontFamily: 'Outfit_400Regular', fontWeight: '400' },
          medium: { fontFamily: 'Outfit_500Medium', fontWeight: '500' },
          bold: { fontFamily: 'Outfit_700Bold', fontWeight: '700' },
          heavy: { fontFamily: 'Outfit_700Bold', fontWeight: '700' },
        },
      }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Auth" component={AuthStack} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_700Bold,
    Outfit_600SemiBold,
    Outfit_500Medium,
    Outfit_400Regular,
    JetBrainsMono_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#80ca28" />
      </View>
    );
  }

  return (
    <AppProvider>
      <NavShell />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
  },
});
