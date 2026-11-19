import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomerProvider, useCustomer } from './src/context/CustomerContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { CartCheckoutScreen } from './src/screens/CartCheckoutScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { configureCustomerNotificationHandler } from './src/services/pushNotificationService';
import { COLORS } from './src/theme/theme';
import { MainTabParamList, RootStackParamList } from './src/types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { cartCount, orders } = useCustomer();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.purplePrimary,
        tabBarInactiveTintColor: COLORS.inkMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Shop') iconName = focused ? 'storefront' : 'storefront-outline';
          if (route.name === 'Cart') iconName = focused ? 'cart' : 'cart-outline';
          if (route.name === 'Orders') iconName = focused ? 'cube' : 'cube-outline';
          if (route.name === 'Account') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Shop" component={CatalogScreen} options={{ title: 'Shops' }} />
      <Tab.Screen
        name="Cart"
        component={CartCheckoutScreen}
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.goldPrimary,
            color: COLORS.purpleDeep,
            fontWeight: '900',
            fontSize: 10,
          },
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'Orders',
          tabBarBadge: orders.length > 0 ? orders.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.purplePrimary,
            color: COLORS.white,
            fontWeight: '800',
            fontSize: 10,
          },
        }}
      />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, authLoading } = useCustomer();

  if (authLoading) {
    return (
      <View style={styles.splashLoader}>
        <ActivityIndicator size="large" color={COLORS.goldPrimary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    configureCustomerNotificationHandler();
  }, []);

  return (
    <SafeAreaProvider>
      <CustomerProvider>
        <StatusBar style="light" backgroundColor={COLORS.purpleDeep} />
        <AppNavigator />
      </CustomerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashLoader: {
    flex: 1,
    backgroundColor: COLORS.purpleDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
