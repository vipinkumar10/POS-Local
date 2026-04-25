import { buildOrderReceipt, buildKOT } from '../src/modules/printing/services/receiptBuilder.js';

const order = {
  orderNumber: 'ORD-20260422-123',
  orderDate: new Date(),
  orderType: 'Dine-in',
  tableNumber: '5',
  subtotal: 500.50,
  discountAmount: 50.00,
  taxAmount: 22.50,
  totalAmount: 473.00,
  paymentMode: 'UPI'
};

const items = [
  { menuItemName: 'Chicken Momo', quantity: 2, price: 150, total: 300 },
  { menuItemName: 'Veg Hakka Noodles', quantity: 1, price: 200.50, total: 200.50 }
];

const config = {
  businessName: 'My Awesome Cafe',
  address: '123 Test Street',
  gstNumber: '22AAAAA0000A1Z5',
  footerMessage: 'Thank you for dining with us!'
};

try {
  const receiptBytes = buildOrderReceipt(order, items, config);
  const kotBytes = buildKOT(order, items);

  console.log("=== RECEIPT PREVIEW ===");
  // Simple buffer to string ignoring esc-pos non-ascii chars
  console.log(Buffer.from(receiptBytes).toString('ascii').replace(/[^\x20-\x7E\n\r]/g, ''));

  console.log("\n=== KOT PREVIEW ===");
  console.log(Buffer.from(kotBytes).toString('ascii').replace(/[^\x20-\x7E\n\r]/g, ''));

} catch (err) {
  console.error("Test failed:", err);
}
