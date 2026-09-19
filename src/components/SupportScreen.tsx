import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { ChoirLogo } from './ChoirLogo';
import { PaymentTransaction } from '../types';
import {
  HeartHandshake,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Receipt,
  Download,
  ShieldCheck,
  History,
  Lock,
} from 'lucide-react';

export const SupportScreen: React.FC = () => {
  const { user } = useAuth();
  const { choirInfo } = useBranding();

  // Active view: 'donate' or 'history'
  const [activeTab, setActiveTab] = useState<'donate' | 'history'>('donate');

  // Donation form state
  const [step, setStep] = useState<number>(1);
  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [provider, setProvider] = useState<'mtn-momo' | 'airtel-money'>('mtn-momo');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [donorName, setDonorName] = useState<string>(user?.name || '');
  const [donationPurpose, setDonationPurpose] = useState<string>('Ministry Support (Gushyigikira Ivugabutumwa)');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Phone validation
  const [phoneError, setPhoneError] = useState<string>('');

  // Processing & Transaction Tracking
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [pollingTimer, setPollingTimer] = useState<number>(0);

  // History state
  const [history, setHistory] = useState<PaymentTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const predefinedAmounts = [1000, 2000, 5000, 10000, 20000];

  const donationPurposes = [
    'Ministry Support (Gushyigikira Ivugabutumwa)',
    'New Album Recording (Gufata Amajwi n\'Amashusho y\'Indirimbo Nshya)',
    'Musical Instruments (Ibikoresho by\'Umuziki)',
    'Choir Mission & Outreach (Ingendo z\'Ivugabutumwa)',
    'General Offering (Ituro Rusange)',
  ];

  // Validate Rwandan phone number on change
  const validateRwandaPhone = (num: string, prov: string): boolean => {
    const cleaned = num.replace(/\s+/g, '').replace(/-/g, '');
    let standard = cleaned;
    if (standard.startsWith('+250')) standard = '0' + standard.slice(4);
    else if (standard.startsWith('250')) standard = '0' + standard.slice(3);

    if (!/^07[2389]\d{7}$/.test(standard)) {
      setPhoneError('Nimero igomba kuba ifite imibare 10 (urugero: 078XXXXXXX cyangwa 073XXXXXXX)');
      return false;
    }

    if (prov === 'mtn-momo' && !/^(078|079)/.test(standard)) {
      setPhoneError('Nimero ya MTN Mobile Money igomba gutangizwa na 078 cyangwa 079');
      return false;
    }

    if (prov === 'airtel-money' && !/^(072|073)/.test(standard)) {
      setPhoneError('Nimero ya Airtel Money igomba gutangizwa na 072 cyangwa 073');
      return false;
    }

    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (val.length >= 10) {
      validateRwandaPhone(val, provider);
    } else {
      setPhoneError('');
    }
  };

  const handleProviderSelect = (p: 'mtn-momo' | 'airtel-money') => {
    setProvider(p);
    if (phoneNumber.length >= 10) {
      validateRwandaPhone(phoneNumber, p);
    }
  };

  const getEffectiveAmount = (): number => {
    if (customAmount && Number(customAmount) > 0) {
      return Number(customAmount);
    }
    return selectedAmount;
  };

  // Step 5: Initiate Real Mobile Money Payment
  const handleInitiatePayment = async () => {
    const valid = validateRwandaPhone(phoneNumber, provider);
    if (!valid) return;

    const finalAmount = getEffectiveAmount();
    if (finalAmount < 100) {
      alert('Amafaranga ntashobora kuba munsi ya 100 RWF');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('lalumiere_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/donations/initiate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: finalAmount,
          provider_slug: provider,
          phone_number: phoneNumber,
          donor_name: isAnonymous ? 'Anonymous Supporter' : donorName || 'Supporter',
          donation_purpose: donationPurpose,
          is_anonymous: isAnonymous,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to initiate payment');
        setIsSubmitting(false);
        return;
      }

      setTransaction(data.transaction);
      setStep(5);
      startPolling(data.transaction.internal_reference);
    } catch (err) {
      console.error('Payment initiation error:', err);
      alert('Habaye ikibazo mu gukora ubusabe bwa Mobile Money. Ongera ugerageze.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 6: Poll for transaction confirmation
  const startPolling = (reference: string) => {
    let attempts = 0;
    const maxAttempts = 24; // 24 * 2.5s = 60 seconds
    const interval = window.setInterval(async () => {
      attempts++;
      setPollingTimer(attempts * 2);

      try {
        const res = await fetch(`/api/donations/status/${reference}`);
        if (res.ok) {
          const data = await res.json();
          setTransaction(data);

          if (data.status === 'successful' || data.status === 'failed' || data.status === 'cancelled') {
            clearInterval(interval);
            setStep(6);
          }
        }
      } catch (err) {
        console.error('Polling error', err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStep(6);
      }
    }, 2500);
  };

  // Fetch donation history
  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = localStorage.getItem('lalumiere_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/donations/history', { headers });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const resetFlow = () => {
    setStep(1);
    setTransaction(null);
    setPollingTimer(0);
    setCustomAmount('');
  };

  return (
    <div className="pb-28 space-y-5 max-w-xl mx-auto">
      {/* Top Banner & Ministry Message */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-900/60 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-md mx-auto space-y-2">
          <ChoirLogo size="md" variant="splash" className="mx-auto mb-1" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-0.5 rounded-full border border-amber-400/20">
            Rwanda Mobile Money Support
          </span>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-100 font-serif">
            Support {choirInfo.choir_name}
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Your generous donation empowers La Lumiere Choir to record new gospel songs, minister across Rwanda, upgrade musical instruments, and spread the Gospel of Jesus Christ.
          </p>

          <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-amber-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Direct Rwanda Payment Gateway (MTN & Airtel)</span>
          </div>
        </div>
      </div>

      {/* Tabs: Donate vs History */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('donate')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'donate'
              ? 'bg-white text-blue-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-amber-600" />
          <span>Tanga Inkunga (Donate)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-white text-blue-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-blue-800" />
          <span>Inyemezabwishyu (Receipts & History)</span>
        </button>
      </div>

      {activeTab === 'donate' ? (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          {/* Multi-Step Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
            <span className="font-extrabold text-slate-900 font-serif">
              {step === 1 && 'Intambwe 1: Hitamo Amafaranga (Select Amount)'}
              {step === 2 && 'Intambwe 2: Uburyo bwo Kwishyura (Payment Method)'}
              {step === 3 && 'Intambwe 3: Nimero ya Terefone (Phone Number)'}
              {step === 4 && 'Intambwe 4: Emeza Impano (Confirmation)'}
              {step === 5 && 'Intambwe 5: Kwemeza kuri Terefone (Mobile PIN)'}
              {step === 6 && 'Intambwe 6: Inyemezabwishyu (Payment Status)'}
            </span>
            <span className="font-mono text-slate-400 font-bold">
              {step}/6
            </span>
          </div>

          {/* STEP 1: CHOOSE AMOUNT & PURPOSE */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Hitamo Umubare w'Amafaranga (Choose Amount in RWF)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {predefinedAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${
                        selectedAmount === amt && !customAmount
                          ? 'bg-blue-950 text-amber-300 border-blue-950 shadow-xs scale-102'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {amt.toLocaleString()} RWF
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cyangwa Andika Umubare Wifuza (Custom Amount):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={customAmount}
                    onChange={e => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(0);
                    }}
                    placeholder="Urugero: 50000"
                    className="w-full p-3 pl-4 pr-16 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    RWF
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Impamvu y'Inkunga (Donation Purpose):
                </label>
                <select
                  value={donationPurpose}
                  onChange={e => setDonationPurpose(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                >
                  {donationPurposes.map(purpose => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-blue-950 hover:bg-blue-900 text-white rounded-2xl font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                <span>Komeza (Next: Payment Method)</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          )}

          {/* STEP 2: CHOOSE PAYMENT METHOD */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-800">
                Hitamo Uburyo bwa Mobile Money (Payment Method in Rwanda)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* MTN Mobile Money */}
                <button
                  type="button"
                  onClick={() => handleProviderSelect('mtn-momo')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    provider === 'mtn-momo'
                      ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                      MTN
                    </span>
                    {provider === 'mtn-momo' && (
                      <CheckCircle2 className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-950">MTN Mobile Money</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Nimero zitangizwa na 078 / 079
                  </p>
                </button>

                {/* Airtel Money */}
                <button
                  type="button"
                  onClick={() => handleProviderSelect('airtel-money')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    provider === 'airtel-money'
                      ? 'border-red-500 bg-red-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      airtel
                    </span>
                    {provider === 'airtel-money' && (
                      <CheckCircle2 className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-950">Airtel Money</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Nimero zitangizwa na 072 / 073
                  </p>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs"
                >
                  Inyuma
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-2/3 inline-flex items-center justify-center gap-2 py-3 bg-blue-950 hover:bg-blue-900 text-white rounded-2xl font-extrabold text-xs shadow-md transition-all active:scale-95"
                >
                  <span>Komeza (Next: Phone)</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ENTER PHONE NUMBER & DONOR INFO */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nimero ya Terefone ya {provider === 'mtn-momo' ? 'MTN' : 'Airtel'} (Rwanda Phone):
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => handlePhoneChange(e.target.value)}
                    placeholder={provider === 'mtn-momo' ? '078XXXXXXX cyangwa 079XXXXXXX' : '072XXXXXXX cyangwa 073XXXXXXX'}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amazina y'Utanze Impano (Donor Name):
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  disabled={isAnonymous}
                  placeholder="Amazina yawe..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded accent-blue-900 cursor-pointer"
                />
                <label htmlFor="anonCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Tanga impano mu ibanga (Donate Anonymously - hide name on public receipt)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs"
                >
                  Inyuma
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateRwandaPhone(phoneNumber, provider)) {
                      setStep(4);
                    }
                  }}
                  disabled={!phoneNumber}
                  className="w-2/3 inline-flex items-center justify-center gap-2 py-3 bg-blue-950 hover:bg-blue-900 text-white rounded-2xl font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Komeza (Review Donation)</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM DONATION DETAILS */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">
                  Ibyo Mugiye Kwemeza (Donation Summary)
                </h4>

                <div className="flex justify-between">
                  <span className="text-slate-500">Umuryango (Recipient):</span>
                  <span className="font-bold text-slate-900">{choirInfo.choir_name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Amafaranga (Amount):</span>
                  <span className="font-extrabold text-blue-950 font-mono text-sm">
                    {getEffectiveAmount().toLocaleString()} RWF
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Uburyo (Provider):</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {provider === 'mtn-momo' ? 'MTN Mobile Money' : 'Airtel Money'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Nimero (Phone):</span>
                  <span className="font-mono font-bold text-slate-900">{phoneNumber}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Impamvu (Purpose):</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                    {donationPurpose}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Utanze Impano:</span>
                  <span className="font-semibold text-slate-900">
                    {isAnonymous ? 'Mu Ibanga (Anonymous)' : donorName || 'Supporter'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Kanda 'Emeza Kwishyura' kugira ngo ubutumwa bw'iyishyura bwoherezwe kuri terefone yawe. Nta PIN yigera ibikwa muri porogaramu.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={isSubmitting}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs"
                >
                  Inyuma
                </button>
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={isSubmitting}
                  className="w-2/3 inline-flex items-center justify-center gap-2 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Kohereza...' : 'Emeza Kwishyura (Pay via MoMo)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: USSD PUSH NOTIFICATION PROMPT */}
          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-900 border-2 border-blue-200 flex items-center justify-center mx-auto animate-pulse">
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Reba kuri Terefone yawe (Check Your Phone)
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
                  Ubusabe bwo kwishyura <strong className="text-slate-900">{getEffectiveAmount().toLocaleString()} RWF</strong> bwoherejwe kuri nimero <strong className="text-slate-900">{phoneNumber}</strong>.
                </p>
                <p className="text-xs text-amber-700 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-3 max-w-sm mx-auto">
                  Andika umubare w'ibanga (PIN) wa Mobile Money kuri terefone yawe kugira ngo wemeze iyishyura.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-mono">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Tugereje kwemeza... ({pollingTimer}s)</span>
              </div>

              <button
                type="button"
                onClick={() => setStep(6)}
                className="text-xs text-blue-900 font-semibold hover:underline pt-2 block mx-auto"
              >
                Reba uko bihagaze ubu (Check current status)
              </button>
            </div>
          )}

          {/* STEP 6: PAYMENT STATUS & PRINTABLE RECEIPT */}
          {step === 6 && (
            <div className="space-y-5">
              {transaction?.status === 'successful' ? (
                /* SUCCESSFUL RECEIPT */
                <div className="bg-emerald-50/70 border-2 border-emerald-400 rounded-3xl p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                      Iyishyura Ryemejwe (Payment Confirmed)
                    </span>
                    <h3 className="text-xl font-extrabold text-emerald-950 mt-2 font-serif">
                      Murakoze Cyane! Thank You!
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 max-w-sm mx-auto">
                      Inkunga yawe yageze neza kuri konti ya {choirInfo.choir_name}. Imana ibahe umugisha mwinshi ku bw'umutima wo gushyigikira umurimo wayo.
                    </p>
                  </div>

                  {/* Printable Receipt Card */}
                  <div id="momo-receipt" className="bg-white rounded-2xl p-4 border border-emerald-200 text-left text-xs space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-700" />
                        <span className="font-extrabold text-slate-900">Official Donation Receipt</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {transaction.internal_reference}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Recipient:</span>
                      <span className="font-bold text-slate-900">{choirInfo.choir_name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="font-extrabold text-emerald-950 font-mono text-sm">
                        {transaction.amount.toLocaleString()} RWF
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Provider:</span>
                      <span className="font-bold text-slate-900 uppercase">
                        {transaction.provider_slug}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Donor:</span>
                      <span className="font-bold text-slate-900">{transaction.donor_name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Purpose:</span>
                      <span className="font-semibold text-slate-800">{transaction.donation_purpose}</span>
                    </div>

                    <div className="flex justify-between border-t pt-2 border-slate-100 text-[10px] text-slate-400">
                      <span>Date & Time:</span>
                      <span>{new Date(transaction.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Print / Save Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetFlow}
                      className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Tanga Indi Nkunga
                    </button>
                  </div>
                </div>
              ) : transaction?.status === 'processing' || transaction?.status === 'pending' ? (
                /* STILL PROCESSING */
                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 text-center space-y-3">
                  <Clock className="w-10 h-10 text-blue-800 mx-auto animate-spin" />
                  <h3 className="text-sm font-bold text-blue-950">
                    Iyishyura riracyatunganywa (Payment in Progress)
                  </h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Niba wemeje PIN kuri terefone yawe, kanda hasi kugira ngo wongere ugenzure:
                  </p>
                  <button
                    type="button"
                    onClick={() => startPolling(transaction.internal_reference)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ongera Ugenzure (Refresh Status)</span>
                  </button>
                </div>
              ) : (
                /* FAILED OR CANCELLED */
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
                  <h3 className="text-sm font-bold text-rose-950">
                    Iyishyura Ntiryakunze (Payment Not Completed)
                  </h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    {transaction?.failure_reason || 'Iyishyura ryahagaritswe cyangwa umwanya warangiye utashyizemo PIN.'}
                  </p>
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ongera Ugerageze (Try Again)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* DONATION RECEIPTS HISTORY TAB */
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Inyemezabwishyu n'Uruhererekane (Donation History)
              </h3>
              <p className="text-[11px] text-slate-500">
                Inyemezabwishyu zose za Mobile Money z'umurimo w'Imana
              </p>
            </div>
            <button
              onClick={fetchHistory}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              title="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-7 h-7 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Gufungura inyemezabwishyu...
            </div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">Nta nyemezabwishyu ziratangwa.</p>
              <button
                onClick={() => setActiveTab('donate')}
                className="text-xs font-bold text-blue-900 hover:underline"
              >
                Tanga inkunga ya mbere
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.status === 'successful'
                            ? 'bg-emerald-500'
                            : item.status === 'failed'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-bold text-slate-900 font-mono">
                        {item.internal_reference}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                        item.status === 'successful'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono">
                    <span className="font-extrabold text-blue-950 text-sm">
                      {item.amount.toLocaleString()} RWF
                    </span>
                    <span className="text-slate-500 uppercase text-[11px]">
                      {item.provider_slug}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>{item.donor_name}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    {item.donation_purpose}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
