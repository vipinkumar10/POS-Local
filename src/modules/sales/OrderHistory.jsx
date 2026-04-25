import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Eye, Calendar, Filter } from 'lucide-react';
import db from '../../db/database';
import Modal from '../../shared/components/Modal';
import { formatCurrency, formatDateTime, formatDate } from '../../shared/utils/helpers';
import ReceiptPrinter from '../../shared/components/ReceiptPrinter';
import { useRef } from 'react';
import { usePrinterStore } from '../printing/store/printerStore';
import { bluetoothService } from '../printing/services/bluetoothService';
import { buildOrderReceipt } from '../printing/services/receiptBuilder';
import { useToast } from '../../shared/hooks/useToast';

export default function OrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const receiptRef = useRef();
  const config = useLiveQuery(() => db.businessConfig.get('config'));
  const { isConnected } = usePrinterStore();
  const toast = useToast();

  const handlePrint = async () => {
    if (isConnected && selectedOrder) {
      try {
        const bytes = buildOrderReceipt(selectedOrder, orderItems, config);
        await bluetoothService.printReceipt(bytes);
        toast.success('Receipt sent to Bluetooth Printer!');
      } catch (err) {
        toast.error('Print failed: ' + err.message);
      }
    } else {
      window.print();
    }
  };

  const orders = useLiveQuery(
    () => db.orders.orderBy('orderDate').reverse().toArray(),
    [], []
  );

  const orderItems = useLiveQuery(
    () => selectedOrder ? db.orderItems.where('orderId').equals(selectedOrder.id).toArray() : [],
    [selectedOrder], []
  );

  const filtered = orders.filter(o => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!o.orderNumber.toLowerCase().includes(q) && !(o.customerName || '').toLowerCase().includes(q)) return false;
    }
    if (filterMode !== 'all' && o.paymentMode !== filterMode) return false;
    return true;
  });

  return (
    <>
      <div className="page-header">
        <h1>📋 Order History</h1>
        <div className="page-header-actions">
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="page-content">
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          {['all', 'Cash', 'UPI', 'Card'].map(mode => (
            <button
              key={mode}
              className={`tab-btn ${filterMode === mode ? 'active' : ''}`}
              onClick={() => setFilterMode(mode)}
            >
              {mode === 'all' ? 'All Orders' : mode}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={14} />
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="card" style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <p>No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(order => (
                  <tr key={order.id}>
                    <td><strong>{order.orderNumber}</strong></td>
                    <td style={{ fontSize: '0.8rem' }}>{formatDateTime(order.orderDate)}</td>
                    <td>
                      <span className={`badge ${order.orderType === 'dine-in' ? 'badge-info' : 'badge-warning'}`}>
                        {order.orderType === 'dine-in' ? '🍽 Dine-in' : '📦 Takeaway'}
                      </span>
                    </td>
                    <td>{order.tableNumber ? `Table ${order.tableNumber}` : '—'}</td>
                    <td>
                      <span className="badge badge-success">
                        {order.paymentMode === 'Cash' && '💵'}
                        {order.paymentMode === 'UPI' && '📱'}
                        {order.paymentMode === 'Card' && '💳'}
                        {' '}{order.paymentMode}
                      </span>
                    </td>
                    <td><strong>{formatCurrency(order.totalAmount)}</strong></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(order)}>
                        <Eye size={15} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>Order {selectedOrder?.orderNumber || ''}</span>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              🖨 Print Receipt
            </button>
          </div>
        }
        wide
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: '0.8rem' }}>
              <div>
                <div style={{ color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>Date</div>
                <div>{formatDateTime(selectedOrder.orderDate)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>Type</div>
                <div>{selectedOrder.orderType}{selectedOrder.tableNumber ? ` • Table ${selectedOrder.tableNumber}` : ''}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>Payment</div>
                <div>{selectedOrder.paymentMode}</div>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.menuItemName}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                    <td style={{ textAlign: 'right' }}><strong>{formatCurrency(item.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px solid var(--border-color-light)', paddingTop: 12 }}>
              <div className="cart-summary-row">
                <span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="cart-summary-row discount">
                  <span>Discount</span><span>−{formatCurrency(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="cart-summary-row">
                <span>Tax ({selectedOrder.taxPercent}%)</span><span>{formatCurrency(selectedOrder.taxAmount)}</span>
              </div>
              <div className="cart-summary-row total">
                <span>Total</span><span>{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Thermal Receipt Printer */}
      <ReceiptPrinter 
        ref={receiptRef}
        order={selectedOrder} 
        orderItems={orderItems} 
        config={config} 
      />
    </>
  );
}
