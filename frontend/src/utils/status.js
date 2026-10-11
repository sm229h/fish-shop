export const STATUS_LABELS = {
  pending_review: 'در انتظار بررسی',
  confirmed: 'تأیید شده',
  preparing: 'در حال آماده‌سازی',
  ready_to_ship: 'آماده ارسال',
  shipped: 'ارسال شده',
  delivered: 'تحویل داده شده',
  rejected: 'رد شده',
  cancelled: 'لغو شده',
  needs_contact: 'نیازمند تماس',
};

export const ORDER_FLOW = ['pending_review', 'confirmed', 'preparing', 'ready_to_ship', 'shipped', 'delivered'];

export function formatPrice(amount) {
  if (amount == null) return '';
  return new Intl.NumberFormat('fa-IR').format(Math.round(amount)) + ' تومان';
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
