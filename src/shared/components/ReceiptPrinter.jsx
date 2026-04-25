import { forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency, formatDateTime } from '../utils/helpers';

const ReceiptPrinter = forwardRef(({ order, orderItems, config, printType = 'receipt' }, ref) => {
  if (!order || !orderItems) return null;

  const content = (
    <div ref={ref} className="receipt-print-container">
      {printType === 'kot' ? (
        <>
          <div className="receipt-header">
            <h2>KITCHEN ORDER TICKET</h2>
            <p>Wait Time: {formatDateTime(order.orderDate).split(',')[1]}</p>
          </div>
          <div className="receipt-divider" />
          <div className="receipt-meta">
            <p>Order #: {order.orderNumber}</p>
            <p>Type: {order.orderType}</p>
            {order.tableNumber && <p>Table: {order.tableNumber}</p>}
          </div>
          <div className="receipt-divider" />
        </>
      ) : (
        <>
          <div className="receipt-header">
            <h2>{config?.businessName || 'POS Local'}</h2>
            <p>{config?.address || 'Your Address'}</p>
            <p>{config?.phone || 'Your Phone'}</p>
          </div>
          <div className="receipt-divider" />
          <div className="receipt-meta">
            <p>Order #: {order.orderNumber}</p>
            <p>Date: {formatDateTime(order.orderDate)}</p>
            <p>Type: {order.orderType}</p>
            {order.tableNumber && <p>Table: {order.tableNumber}</p>}
            {order.customerName && <p>Customer: {order.customerName}</p>}
          </div>
          <div className="receipt-divider" />
        </>
      )}

      <table className="receipt-items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            {printType === 'receipt' && <th>Amt</th>}
          </tr>
        </thead>
        <tbody>
          {orderItems.map(item => (
            <tr key={item.id}>
              <td>{item.menuItemName}</td>
              <td>{item.quantity}</td>
              {printType === 'receipt' && <td style={{ textAlign: 'right' }}>{formatCurrency(item.total)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-divider" />

      {printType === 'receipt' && (
        <>
          <div className="receipt-summary">
            <div className="receipt-row">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="receipt-row">
                <span>Discount</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="receipt-row">
              <span>Tax</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="receipt-row receipt-total">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="receipt-divider" />
          
          <div className="receipt-footer">
            <p>Paid via {order.paymentMode}</p>
            <p>Thank you for visiting!</p>
          </div>
        </>
      )}
    </div>
  );

  return createPortal(content, document.body);
});

ReceiptPrinter.displayName = 'ReceiptPrinter';

export default ReceiptPrinter;
