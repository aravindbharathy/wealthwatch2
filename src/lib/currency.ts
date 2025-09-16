// Currency conversion utilities
import axios from 'axios';

export interface CurrencyConversion {
  from: string;
  to: string;
  rate: number;
  amount?: number;
  convertedAmount?: number;
  timestamp: string;
}

// Cache for currency rates to avoid excessive API calls
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function convertCurrency(
  from: string,
  to: string,
  amount?: number
): Promise<CurrencyConversion> {
  // If same currency, return 1:1 rate
  if (from === to) {
    return {
      from,
      to,
      rate: 1,
      amount,
      convertedAmount: amount,
      timestamp: new Date().toISOString(),
    };
  }

  // Check cache first
  const cacheKey = `${from}-${to}`;
  const cached = rateCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return {
      from,
      to,
      rate: cached.rate,
      amount,
      convertedAmount: amount ? amount * cached.rate : undefined,
      timestamp: new Date(cached.timestamp).toISOString(),
    };
  }

  try {
    const params = new URLSearchParams({
      from,
      to,
      ...(amount && { amount: amount.toString() }),
    });

    const response = await axios.get(`/api/currency/convert?${params}`);
    const data = response.data;

    // Cache the rate
    rateCache.set(cacheKey, {
      rate: data.rate,
      timestamp: now,
    });

    return data;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
}

// Get multiple currency rates at once
export async function getCurrencyRates(
  from: string,
  toCurrencies: string[]
): Promise<Record<string, number>> {
  const rates: Record<string, number> = {};
  
  // Process in parallel
  const promises = toCurrencies.map(async (to) => {
    try {
      const conversion = await convertCurrency(from, to);
      rates[to] = conversion.rate;
    } catch (error) {
      console.error(`Error getting rate for ${from} to ${to}:`, error);
      rates[to] = 1; // Fallback to 1:1
    }
  });

  await Promise.all(promises);
  return rates;
}

// Format currency amount
export function formatCurrency(amount: number, currency: string): string {
  console.log('🔍 formatCurrency called with:', { amount, currency, type: typeof amount });
  
  if (isNaN(amount) || amount === null || amount === undefined) {
    console.log('🔍 formatCurrency: Invalid amount, returning $0');
    return '$0';
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const result = formatter.format(amount);
  console.log('🔍 formatCurrency result:', result);
  return result;
}

// Get currency symbol
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    HKD: 'HK$',
    SGD: 'S$',
    KRW: '₩',
    BRL: 'R$',
    MXN: '$',
    RUB: '₽',
    ZAR: 'R',
    NOK: 'kr',
    SEK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    HUF: 'Ft',
    TRY: '₺',
    ILS: '₪',
    AED: 'د.إ',
    SAR: '﷼',
    QAR: '﷼',
    KWD: 'د.ك',
    BHD: 'د.ب',
    OMR: '﷼',
    JOD: 'د.ا',
    LBP: 'ل.ل',
    EGP: '£',
    MAD: 'د.م.',
    TND: 'د.ت',
    DZD: 'د.ج',
    LYD: 'ل.د',
    SDG: 'ج.س.',
    ETB: 'Br',
    KES: 'KSh',
    UGX: 'USh',
    TZS: 'TSh',
    ZMW: 'ZK',
    BWP: 'P',
    SZL: 'L',
    LSL: 'L',
    NAD: 'N$',
    MUR: '₨',
    SCR: '₨',
    KMF: 'CF',
    DJF: 'Fdj',
    SOS: 'S',
    ERN: 'Nfk',
    AOA: 'Kz',
    MZN: 'MT',
    BIF: 'FBu',
    RWF: 'RF',
    CDF: 'FC',
    XAF: 'FCFA',
    XOF: 'CFA',
    GMD: 'D',
    GHS: '₵',
    NGN: '₦',
    SLL: 'Le',
    LRD: 'L$',
    GNF: 'FG',
    CVE: '$',
    STN: 'Db',
    MGA: 'Ar',
    MWK: 'MK',
    ZWL: 'Z$',
    BDT: '৳',
    PKR: '₨',
    LKR: '₨',
    NPR: '₨',
    AFN: '؋',
    IRR: '﷼',
    IQD: 'د.ع',
    SYP: '£',
    YER: '﷼',
    RSD: 'дин.',
    BAM: 'КМ',
    MKD: 'ден',
    ALL: 'L',
    MDL: 'L',
    UAH: '₴',
    BYN: 'Br',
    GEL: '₾',
    AMD: '֏',
    AZN: '₼',
    KZT: '₸',
    UZS: 'лв',
    KGS: 'лв',
    TJS: 'SM',
    TMT: 'T',
    MNT: '₮',
    VND: '₫',
    THB: '฿',
    LAK: '₭',
    KHR: '៛',
    MMK: 'K',
    IDR: 'Rp',
    MYR: 'RM',
    PHP: '₱',
    BND: 'B$',
    FJD: 'FJ$',
    PGK: 'K',
    SBD: 'SI$',
    VUV: 'Vt',
    WST: 'WS$',
    TOP: 'T$',
    NZD: 'NZ$',
    XPF: '₣',
    ARS: '$',
    BOB: 'Bs',
    CLP: '$',
    COP: '$',
    PYG: '₲',
    PEN: 'S/',
    UYU: '$U',
    VES: 'Bs.S',
    GYD: 'G$',
    SRD: '$',
    BBD: 'Bds$',
    TTD: 'TT$',
    JMD: 'J$',
    BZD: 'BZ$',
    GTQ: 'Q',
    HNL: 'L',
    NIO: 'C$',
    CRC: '₡',
    PAB: 'B/.',
    DOP: 'RD$',
    HTG: 'G',
    CUP: '$',
    XCD: '$',
    AWG: 'ƒ',
    ANG: 'ƒ',
    KYD: '$',
    BMD: '$',
    BSD: '$',
    BAH: '$',
  };
  
  return symbols[currency] || currency;
}
