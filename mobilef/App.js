import 'react-native-gesture-handler'; // MUST BE AT THE VERY TOP
import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import Constants from 'expo-constants';

// Import your screens
import HomeScreen from './screens/HomeScreen';
import AddScreen from './screens/AddScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';

// Import Supabase
import { SupabaseProvider, useSupabase } from './context/SupabaseContext';

// Import ErrorBoundary
import ErrorBoundary from './components/ErrorBoundary';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Validate environment variables on app start - DON'T THROW, just warn
const validateEnvironment = () => {
  try {
    const { extra } = Constants.expoConfig || Constants.manifest || {};
    
    if (!extra?.SUPABASE_URL) {
      console.warn('Warning: Missing SUPABASE_URL in app.json');
    }
    
    if (!extra?.SUPABASE_ANON_KEY) {
      console.warn('Warning: Missing SUPABASE_ANON_KEY in app.json');
    }
    
    if (!extra?.BACKEND_API_URL) {
      console.warn('Warning: Missing BACKEND_API_URL in app.json - using default');
    }
    
    console.log('✅ Environment validation complete');
  } catch (error) {
    console.warn('Environment validation error:', error.message);
  }
};

// Validate on import (safe - won't crash)
validateEnvironment();

// ✅ MAIN TAB NAVIGATOR (without Add tab)
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#06b6d4',
        tabBarInactiveTintColor: '#71717a',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a0b2e',
          borderTopWidth: 1,
          borderTopColor: '#2a1a4a',
          paddingBottom: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ✅ STACK NAVIGATOR (includes modal Add screen)
function AppStack() {
  const { session, loading } = useSupabase();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="MainTabs" component={AppTabs} />
          <Stack.Screen 
            name="Add" 
            component={AddScreen}
            options={{
              presentation: 'modal',
              gestureEnabled: true,
              cardStyle: { backgroundColor: '#09090b' },
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

// ✅ ROOT APP COMPONENT
export default function App() {
  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <NavigationContainer>
          <AppStack />
        </NavigationContainer>
      </SupabaseProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  }
});