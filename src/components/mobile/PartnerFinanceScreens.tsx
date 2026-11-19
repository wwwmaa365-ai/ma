import React, { useState } from 'react';
import {
  BarChart3,
  Calculator,
  Crown,
  Receipt,
  Wallet,
  Info,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  DemoOrder,
  DemoShopProfile,
  DemoSubscriptionPayment,
  DemoSubscriptionPlan,
  DemoWithdrawalRequest,
  WEEKLY_DEMO_SALES,
} from '../../data/partnerDemoData.ts';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
} from '../rn/ReactNativePrimitives.tsx';

export type FinanceSubScreen =
  | 'EARNINGS'
  | 'SALES_REPORTS'
  | 'COMMISSION'
  | 'SUB_PLANS'
  | 'SUB_PAYMENTS'
  | 'WITHDRAWALS';

export interface PartnerFinanceScreensProps {
  subScreen: FinanceSubScreen;
  onSetSubScreen: (screen: FinanceSubScreen) => void;
  orders: DemoOrder[];
  shopProfile: DemoShopProfile;
  plans: DemoSubscriptionPlan[];
  subscriptionPayments: DemoSubscriptionPayment[];
  withdrawals: DemoWithdrawalRequest[];
  onSwitchPlanDemo: (planId: 'starter' | 'growth' | 'enterprise') => void;
  onRequestWithdrawalDemo: (amountInr: number) => void;
}

