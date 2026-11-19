import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePartnerStore } from '../context/PartnerStoreContext';
import { DemoModeBanner, PrimaryButton } from '../components/DemoBanner';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';

const APP_ICON = require('../../assets/icon.png');

/** Screen 1: Splash Screen */
export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace('Login');
    }, 1400);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.splashContainer}>
      <View style={styles.splashContent}>
        <Image source={APP_ICON} style={styles.splashLogo} resizeMode="contain" />
        <Text style={styles.splashBrand}>SANJIT MUSICAL STORE</Text>
        <Text style={styles.splashTitle}>SANJIT SHOP PARTNER</Text>
        <Text style={styles.splashTagline}>
          White-Label Seller App · Musical Instruments & Dance Costumes
        </Text>
        <View style={{ marginTop: 28, width: '100%' }}>
          <PrimaryButton
            title="Continue to Partner Login"
            variant="gold"
            onPress={() => navigation.replace('Login')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

/** Screen 2: Login Screen */
export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { startLoginOtp, pendingPhone } = usePartnerStore();
  const [phone, setPhone] = useState(pendingPhone);

  const handleSendOtp = () => {
    startLoginOtp(phone);
    navigation.navigate('OtpVerification');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <View style={styles.heroHeader}>
            <Image source={APP_ICON} style={styles.smallLogo} resizeMode="contain" />
            <Text style={styles.brandSub}>SANJIT MUSICAL STORE</Text>
            <Text style={styles.screenTitle}>Partner Sign In</Text>
            <Text style={styles.screenSubtitle}>
              Manage your branded musical & dance store from your Android phone
            </Text>
          </View>

          <DemoModeBanner />

          <View style={styles.card}>
            <Text style={styles.label}>Registered Mobile Number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98640 11022"
              placeholderTextColor={COLORS.inkMuted}
              style={styles.input}
            />

            <PrimaryButton
              title="Send Login OTP (Demo: 1234)"
              icon="lock-closed-outline"
              onPress={handleSendOtp}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ShopRegistration')}
              style={styles.linkRow}
            >
              <Text style={styles.linkText}>New seller? Register your branded shop</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/** Screen 3: Shop Registration Screen */
export const ShopRegistrationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { registerShopDemo } = usePartnerStore();
  const [shopName, setShopName] = useState('Brahmaputra Musicals & Dance');
  const [ownerName, setOwnerName] = useState('Sanjit Kalita');
  const [phone, setPhone] = useState('+91 98640 11022');
  const [city, setCity] = useState('Guwahati');
  const [gstNumber, setGstNumber] = useState('18AABCS1429B1Z5');

  const handleRegister = () => {
    if (!shopName.trim()) return;
    registerShopDemo({
      shopName: shopName.trim(),
      ownerName: ownerName.trim() || 'Partner Owner',
      phone: phone.trim() || '+91 98640 11022',
      city: city.trim() || 'Guwahati',
      gstNumber: gstNumber.trim(),
    });
    navigation.navigate('OtpVerification');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <DemoModeBanner note="Demo Shop Registration — Creates a local preview seller profile with no real KYC charge." />

          <View style={styles.card}>
            <Text style={styles.cardHeading}>Register Your Store</Text>

            <Text style={styles.label}>Store Name</Text>
            <TextInput value={shopName} onChangeText={setShopName} style={styles.input} />

            <Text style={styles.label}>Owner Full Name</Text>
            <TextInput value={ownerName} onChangeText={setOwnerName} style={styles.input} />

            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Text style={styles.label}>City</Text>
            <TextInput value={city} onChangeText={setCity} style={styles.input} />

            <Text style={styles.label}>GST Number (Optional)</Text>
            <TextInput value={gstNumber} onChangeText={setGstNumber} style={styles.input} />

            <PrimaryButton
              title="Register & Verify OTP"
              variant="gold"
              icon="storefront-outline"
              onPress={handleRegister}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/** Screen 4: OTP Verification Screen */
export const OtpVerificationScreen: React.FC = () => {
  const { pendingPhone, pendingOtp, verifyOtpDemo } = usePartnerStore();
  const [code, setCode] = useState(pendingOtp);
  const [error, setError] = useState('');

  const handleVerify = () => {
    setError('');
    const ok = verifyOtpDemo(code);
    if (!ok) {
      setError('Enter any 4-digit demo OTP (default: 1234)');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <DemoModeBanner note={`Demo OTP Verification — Use code ${pendingOtp} to sign into your seller dashboard.`} />

          <View style={styles.card}>
            <Text style={styles.cardHeading}>Verify Mobile OTP</Text>
            <Text style={styles.helperText}>
              4-digit demo verification code sent to {pendingPhone}
            </Text>

            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={4}
              style={[styles.input, styles.otpInput]}
              placeholder="1234"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PrimaryButton
              title="Verify & Open Dashboard"
              icon="checkmark-circle-outline"
              onPress={handleVerify}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.purpleDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  splashContent: {
    width: '100%',
    alignItems: 'center',
  },
  splashLogo: {
    width: 112,
    height: 112,
    borderRadius: 24,
    marginBottom: 18,
  },
  splashBrand: {
    color: COLORS.goldPrimary,
    fontSize: rs(12),
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  splashTitle: {
    color: COLORS.white,
    fontSize: rs(24),
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  splashTagline: {
    color: '#DDD6FE',
    fontSize: rs(13),
    textAlign: 'center',
    marginTop: 8,
    lineHeight: rs(19),
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollBody: {
    padding: SPACING.md,
    paddingBottom: 32,
  },
  heroHeader: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  smallLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 10,
  },
  brandSub: {
    color: COLORS.goldPrimary,
    fontSize: rs(11),
    fontWeight: '700',
    letterSpacing: 1,
  },
  screenTitle: {
    color: COLORS.white,
    fontSize: rs(20),
    fontWeight: '800',
    marginTop: 4,
  },
  screenSubtitle: {
    color: '#E9D5FF',
    fontSize: rs(12),
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    gap: 10,
  },
  cardHeading: {
    fontSize: rs(17),
    fontWeight: '800',
    color: COLORS.ink,
  },
  label: {
    fontSize: rs(12),
    fontWeight: '700',
    color: COLORS.ink,
  },
  helperText: {
    fontSize: rs(12),
    color: COLORS.inkSecondary,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: rs(14),
    color: COLORS.ink,
    backgroundColor: COLORS.canvas,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: rs(22),
    fontWeight: '800',
    letterSpacing: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: rs(12),
    fontWeight: '600',
  },
  linkRow: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.purplePrimary,
    fontWeight: '700',
    fontSize: rs(13),
  },
});
