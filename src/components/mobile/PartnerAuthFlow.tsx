import React, { useState } from 'react';
import { Lock, Store, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { APP_ICON_URL } from '../../data/partnerDemoData.ts';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
} from '../rn/ReactNativePrimitives.tsx';

export type AuthScreenStep = 'SPLASH' | 'LOGIN' | 'REGISTER' | 'OTP';

export interface PartnerAuthFlowProps {
  step: AuthScreenStep;
  onSetStep: (step: AuthScreenStep) => void;
  phone: string;
  onSetPhone: (phone: string) => void;
  onRegisterShop: (payload: {
    shopName: string;
    ownerName: string;
    phone: string;
    city: string;
    gstNumber: string;
  }) => void;
  onVerifiedSuccess: () => void;
}

export const PartnerAuthFlow: React.FC<PartnerAuthFlowProps> = ({
  step,
  onSetStep,
  phone,
  onSetPhone,
  onRegisterShop,
  onVerifiedSuccess,
}) => {
  const [shopName, setShopName] = useState('Sanjit Musical & Dance Emporium');
  const [ownerName, setOwnerName] = useState('Sanjit Kalita');
  const [city, setCity] = useState('Guwahati');
  const [gstNumber, setGstNumber] = useState('18AABCS1429B1Z5');
  const [otpInput, setOtpInput] = useState('1234');
  const [otpError, setOtpError] = useState('');

  // Screen 1: Splash Screen
  if (step === 'SPLASH') {
    return (
      <div className="flex-1 w-full bg-gradient-to-b from-[#2E1065] via-[#3B0764] to-[#4C1D95] text-white px-5 py-8 flex flex-col items-center justify-between min-h-[calc(100dvh-28px)]">
        <div className="w-full flex flex-col items-center text-center mt-10 gap-3">
          <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-xl border-2 border-amber-400/70 bg-[#4C1D95]">
            <img
              src={APP_ICON_URL}
              alt="Sanjit Shop Partner Icon"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-amber-300 mt-2">
            SANJIT MUSICAL STORE
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            SANJIT SHOP PARTNER
          </h1>
          <p className="text-xs text-purple-200 max-w-[260px] leading-relaxed">
            Android Seller App for Musical Instruments, Pro Audio & Dance Costume Stores
          </p>
          <span className="text-[11px] font-mono-tabular text-amber-200/90 mt-1">
            Package: in.sanjitmusical.shoppartner · v1.0.0
          </span>
        </div>

        <div className="w-full flex flex-col gap-2.5 pb-4">
          <TouchableOpacity
            onPress={() => onSetStep('LOGIN')}
            className="w-full bg-amber-500 text-slate-950 font-extrabold text-sm shadow-lg"
          >
            <span>Continue to Partner Login</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </TouchableOpacity>
          <button
            type="button"
            onClick={() => onSetStep('REGISTER')}
            className="w-full min-h-[44px] text-xs font-semibold text-amber-200 hover:text-white cursor-pointer"
          >
            New Musical or Dance Shop? Register Store
          </button>
        </div>
      </div>
    );
  }

  // Screen 2: Login Screen
  if (step === 'LOGIN') {
    return (
      <ScrollView contentContainerClassName="px-4 py-4 gap-3.5">
        <KeyboardAvoidingView>
          <div className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-5 text-white border border-amber-400/30 flex flex-col items-center text-center gap-2">
            <img
              src={APP_ICON_URL}
              alt="Sanjit Shop Partner"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl border border-amber-300/60 object-cover"
            />
            <span className="text-[10px] font-bold tracking-widest text-amber-300">
              SANJIT MUSICAL STORE
            </span>
            <h2 className="text-lg font-extrabold text-white">Partner Sign In</h2>
            <p className="text-xs text-purple-200">
              Sign in with your mobile number to manage products, orders, and payouts
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Demo Mode Active:</strong> Sample seller data only. No real SMS charges or live bank payments occur.
            </span>
          </div>

          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/60 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
                Registered Seller Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => onSetPhone(e.target.value)}
                placeholder="+91 98640 11022"
                className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>

            <TouchableOpacity
              onPress={() => onSetStep('OTP')}
              className="w-full bg-[#4C1D95] text-amber-300 font-bold text-sm shadow-sm"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Send Login OTP (Demo: 1234)</span>
            </TouchableOpacity>

            <button
              type="button"
              onClick={() => onSetStep('REGISTER')}
              className="w-full min-h-[44px] rounded-xl border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-900 dark:text-amber-300 cursor-pointer"
            >
              New Seller? Register Your Branded Shop
            </button>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    );
  }

  // Screen 3: Shop Registration Screen
  if (step === 'REGISTER') {
    return (
      <ScrollView contentContainerClassName="px-4 py-4 gap-3.5">
        <KeyboardAvoidingView>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Demo Registration:</strong> Creates a local test seller profile immediately without live KYC charges.
            </span>
          </div>

          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/60 gap-3">
            <Text className="text-base font-extrabold text-slate-900 dark:text-white">
              Register Your Branded Store
            </Text>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                Shop / Store Name *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                Owner Full Name *
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => onSetPhone(e.target.value)}
                  className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                GST Number (Optional)
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>

            <TouchableOpacity
              onPress={() => {
                onRegisterShop({
                  shopName: shopName.trim() || 'Sanjit Partner Store',
                  ownerName: ownerName.trim() || 'Partner Owner',
                  phone: phone.trim() || '+91 98640 11022',
                  city: city.trim() || 'Guwahati',
                  gstNumber: gstNumber.trim(),
                });
                onSetStep('OTP');
              }}
              className="w-full bg-amber-500 text-slate-950 font-extrabold text-sm shadow-sm"
            >
              <Store className="w-4 h-4 shrink-0" />
              <span>Register Shop & Verify OTP</span>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    );
  }

  // Screen 4: OTP Verification Screen
  return (
    <ScrollView contentContainerClassName="px-4 py-4 gap-3.5">
      <KeyboardAvoidingView>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Demo OTP Verification:</strong> Enter <strong>1234</strong> (or any 4 digits) to enter your SANJIT SHOP PARTNER dashboard.
          </span>
        </div>

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/60 gap-3.5">
          <Text className="text-base font-extrabold text-slate-900 dark:text-white">
            Verify 4-Digit Mobile OTP
          </Text>
          <span className="text-xs text-slate-500 dark:text-purple-300">
            Demo OTP sent to <strong>{phone}</strong>
          </span>

          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value)}
            placeholder="1234"
            className="w-full min-h-[54px] px-4 py-3 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-300 dark:border-purple-700 text-center text-2xl font-extrabold tracking-[0.5em] font-mono-tabular text-slate-900 dark:text-white"
          />

          {otpError && (
            <span className="text-xs font-semibold text-rose-600">{otpError}</span>
          )}

          <TouchableOpacity
            onPress={() => {
              if (otpInput.trim().length === 4) {
                setOtpError('');
                onVerifiedSuccess();
              } else {
                setOtpError('Please enter a 4-digit demo OTP (e.g. 1234).');
              }
            }}
            className="w-full bg-[#4C1D95] text-amber-300 font-bold text-sm shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Verify & Open Seller Dashboard</span>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};
