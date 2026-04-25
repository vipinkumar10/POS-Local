import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

try {
  const encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
  encoder.initialize();

  const item = { menuItemName: "Momo", quantity: 2, price: 150, total: 300 };

  encoder.table([
    { width: 15, marginRight: 1, align: 'left' },
    { width: 3, marginRight: 1, align: 'right' },
    { width: 6, marginRight: 1, align: 'right' },
    { width: 5, align: 'right' }
  ], [
    ['Item', 'Qty', 'Price', 'Total']
  ]);

  encoder.table([
      { width: 15, marginRight: 1, align: 'left' },
      { width: 3, marginRight: 1, align: 'right' },
      { width: 6, marginRight: 1, align: 'right' },
      { width: 5, align: 'right' }
  ], [
      [
        item.menuItemName.substring(0, 15), 
        item.quantity.toString(), 
        item.price.toString(), 
        item.total.toString()
      ]
  ]);

  const bytes = encoder.encode();
  console.log(Buffer.from(bytes).toString());
} catch (e) {
  console.error(e);
}
