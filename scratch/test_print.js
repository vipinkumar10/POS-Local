import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

try {
  const encoder1 = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
  encoder1.initialize();
  encoder1.table(
    [{ width: 10, align: 'left' }, { width: 10, align: 'right' }], 
    ['Row1Col1', 'Row1Col2']
  );
  console.log("Success with 1D array arguments:", encoder1.encode().toString('hex'));

} catch (e) {
  console.error("Failed 1D array:", e.message);
}

try {
  const encoder2 = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
  encoder2.initialize();
  encoder2.table(
    [{ width: 10, align: 'left' }, { width: 10, align: 'right' }], 
    [['Row1Col1', 'Row1Col2']]
  );
  console.log("Success with Array of Arrays:", encoder2.encode().toString('hex'));
} catch (e) {
    console.error("Failed Array of arrays:", e.message);
}
