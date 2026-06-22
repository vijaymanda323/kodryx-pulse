import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './src/theme/colors';

// Context
import { AuthProvider } from './src/context/AuthContext';
import useAuth from './src/hooks/useAuth';

// Auth Screens
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';

// Employee Screens
import EmployeeOverviewScreen from './src/screens/employee/EmployeeOverviewScreen';
import DailyStatusEntryScreen from './src/screens/employee/DailyStatusEntryScreen';
import MyLeavesScreen from './src/screens/employee/MyLeavesScreen';
import MyPayslipsScreen from './src/screens/employee/MyPayslipsScreen';

// Shared Screens
import TasksListScreen from './src/screens/shared/TasksListScreen';
import ProfileScreen from './src/screens/shared/ProfileScreen';

// Admin / HR Screens
import ManagerOverviewScreen from './src/screens/hr/ManagerOverviewScreen';
import ManagerApprovalsScreen from './src/screens/hr/ManagerApprovalsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Employee Stacks ---
const EmployeeHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Overview" component={EmployeeOverviewScreen} />
    <Stack.Screen name="Tasks" component={TasksListScreen} />
  </Stack.Navigator>
);

// --- Admin Stacks ---
const AdminHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Overview" component={ManagerOverviewScreen} />
    <Stack.Screen name="Tasks" component={TasksListScreen} />
    <Stack.Screen name="Approvals" component={ManagerApprovalsScreen} />
  </Stack.Navigator>
);

// --- Bottom Tab Navigators ---
const EmployeeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = 'grid-outline';
        else if (route.name === 'Daily Log') iconName = 'create-outline';
        else if (route.name === 'Leaves') iconName = 'airplane-outline';
        else if (route.name === 'Payroll') iconName = 'wallet-outline';
        else if (route.name === 'Profile') iconName = 'person-circle-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.cardBg,
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Home" component={EmployeeHomeStack} />
    <Tab.Screen name="Daily Log" component={DailyStatusEntryScreen} />
    <Tab.Screen name="Leaves" component={MyLeavesScreen} />
    <Tab.Screen name="Payroll" component={MyPayslipsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Admin Hub') iconName = 'stats-chart-outline';
        else if (route.name === 'Approvals') iconName = 'checkmark-done-circle-outline';
        else if (route.name === 'Tasks') iconName = 'list-outline';
        else if (route.name === 'Profile') iconName = 'person-circle-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.cardBg,
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Admin Hub" component={AdminHomeStack} />
    <Tab.Screen name="Approvals" component={ManagerApprovalsScreen} />
    <Tab.Screen name="Tasks" component={TasksListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// --- Auth Stack ---
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// --- Navigation Controller ---
const AppContent = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null; // Context handles default splash screen
  }

  const isAdmin = user?.role === 'HR' || user?.role === 'Founding Team';

  return (
    <NavigationContainer theme={{
      dark: true,
      colors: {
        background: colors.background,
        card: colors.cardBg,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
        notification: colors.accent,
      }
    }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {isAuthenticated ? (
        isAdmin ? <AdminTabs /> : <EmployeeTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
