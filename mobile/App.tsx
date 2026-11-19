import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { PartnerStoreProvider, usePartnerStore } from './src/context/PartnerStoreContext';
import { COLORS } from './src/theme/theme';
import {
  LoginScreen,
  OtpVerificationScreen,
  ShopRegistrationScreen,
  SplashScreen,
} from './src/screens/AuthScreens';
import {
  AddProductScreen,
  InventoryManagementScreen,
  ProductManagementScreen,
  SellerDashboardScreen,
} from './src/screens/HomeAndProductScreens';
import {
  CustomerDetailsScreen,
  DeliveryManagementScreen,
  NewOrdersScreen,
  OrderDetailsScreen,
  OrderTrackingScreen,
} from './src/screens/OrderAndCustomerScreens';
import {
  EarningsScreen,
  PlatformCommissionScreen,
  SalesReportsScreen,
  SubscriptionPaymentsScreen,
  SubscriptionPlansScreen,
  WithdrawalRequestsScreen,
} from './src/screens/FinanceScreens';
import {
  CustomerChatScreen,
  SettingsScreen,
  ShopProfileScreen,
} from './src/screens/ProfileAndChatScreens';

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const sharedHeaderOptions = {
  headerStyle: { backgroundColor: COLORS.purplePrimary },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 16 },
};

function MainBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...sharedHeaderOptions,
        tabBarActiveTintColor: COLORS.purplePrimary,
        tabBarInactiveTintColor: COLORS.inkMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.purpleBorder,
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            HomeTab: 'home-outline',
            OrdersTab: 'receipt-outline',
            ProductsTab: 'cube-outline',
            EarningsTab: 'wallet-outline',
            ProfileTab: 'person-circle-outline',
          };
          return <Ionicons name={iconMap[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={SellerDashboardScreen}
        options={{ title: 'Home', headerTitle: 'Sanjit Shop Partner' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={NewOrdersScreen}
        options={{ title: 'Orders', headerTitle: 'Orders & Fulfillment' }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductManagementScreen}
        options={{ title: 'Products', headerTitle: 'Product Catalogue' }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{ title: 'Earnings', headerTitle: 'Earnings & Payouts' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ShopProfileScreen}
        options={{ title: 'Profile', headerTitle: 'Shop Profile' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = usePartnerStore();

  if (!isAuthenticated) {
    return (
      <AuthStack.Navigator screenOptions={sharedHeaderOptions}>
        <AuthStack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <AuthStack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Partner Login' }}
        />
        <AuthStack.Screen
          name="ShopRegistration"
          component={ShopRegistrationScreen}
          options={{ title: 'Shop Registration' }}
        />
        <AuthStack.Screen
          name="OtpVerification"
          component={OtpVerificationScreen}
          options={{ title: 'OTP Verification' }}
        />
      </AuthStack.Navigator>
    );
  }

  return (
    <RootStack.Navigator screenOptions={sharedHeaderOptions}>
      <RootStack.Screen
        name="MainTabs"
        component={MainBottomTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ title: 'Add / Edit Product' }}
      />
      <RootStack.Screen
        name="InventoryManagement"
        component={InventoryManagementScreen}
        options={{ title: 'Inventory Management' }}
      />
      <RootStack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: 'Order Details' }}
      />
      <RootStack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: 'Order Tracking' }}
      />
      <RootStack.Screen
        name="CustomerDetails"
        component={CustomerDetailsScreen}
        options={{ title: 'Customer Details' }}
      />
      <RootStack.Screen
        name="SalesReports"
        component={SalesReportsScreen}
        options={{ title: 'Sales Reports' }}
      />
      <RootStack.Screen
        name="PlatformCommission"
        component={PlatformCommissionScreen}
        options={{ title: 'Platform Commission' }}
      />
      <RootStack.Screen
        name="SubscriptionPlans"
        component={SubscriptionPlansScreen}
        options={{ title: 'Subscription Plans' }}
      />
      <RootStack.Screen
        name="SubscriptionPayments"
        component={SubscriptionPaymentsScreen}
        options={{ title: 'Subscription Payments' }}
      />
      <RootStack.Screen
        name="WithdrawalRequests"
        component={WithdrawalRequestsScreen}
        options={{ title: 'Withdrawal Requests' }}
      />
      <RootStack.Screen
        name="CustomerChat"
        component={CustomerChatScreen}
        options={{ title: 'Customer Chat' }}
      />
      <RootStack.Screen
        name="DeliveryManagement"
        component={DeliveryManagementScreen}
        options={{ title: 'Delivery Management' }}
      />
      <RootStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'App Settings' }}
      />
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PartnerStoreProvider>
        <StatusBar style="light" backgroundColor={COLORS.purpleDark} />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PartnerStoreProvider>
    </SafeAreaProvider>
  );
}