export const PartnerFinanceScreens: React.FC<PartnerFinanceScreensProps> = ({
  subScreen,
  onSetSubScreen,
  orders,
  shopProfile,
  plans,
  subscriptionPayments,
  withdrawals,
  onSwitchPlanDemo,
  onRequestWithdrawalDemo,
}) => {
  const [sampleOrderAmt, setSampleOrderAmt] = useState('15000');
  const [withdrawAmount, setWithdrawAmount] = useState('5000');
  const [withdrawMsg, setWithdrawMsg] = useState('');

  const activePlan =
    plans.find((p) => p.id === shopProfile.activePlanId) || plans[1];

  const validOrders = orders.filter((o) => o.status !== 'REJECTED');
  const grossSales = validOrders.reduce((s, o) => s + o.subtotalInr, 0);
  const totalCommission = validOrders.reduce((s, o) => s + o.commissionInr, 0);
  const netEarnings = grossSales - totalCommission;
  const withdrawnSum = withdrawals.reduce((s, w) => s + w.amountInr, 0);
  const availableDemoBalance = Math.max(0, netEarnings - withdrawnSum);

  const DemoDisclaimer = ({ text }: { text: string }) => (
    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );

  // Screen 13: Sales Reports
  if (subScreen === 'SALES_REPORTS') {
    const maxSales = Math.max(...WEEKLY_DEMO_SALES.map((d) => d.salesInr), 1);
    const weekTotal = WEEKLY_DEMO_SALES.reduce((s, d) => s + d.salesInr, 0);
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <DemoDisclaimer text="Demo Sales Analytics — Sample 7-day sales data for preview testing." />

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/60 gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-500 dark:text-purple-300">
              7-Day Demo Gross Revenue
            </span>
            <span className="text-2xl font-extrabold text-purple-950 dark:text-amber-300 font-mono-tabular">
              ₹{weekTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-purple-300 mt-0.5">
              Top Performers: DJ Mixers, Bihu Costumes & Acoustic Guitars
            </span>
          </div>

          {/* Mobile Responsive Bar Chart (No horizontal overflow) */}
          <div className="w-full h-40 pt-4 flex flex-row items-end justify-between gap-1.5">
            {WEEKLY_DEMO_SALES.map((bar) => {
              const heightPct = Math.max(
                16,
                Math.round((bar.salesInr / maxSales) * 100)
              );
              return (
                <div
                  key={bar.label}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 min-w-0"
                >
                  <span className="text-[9px] font-mono-tabular text-slate-500 dark:text-purple-300">
                    {(bar.salesInr / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full max-w-[28px] flex-1 bg-purple-100 dark:bg-purple-950/80 rounded-lg flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-[#4C1D95] to-amber-500 rounded-lg"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-purple-200">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </View>

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Category Revenue Mix (Demo)
          </Text>
          {[
            { label: 'Electronic Equipment (DJ Mixer, Amp, Speakers)', pct: 46 },
            { label: 'Musical Instruments (Guitar, Piano, Tabla)', pct: 32 },
            { label: 'Dance Dresses & Ghungroo Accessories', pct: 22 },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <div className="flex flex-row justify-between text-[11px]">
                <span className="text-slate-700 dark:text-purple-200 truncate pr-2">
                  {row.label}
                </span>
                <span className="font-mono-tabular font-bold text-purple-900 dark:text-amber-300 shrink-0">
                  {row.pct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-purple-100 dark:bg-purple-950 overflow-hidden">
                <div
                  style={{ width: `${row.pct}%` }}
                  className="h-full bg-[#4C1D95] dark:bg-amber-400 rounded-full"
                />
              </div>
            </div>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Screen 15: Platform Commission
  if (subScreen === 'COMMISSION') {
    const amt = Math.max(0, Number(sampleOrderAmt) || 0);
    const calcFee = Math.round((amt * activePlan.commissionPercent) / 100);
    const calcNet = amt - calcFee;

    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <DemoDisclaimer text="Platform Commission Calculator — Based on your currently selected demo subscription tier." />

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/60 gap-3">
          <Text className="text-sm font-bold text-slate-900 dark:text-white">
            Commission Simulator ({activePlan.commissionPercent}% Rate)
          </Text>
          <span className="text-xs text-slate-500 dark:text-purple-300">
            Active Tier: <strong>{activePlan.name}</strong>
          </span>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
              Test Sale Amount (₹)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={sampleOrderAmt}
              onChange={(e) => setSampleOrderAmt(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/50 flex flex-col gap-1.5 text-xs">
            <div className="flex flex-row justify-between">
              <span className="text-slate-600 dark:text-purple-200">
                Platform Commission ({activePlan.commissionPercent}%)
              </span>
              <span className="font-mono-tabular font-bold text-rose-600 dark:text-rose-400">
                -₹{calcFee.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex flex-row justify-between font-extrabold text-sm text-purple-950 dark:text-amber-300 pt-1 border-t border-purple-200 dark:border-purple-800">
              <span>Net Seller Payout</span>
              <span className="font-mono-tabular">
                ₹{calcNet.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </View>

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Order-Wise Commission Breakdown
          </Text>
          <div className="flex flex-col divide-y divide-purple-100 dark:divide-purple-900/50">
            {validOrders.map((ord) => (
              <div
                key={ord.id}
                className="py-2.5 flex flex-row items-center justify-between gap-2 text-xs"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-purple-900 dark:text-amber-300 font-mono-tabular">
                    {ord.id} · {ord.customerName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-purple-300 font-mono-tabular">
                    Gross ₹{ord.subtotalInr.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0 font-mono-tabular">
                  <span className="text-[11px] text-rose-600 dark:text-rose-400">
                    Fee -₹{ord.commissionInr.toLocaleString('en-IN')}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Net ₹{ord.netEarningInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </View>
      </ScrollView>
    );
  }

  // Screen 16: Subscription Plans
  if (subScreen === 'SUB_PLANS') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <DemoDisclaimer text="Demo Subscription Plans — Switching plans updates local demo mode state only. No real charge occurs." />

        {plans.map((plan) => {
          const isCurrent = plan.id === shopProfile.activePlanId;
          return (
            <View
              key={plan.id}
              className={`w-full rounded-2xl p-4 border gap-2.5 ${
                isCurrent
                  ? 'bg-gradient-to-br from-[#3B0764] to-[#5B21B6] text-white border-amber-400 shadow-md'
                  : 'bg-white dark:bg-[#1E1136] text-slate-900 dark:text-white border-purple-100 dark:border-purple-900/60'
              }`}
            >
              <div className="flex flex-row items-center justify-between gap-2">
                <Text className="text-base font-extrabold">{plan.name}</Text>
                <span
                  className={`text-sm font-extrabold font-mono-tabular ${
                    isCurrent ? 'text-amber-300' : 'text-purple-900 dark:text-amber-300'
                  }`}
                >
                  ₹{plan.monthlyPriceInr}/mo
                </span>
              </div>

              <span
                className={`text-xs font-mono-tabular ${
                  isCurrent ? 'text-amber-200' : 'text-purple-700 dark:text-purple-300'
                }`}
              >
                {plan.commissionPercent}% Commission · Up to {plan.productLimit} Products
              </span>

              <div className="flex flex-col gap-1 my-1">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex flex-row items-center gap-1.5 text-xs">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isCurrent ? 'text-amber-300' : 'text-purple-700 dark:text-amber-400'
                      }`}
                    />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <TouchableOpacity
                disabled={isCurrent}
                onPress={() => onSwitchPlanDemo(plan.id)}
                className={
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 font-extrabold text-xs'
                    : 'bg-[#4C1D95] text-amber-300 font-bold text-xs'
                }
              >
                <span>
                  {isCurrent ? 'Active Plan (Demo Mode)' : 'Switch to Plan (Demo Simulation)'}
                </span>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  // Screen 17: Subscription Payments
  if (subScreen === 'SUB_PAYMENTS') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3">
        <DemoDisclaimer text="Demo Subscription Billing History — Simulated ledger entries only; not live payment receipts." />

        {subscriptionPayments.map((pay) => (
          <View
            key={pay.id}
            className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-1"
          >
            <div className="flex flex-row items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-purple-900 dark:text-amber-300 font-mono-tabular">
                {pay.id}
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono-tabular">
                ₹{pay.amountInr.toLocaleString('en-IN')}
              </span>
            </div>
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              {pay.planName}
            </Text>
            <span className="text-[11px] text-slate-500 dark:text-purple-300">
              {pay.date} · {pay.mode} · {pay.status}
            </span>
          </View>
        ))}
      </ScrollView>
    );
  }

  // Screen 18: Withdrawal Requests
  if (subScreen === 'WITHDRAWALS') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <KeyboardAvoidingView>
          <DemoDisclaimer text="Demo Payout Withdrawal Simulator — Submitting creates a local demo record; no live bank or UPI transfer is triggered." />

          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/60 gap-3">
            <Text className="text-sm font-extrabold text-slate-900 dark:text-white">
              Request Demo Payout Withdrawal
            </Text>
            <span className="text-xs text-slate-500 dark:text-purple-300">
              Available Demo Balance:{' '}
              <strong className="text-purple-900 dark:text-amber-300 font-mono-tabular">
                ₹{availableDemoBalance.toLocaleString('en-IN')}
              </strong>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-purple-300">
              Bank: {shopProfile.bankAccountMasked} · UPI: {shopProfile.upiId}
            </span>

            <input
              type="number"
              inputMode="numeric"
              min={500}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter amount in ₹ (min 500)"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-sm font-mono-tabular text-slate-900 dark:text-white"
            />

            {withdrawMsg && (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {withdrawMsg}
              </span>
            )}

            <TouchableOpacity
              onPress={() => {
                const amt = Number(withdrawAmount) || 0;
                if (amt < 500) {
                  setWithdrawMsg('Enter at least ₹500 to log a demo withdrawal.');
                  return;
                }
                onRequestWithdrawalDemo(amt);
                setWithdrawMsg(`Demo withdrawal request for ₹${amt.toLocaleString('en-IN')} logged.`);
              }}
              className="w-full bg-amber-500 text-slate-950 font-extrabold text-xs"
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <span>Submit Demo Withdrawal Request</span>
            </TouchableOpacity>
          </View>

          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
            <Text className="text-xs font-bold text-slate-900 dark:text-white">
              Withdrawal Requests ({withdrawals.length})
            </Text>
            <div className="flex flex-col divide-y divide-purple-100 dark:divide-purple-900/50">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="py-2.5 flex flex-row items-center justify-between gap-2 text-xs"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-purple-900 dark:text-amber-300 font-mono-tabular">
                      {w.id} · {w.status}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-purple-300">
                      {w.bankAccount} · {w.requestedAt}
                    </span>
                  </div>
                  <span className="font-extrabold font-mono-tabular text-slate-900 dark:text-white shrink-0">
                    ₹{w.amountInr.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    );
  }

  // Screen 14: Earnings Tab Home
  return (
    <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
      <DemoDisclaimer text="Demo Earnings Overview — Simulated store payouts and commissions. No real funds are settled." />

      <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#5B21B6] p-4 text-white border border-amber-400/40 gap-3 shadow-md">
        <span className="text-[10px] font-bold tracking-widest text-amber-300">
          AVAILABLE DEMO PAYOUT BALANCE
        </span>
        <span className="text-3xl font-extrabold font-mono-tabular text-white">
          ₹{availableDemoBalance.toLocaleString('en-IN')}
        </span>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 text-xs">
          <div className="flex flex-col">
            <span className="text-purple-200 text-[11px]">Gross Demo Sales</span>
            <span className="font-mono-tabular font-bold text-white">
              ₹{grossSales.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-purple-200 text-[11px]">
              Commission ({activePlan.commissionPercent}%)
            </span>
            <span className="font-mono-tabular font-bold text-amber-300">
              -₹{totalCommission.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <TouchableOpacity
          onPress={() => onSetSubScreen('WITHDRAWALS')}
          className="w-full bg-amber-500 text-slate-950 font-extrabold text-xs mt-1"
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span>Request Payout Withdrawal (Demo)</span>
        </TouchableOpacity>
      </View>

      {/* Native Android Tap-List for All Finance & Subscription Screens */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl border border-purple-100 dark:border-purple-900/60 divide-y divide-purple-100 dark:divide-purple-900/50 overflow-hidden">
        {[
          {
            id: 'SALES_REPORTS' as const,
            title: 'Sales Reports & Weekly Chart',
            sub: '7-day revenue bar chart & category breakdown',
            icon: <BarChart3 className="w-5 h-5" />,
          },
          {
            id: 'COMMISSION' as const,
            title: 'Platform Commission Calculator',
            sub: `Current plan rate: ${activePlan.commissionPercent}% per order`,
            icon: <Calculator className="w-5 h-5" />,
          },
          {
            id: 'SUB_PLANS' as const,
            title: 'Subscription Plans',
            sub: `Active: ${activePlan.name} (₹${activePlan.monthlyPriceInr}/mo)`,
            icon: <Crown className="w-5 h-5" />,
          },
          {
            id: 'SUB_PAYMENTS' as const,
            title: 'Subscription Payment History',
            sub: `${subscriptionPayments.length} demo billing records`,
            icon: <Receipt className="w-5 h-5" />,
          },
          {
            id: 'WITHDRAWALS' as const,
            title: 'Withdrawal Requests',
            sub: `${withdrawals.length} demo payout requests`,
            icon: <Wallet className="w-5 h-5" />,
          },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSetSubScreen(item.id)}
            className="w-full min-h-[64px] px-3.5 py-3 flex flex-row items-center justify-between gap-3 text-left active:bg-purple-50 dark:active:bg-purple-950/50 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">
                {item.title}
              </Text>
              <span className="text-xs text-slate-500 dark:text-purple-300 truncate">
                {item.sub}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        ))}
      </View>
    </ScrollView>
  );
};
