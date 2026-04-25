/**
 * Receipt Builder
 * Generates formatted receipt text for browser print or ESC/POS thermal printing.
 * No external encoder library required — outputs plain text lines compatible with
 * basic thermal printers via bluetoothService, or used to populate the ReceiptPrinter
 * HTML component for browser window.print().
 */
import { format } from 'date-fns';

const COLS = 32;

function padLine(left, right, total = COLS) {
  const space = total - left.length - right.length;
  return left + ' '.repeat(Math.max(1, space)) + right;
}

function divider(char = '-') {
  return char.repeat(COLS);
}

function center(text, total = COLS) {
  const pad = Math.max(0, Math.floor((total - text.length) / 2));
  return ' '.repeat(pad) + text;
}

/**
 * Builds a plain-text receipt string for an order.
 * @returns {string} Formatted receipt text
 */
export function buildOrderReceiptText(order, orderItems, config) {
  const businessName = config?.businessName || 'POS Local';
  const address = config?.address || '';
  const gstNumber = config?.gstNumber || '';
  const footerMessage = config?.footerMessage || 'Thank you! Visit again!';

  const lines = [];

  // Header
  lines.push(center(businessName));
  if (address) lines.push(center(address));
  if (gstNumber) lines.push(center(`GST: ${gstNumber}`));
  lines.push(divider());

  // Order info
  lines.push(`Order : ${order.orderNumber}`);
  lines.push(`Date  : ${format(new Date(order.orderDate), 'dd/MM/yyyy hh:mm a')}`);
  lines.push(`Type  : ${order.orderType}${order.tableNumber ? ` | Table: ${order.tableNumber}` : ''}`);
  if (order.customerName) lines.push(`Cust  : ${order.customerName}`);
  lines.push(divider());

  // Items header
  lines.push(padLine('Item', 'Qty  Amount'));
  lines.push(divider('-'));

  orderItems.forEach(item => {
    let name = item.menuItemName;
    if (name.length > 18) name = name.substring(0, 18);
    const right = `${item.quantity} ${item.total.toFixed(2).padStart(7)}`;
    lines.push(padLine(name, right));
  });

  lines.push(divider());

  // Totals
  lines.push(padLine('Subtotal:', `Rs.${order.subtotal.toFixed(2)}`));
  if (order.discountAmount > 0) {
    lines.push(padLine('Discount:', `-Rs.${order.discountAmount.toFixed(2)}`));
  }
  if (order.taxAmount > 0) {
    const half = (order.taxAmount / 2).toFixed(2);
    lines.push(padLine(`CGST (${(order.taxPercent / 2).toFixed(1)}%):`, `Rs.${half}`));
    lines.push(padLine(`SGST (${(order.taxPercent / 2).toFixed(1)}%):`, `Rs.${half}`));
  }
  lines.push(divider('='));
  lines.push(padLine('TOTAL:', `Rs.${order.totalAmount.toFixed(2)}`));
  lines.push(divider('-'));

  lines.push(`Payment: ${order.paymentMode}`);
  lines.push(divider());
  lines.push(center(footerMessage));
  lines.push('');
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

/**
 * Builds a KOT (Kitchen Order Ticket) text string.
 * @returns {string} Formatted KOT text
 */
export function buildKOTText(order, orderItems) {
  const lines = [];

  lines.push(center('KITCHEN ORDER TICKET'));
  lines.push(divider());
  lines.push(`Order : ${order.orderNumber}`);
  lines.push(`Time  : ${format(new Date(order.orderDate), 'hh:mm a')}`);
  lines.push(`Type  : ${order.orderType}${order.tableNumber ? ` | Table: ${order.tableNumber}` : ''}`);
  lines.push(divider());

  orderItems.forEach(item => {
    const qty = `${item.quantity}x `.padStart(5);
    lines.push(`${qty}${item.menuItemName}`);
  });

  lines.push(divider());
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

// Legacy aliases for any other code that imports these
export const buildOrderReceipt = buildOrderReceiptText;
export const buildKOT = buildKOTText;
