import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Copy,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { DemoOrder } from '../../data/partnerDemoData.ts';
import { Text, TouchableOpacity, View } from '../rn/ReactNativePrimitives.tsx';

export function buildNpciUpiUri(params: {
  vpa: string;
  payeeName: string;
  amountInr: number;
  transactionRef: string;
  note: string;
}): string {
  const qs = [
    `pa=${encodeURIComponent(params.vpa.trim())}`,
    `pn=${encodeURIComponent(params.payeeName.trim().slice(0, 60))}`,
    `am=${encodeURIComponent(params.amountInr.toFixed(2))}`,
    'cu=INR',
    `tr=${encodeURIComponent(params.transactionRef.trim())}`,
    `tn=${encodeURIComponent(params.note.trim().slice(0, 80))}`,
    'mc=5733',
  ].join('&');
  return `upi://pay?${qs}`;
}

export interface PartnerUpiQrGatewayProps {
  order: DemoOrder;
  shopName: string;
  defaultUpiId: string;
  onConfirmUpiPayment: (orderId: string, utr: string, vpaUsed: string) => void;
}

export const PartnerUpiQrGateway: React.FC<PartnerUpiQrGatewayProps> = ({
  order,
  shopName,
  defaultUpiId,
  onConfirmUpiPayment,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [vpa, setVpa] = useState(defaultUpiId || 'sanjit.guwahati@okaxis');
  const [sessionSeed, setSessionSeed] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [utrInput, setUtrInput] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  const isPaid = order.upiPaymentStatus === 'PAID_UPI_QR';

  const txRef = `${order.invoiceNo.replace(/[^a-zA-Z0-9]/g, '')}S${sessionSeed}`;
  const upiUri = useMemo(
    () =>
      buildNpciUpiUri({
        vpa: vpa.trim() || defaultUpiId,
        payeeName: shopName,
        amountInr: order.subtotalInr,
        transactionRef: txRef,
        note: `Order ${order.id} - ${shopName}`,
      }),
    [vpa, defaultUpiId, shopName, order.subtotalInr, order.id, txRef]
  );

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 2,
      color: { dark: '#2E1065', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [upiUri]);

  useEffect(() => {
    if (!sheetOpen || isPaid) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [sheetOpen, isPaid]);

  const formattedTimer = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`;

  const handleCopyUpiUri = async () => {
    try {
      await navigator.clipboard.writeText(upiUri);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    } catch {
      setCopiedNotice(false);
    }
  };

  const handleConfirmDemo = () => {
    const cleanUtr =
      utrInput.trim().replace(/\s+/g, '') ||
      `4323${Math.floor(10000000 + Math.random() * 89999999)}`;
    onConfirmUpiPayment(order.id, cleanUtr, vpa.trim() || defaultUpiId);
    setUtrInput('');
    setSheetOpen(false);
  };

  return (
    <>
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-1.5 min-w-0">
            <QrCode className="w-4 h-4 text-purple-800 dark:text-amber-300 shrink-0" />
            <Text className="text-xs font-bold text-slate-900 dark:text-white truncate">
              In-Store UPI QR Payment
            </Text>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border shrink-0 ${
              isPaid
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
            }`}
          >
            {isPaid ? 'PAID · UPI QR' : 'SCAN & PAY'}
          </span>
        </div>

        {isPaid ? (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-1">
            <div className="flex flex-row items-center justify-between text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
              <span className="flex flex-row items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>UPI QR Payment Recorded (Demo)</span>
              </span>
              <span className="font-mono-tabular">
                ₹{order.subtotalInr.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] font-mono-tabular text-emerald-700 dark:text-emerald-200">
              UTR: {order.upiUtr} · {order.upiPaidAt}
            </span>
            <span className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90">
              VPA: {order.upiVpaUsed || vpa}
            </span>
            <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 pt-1">
              Demo Mode receipt — connect Razorpay, Cashfree, or PhonePe PG webhook for live settlement.
            </span>
          </div>
        ) : (
          <>
            <span className="text-[11px] text-slate-600 dark:text-purple-200 leading-relaxed">
              Let the customer scan a real NPCI UPI QR right at your counter to pay{' '}
              <strong className="text-slate-900 dark:text-white font-mono-tabular">
                ₹{order.subtotalInr.toLocaleString('en-IN')}
              </strong>{' '}
              via GPay, PhonePe, Paytm, or BHIM.
            </span>
            <div className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-purple-300">Counter UPI ID</span>
              <span className="font-mono-tabular font-bold text-purple-900 dark:text-amber-300 truncate">
                {vpa}
              </span>
            </div>
            <TouchableOpacity
              onPress={() => {
                setSecondsLeft(300);
                setSheetOpen(true);
              }}
              className="w-full bg-amber-500 text-slate-950 font-extrabold text-xs shadow-xs"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>Show Customer Scan &amp; Pay UPI QR</span>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Native-Style Bottom Sheet Modal for Customer Scanning */}
      {sheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="In-Store UPI QR Payment Sheet"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-[2px] flex items-end justify-center"
        >
          <div className="w-full max-w-[430px] max-h-[92dvh] overflow-y-auto bg-white dark:bg-[#1A0E30] rounded-t-3xl border-t-2 border-amber-400 p-4 flex flex-col gap-3 shadow-2xl">
            <div className="flex flex-row items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-extrabold tracking-wider text-amber-600 dark:text-amber-300">
                  SANJIT SHOP PARTNER · COUNTER UPI QR
                </span>
                <Text className="text-base font-extrabold text-purple-950 dark:text-white truncate">
                  {shopName}
                </Text>
              </div>
              <button
                type="button"
                aria-label="Close UPI QR Sheet"
                onClick={() => setSheetOpen(false)}
                className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-amber-300 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payable Amount + Dynamic Session Timer */}
            <div className="rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-3.5 text-white flex flex-row items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[11px] text-purple-200">
                  Payable Amount ({order.id})
                </span>
                <span className="text-2xl font-extrabold font-mono-tabular text-white">
                  ₹{order.subtotalInr.toLocaleString('en-IN')}.00
                </span>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-white/15 flex flex-row items-center gap-1 text-amber-300 text-xs font-extrabold font-mono-tabular">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{secondsLeft > 0 ? formattedTimer : 'EXPIRED'}</span>
              </div>
            </div>

            {/* Scannable NPCI QR Code Card */}
            <div className="w-full rounded-2xl bg-[#FAF8FE] dark:bg-[#120924] border-2 border-amber-400/60 p-4 flex flex-col items-center gap-2">
              <div className="p-3 rounded-2xl bg-white border border-purple-200 shadow-xs">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`UPI QR Code for ${order.id}`}
                    className="w-48 h-48 object-contain block"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}
              </div>
              <span className="text-xs font-extrabold font-mono-tabular text-purple-900 dark:text-amber-300">
                {vpa}
              </span>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-purple-200 text-center">
                Scan with Google Pay · PhonePe · Paytm · BHIM · Any UPI App
              </span>
              <span className="text-[10px] font-mono-tabular text-slate-400">
                Ref: {txRef} · MCC 5733
              </span>
            </div>

            {secondsLeft === 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSessionSeed((s) => s + 1);
                  setSecondsLeft(300);
                }}
                className="w-full bg-amber-500 text-slate-950 font-extrabold text-xs"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>QR Expired — Regenerate Dynamic QR</span>
              </TouchableOpacity>
            )}

            {/* Editable Counter VPA */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-purple-200">
                Partner Counter UPI ID (VPA)
              </label>
              <input
                type="text"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                placeholder="shop@upi"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-purple-50/60 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>

            {/* Direct UPI Intent & Copy Link */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={upiUri}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-bold flex flex-row items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Open UPI App</span>
              </a>
              <TouchableOpacity
                onPress={handleCopyUpiUri}
                className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-bold"
              >
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {copiedNotice ? 'Copied UPI Link' : 'Copy UPI Link'}
                </span>
              </TouchableOpacity>
            </div>

            {/* UTR Confirmation Box (Demo Mode) */}
            <div className="p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex flex-col gap-2">
              <div className="flex flex-row items-center gap-1.5 text-xs font-extrabold text-purple-950 dark:text-amber-300">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Verify Customer Payment (Demo Mode)</span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-purple-200">
                Enter the 12-digit UPI UTR from customer&apos;s app (or leave blank to auto-fill a demo UTR) to mark this order paid:
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                placeholder="e.g. 432398451209 (Optional in Demo)"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
              <TouchableOpacity
                onPress={handleConfirmDemo}
                className="w-full bg-[#4C1D95] text-amber-300 font-extrabold text-xs"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Confirm UPI Payment Received (Demo)</span>
              </TouchableOpacity>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
