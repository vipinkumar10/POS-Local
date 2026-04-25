import { format, startOfDay, endOfDay, subDays, isToday, parseISO } from 'date-fns';

export function formatCurrency(amount, currency = '₹') {
  if (amount == null || isNaN(amount)) return `${currency}0.00`;
  return `${currency}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date, pattern = 'dd MMM yyyy') {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a');
}

export function formatTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'hh:mm a');
}

export function getStartOfDay(date = new Date()) {
  return startOfDay(date);
}

export function getEndOfDay(date = new Date()) {
  return endOfDay(date);
}

export function getDateRange(days) {
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i);
    return { date: startOfDay(d), label: format(d, 'dd/MM') };
  });
}

export function isTodayDate(date) {
  return isToday(typeof date === 'string' ? parseISO(date) : date);
}

export function generateOrderNumber() {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `ORD-${dateStr}-${rand}`;
}

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

export function calculateDiscount(subtotal, discountType, discountValue) {
  if (!discountValue || discountValue <= 0) return 0;
  if (discountType === 'percentage') {
    return Math.min(subtotal, (subtotal * discountValue) / 100);
  }
  return Math.min(subtotal, discountValue);
}

export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const val = item[key];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
