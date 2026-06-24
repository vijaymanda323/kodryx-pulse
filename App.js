import React from 'react';
import { StatusBar, Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './src/theme/colors';

// Context
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import ProjectsScreen from './src/screens/shared/ProjectsScreen';
import ProjectDetailScreen from './src/screens/shared/ProjectDetailScreen';
import TeamScreen from './src/screens/shared/TeamScreen';
import EmployeeWorkflowScreen from './src/screens/shared/EmployeeWorkflowScreen';
import AIInsightsScreen from './src/screens/shared/AIInsightsScreen';
import EscalationsScreen from './src/screens/shared/EscalationsScreen';

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
    <Stack.Screen name="Projects" component={ProjectsScreen} />
    <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
    <Stack.Screen name="Team" component={TeamScreen} />
    <Stack.Screen name="EmployeeWorkflow" component={EmployeeWorkflowScreen} />
    <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
    <Stack.Screen name="Escalations" component={EscalationsScreen} />
  </Stack.Navigator>
);

// --- Admin Stacks ---
const AdminHomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Overview" component={ManagerOverviewScreen} />
    <Stack.Screen name="Tasks" component={TasksListScreen} />
    <Stack.Screen name="Approvals" component={ManagerApprovalsScreen} />
    <Stack.Screen name="Projects" component={ProjectsScreen} />
    <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
    <Stack.Screen name="Team" component={TeamScreen} />
    <Stack.Screen name="EmployeeWorkflow" component={EmployeeWorkflowScreen} />
    <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
    <Stack.Screen name="Escalations" component={EscalationsScreen} />
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
        backgroundColor: colors.backgroundSecondary,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        elevation: 0,
        shadowOpacity: 0,
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
        backgroundColor: colors.backgroundSecondary,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        elevation: 0,
        shadowOpacity: 0,
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

  // Check for OTA updates
  /* React.useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            'Update Available',
            'A new version of KODRYX Pulse is available. Would you like to update now?',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Update',
                onPress: async () => {
                  try {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (e) {
                    Alert.alert('Error', 'Failed to download the update. Please try again later.');
                  }
                }
              }
            ]
          );
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      }
    }
    
    checkForUpdates();
  }, []); */

  return (
    <>
      <NavigationContainer theme={{
        dark: true,
        colors: {
          background: '#FFFFFF',
          card: colors.cardBg,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
          notification: colors.accent,
        }
      }}>
        {isAuthenticated ? (
          isAdmin ? <AdminTabs /> : <EmployeeTabs />
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
