import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';
import { useCustomer } from '../context/CustomerContext';
import { COLORS, RADIUS, rs } from '../theme/theme';

export const AuthScreen: React.FC = () => {
  const { loginWithEmail, registerWithEmail, continueAsDemoCustomer } = useCustomer();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );

  const handleSubmit = async () => {
    setFeedback(null);

    if (!email.trim() || !email.includes('@')) {
      setFeedback({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (password.length < 6) {
      setFeedback({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (mode === 'REGISTER' && name.trim().length < 2) {
      setFeedback({ type: 'error', text: 'Please enter your full name.' });
      return;
    }

    setSubmitting(true);
    const res =
      mode === 'LOGIN'
        ? await loginWithEmail(email, password)
        : await registerWithEmail({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            password,
          });
    setSubmitting(false);

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.message });
    } else {
      setFeedback({ type: 'success', text: res.message });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Hero */}
          <View style={styles.heroCard}>
            <View style={styles.brandIconWrap}>
              <Ionicons name="musical-notes" size={rs(28)} color={COLORS.purpleDeep} />
            </View>
            <Text style={styles.brandTitle}>SANJIT MUSICAL STORE</Text>
            <Text style={styles.brandSubtitle}>
              Official Customer Shopping App • Instruments, Pro Audio & Dance Costumes
            </Text>
            <View style={styles.featurePillsRow}>
              <View style={styles.featureChip}>
                <Ionicons name="storefront-outline" size={13} color={COLORS.goldPrimary} />
                <Text style={styles.featureChipText}>4 Verified Shops</Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="flash-outline" size={13} color={COLORS.goldPrimary} />
                <Text style={styles.featureChipText}>UPI & COD</Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="notifications-outline" size={13} color={COLORS.goldPrimary} />
                <Text style={styles.featureChipText}>Live Tracking</Text>
              </View>
            </View>
          </View>

          {/* Auth Card */}
          <View style={styles.formCard}>
            <View style={styles.modeSwitch}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'LOGIN' && styles.modeBtnActive]}
                onPress={() => {
                  setMode('LOGIN');
                  setFeedback(null);
                }}
              >
                <Text style={[styles.modeBtnText, mode === 'LOGIN' && styles.modeBtnTextActive]}>
                  Customer Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'REGISTER' && styles.modeBtnActive]}
                onPress={() => {
                  setMode('REGISTER');
                  setFeedback(null);
                }}
              >
                <Text style={[styles.modeBtnText, mode === 'REGISTER' && styles.modeBtnTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'REGISTER' ? (
              <>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.inkMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rituparna Das"
                    placeholderTextColor={COLORS.inkMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="call-outline" size={18} color={COLORS.inkMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="+91 98641 22019"
                    placeholderTextColor={COLORS.inkMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            ) : null}

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.inkMuted} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.inkMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.inkMuted} />
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor={COLORS.inkMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color={COLORS.inkMuted}
                />
              </TouchableOpacity>
            </View>

            {feedback ? (
              <View
                style={[
                  styles.feedbackBox,
                  feedback.type === 'error' ? styles.feedbackErr : styles.feedbackOk,
                ]}
              >
                <Ionicons
                  name={feedback.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                  size={17}
                  color={feedback.type === 'error' ? COLORS.danger : COLORS.success}
                />
                <Text
                  style={[
                    styles.feedbackText,
                    { color: feedback.type === 'error' ? COLORS.danger : COLORS.success },
                  ]}
                >
                  {feedback.text}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>
                    {mode === 'LOGIN' ? 'Sign In & Start Shopping' : 'Register Customer Account'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={continueAsDemoCustomer}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={18} color={COLORS.purplePrimary} />
              <Text style={styles.demoBtnText}>Continue as Quick Demo Shopper</Text>
            </TouchableOpacity>

            <Text style={styles.helperNote}>
              Orders placed from this app automatically route to the matching Shop Partner App via
              the shared Sanjit Musical backend & Firebase project.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
    flexGrow: 1,
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: COLORS.purpleDeep,
    borderRadius: RADIUS.xl,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  brandIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.goldPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    color: COLORS.white,
    fontSize: rs(18),
    fontWeight: '900',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  brandSubtitle: {
    color: '#DDD6FE',
    fontSize: rs(12),
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },
  featurePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featureChipText: {
    color: COLORS.white,
    fontSize: rs(11),
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  modeBtnActive: {
    backgroundColor: COLORS.purplePrimary,
  },
  modeBtnText: {
    color: COLORS.inkSecondary,
    fontSize: rs(12.5),
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: COLORS.white,
  },
  inputLabel: {
    color: COLORS.ink,
    fontSize: rs(12),
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    color: COLORS.ink,
    fontSize: rs(13.5),
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 8,
  },
  feedbackErr: {
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  feedbackOk: {
    backgroundColor: COLORS.successSoft,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  feedbackText: {
    flex: 1,
    fontSize: rs(12),
    fontWeight: '600',
    lineHeight: 17,
  },
  primaryBtn: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: rs(14),
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.inkMuted,
    fontSize: rs(11),
    fontWeight: '700',
  },
  demoBtn: {
    backgroundColor: COLORS.purpleSoft,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoBtnText: {
    color: COLORS.purplePrimary,
    fontSize: rs(13),
    fontWeight: '800',
  },
  helperNote: {
    color: COLORS.inkMuted,
    fontSize: rs(11),
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
});
