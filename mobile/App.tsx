import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { PartnerStoreProvider, usePartnerStore } from './src/context/PartnerStoreContext';
import { COLORS, RADIUS, rs } from './src/theme/theme';
import {
  configureForegroundNotificationHandler,
  parseFcmTapPayload,
} from './src/services/fcmService';
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
import { NotificationCenterScreen } from './src/screens/NotificationCenterScreen';
import { CustomerFeedbackScreen } from './src/screens/CustomerFeedbackScreen';

configureForegroundNotificationHandler();

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef<any>();

const sharedHeaderOptions = {
  headerStyle: { backgroundColor: COLORS.purplePrimary },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 16 },
};

function HeaderNotificationBell() {
  const { unreadNotificationCount } = usePartnerStore();
  return (
    <TouchableOpacity
      onPress={() => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('Notifications');
        }
      }}
      style={styles.bellBtn}
      accessibilityLabel="Open FCM Push Alerts"
    >
      <Ionicons name="notifications-outline" size={22} color={COLORS.goldPrimary} />
      {unreadNotificationCount > 0 ? (
        <View style={styles.bellBadge}>
          <Text style={styles.bellBadgeText}>
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function FcmHeadsUpOverlay() {
  const { activeBanner, dismissBanner, markNotificationRead } = usePartnerStore();
  if (!activeBanner) return null;

  const handleTap = () => {
    markNotificationRead(activeBanner.id);
    dismissBanner();
    if (!navigationRef.isReady()) return;
    if (activeBanner.type === 'LOW_STOCK') {
      navigationRef.navigate('InventoryManagement');
    } else {
      navigationRef.navigate('OrderDetails', { orderId: activeBanner.referenceId });
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={handleTap} style={styles.bannerOverlay}>
      <View style={styles.bannerIcon}>
        <Ionicons
          name={activeBanner.type === 'LOW_STOCK' ? 'alert-circle' : 'notifications'}
          size={18}
          color={COLORS.goldPrimary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.bannerTitle}>
          {activeBanner.title}
        </Text>
        <Text numberOfLines={2} style={styles.bannerBody}>
          {activeBanner.body}
        </Text>
      </View>
      <TouchableOpacity onPress={dismissBanner} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={18} color="#E9D5FF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function MainBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...sharedHeaderOptions,
        headerRight: () => <HeaderNotificationBell />,
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

  useEffect(() => {
    if (!isAuthenticated) return;

    const routePayload = (response: Notifications.NotificationResponse | null) => {
      const payload = parseFcmTapPayload(response);
      if (!payload || !navigationRef.isReady()) return;
      if (payload.type === 'LOW_STOCK') {
        navigationRef.navigate('InventoryManagement');
      } else {
        navigationRef.navigate('OrderDetails', { orderId: payload.referenceId });
      }
    };

    void Notifications.getLastNotificationResponseAsync().then(routePayload);

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      routePayload(response);
    });

    return () => {
      responseSub.remove();
    };
  }, [isAuthenticated]);

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
    <>
      <RootStack.Navigator screenOptions={sharedHeaderOptions}>
        <RootStack.Screen
          name="MainTabs"
          component={MainBottomTabs}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Notifications"
          component={NotificationCenterScreen}
          options={{ title: 'FCM Push Alerts' }}
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
          name="CustomerFeedback"
          component={CustomerFeedbackScreen}
          options={{ title: 'Customer Feedback' }}
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
      <FcmHeadsUpOverlay />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PartnerStoreProvider>
        <StatusBar style="light" backgroundColor={COLORS.purpleDark} />
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </PartnerStoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    marginRight: 12,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    backgroundColor: COLORS.purpleDark,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: COLORS.goldPrimary,
    fontSize: rs(12),
    fontWeight: '800',
  },
  bannerBody: {
    color: COLORS.white,
    fontSize: rs(11),
    marginTop: 2,
  },
});
