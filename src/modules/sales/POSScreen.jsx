import { useState, useMemo, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Trash2, ShoppingBag, Percent, X, Mic, MicOff } from 'lucide-react';
import db from '../../db/database';
import Modal from '../../shared/components/Modal';
import { useToast } from '../../shared/hooks/useToast';
import {
  formatCurrency, generateOrderNumber, generateId,
  calculateDiscount, getStartOfDay, getEndOfDay,
} from '../../shared/utils/helpers';
import ReceiptPrinter from '../../shared/components/ReceiptPrinter';
import { usePrinterStore } from '../printing/store/printerStore';
import { bluetoothService } from '../printing/services/bluetoothService';
import { buildOrderReceipt, buildKOT } from '../printing/services/receiptBuilder';

export default function POSScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Discount state
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash');

  // Completed order for printing
  const [completedOrder, setCompletedOrder] = useState(null);
  const [completedOrderItems, setCompletedOrderItems] = useState([]);
  const [printType, setPrintType] = useState('receipt');
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [activeVariantItem, setActiveVariantItem] = useState(null);
  const receiptRef = useRef();

  const toast = useToast();

  const categories = useLiveQuery(() => db.categories.filter(c => c.isActive).sortBy('sortOrder'), [], []);
  const menuItems = useLiveQuery(() => db.menuItems.filter(i => i.isActive).toArray(), [], []);
  const config = useLiveQuery(() => db.businessConfig.get('config'));
  const { isConnected } = usePrinterStore();

  const handlePrint = async (type = 'receipt') => {
    if (isConnected && completedOrder) {
      try {
        const bytes = type === 'kot' 
          ? buildKOT(completedOrder, completedOrderItems) 
          : buildOrderReceipt(completedOrder, completedOrderItems, config);
        await bluetoothService.printReceipt(bytes);
        toast.success(`${type.toUpperCase()} sent to Bluetooth Printer!`);
      } catch (err) {
        toast.error('Print failed: ' + err.message);
      }
    } else {
      setPrintType(type);
      setTimeout(() => window.print(), 100);
    }
  };

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (selectedCategory !== 'all') {
      items = items.filter(i => i.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, selectedCategory, searchQuery]);

  const addToCart = useCallback((item, quantity = 1, selectedVariant = null) => {
    // If item has variants and none selected, show selection modal
    if (item.variants?.length > 0 && !selectedVariant) {
      setActiveVariantItem(item);
      setShowVariantModal(true);
      return;
    }

    const price = selectedVariant ? selectedVariant.price : item.price;
    const unit = selectedVariant ? selectedVariant.unit : item.unit;
    const cartKey = selectedVariant ? `${item.id}-${unit}` : item.id;

    setCart(prev => {
      const existing = prev.find(c => c.cartKey === cartKey);
      if (existing) {
        return prev.map(c =>
          c.cartKey === cartKey ? { ...c, quantity: c.quantity + quantity } : c
        );
      }
      return [...prev, {
        cartKey,
        menuItemId: item.id,
        menuItemName: item.name,
        price,
        unit,
        quantity: quantity,
        isVeg: item.isVeg,
      }];
    });
    
    if (selectedVariant) setShowVariantModal(false);
  }, []);

  // Voice Recognition Logic
  const startListening = () => {
    // Microphone access requires a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      toast.error('Microphone access requires a secure (HTTPS) connection. Please use localtunnel or host the app with SSL.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied. Please check your browser settings.');
      } else {
        toast.error('Voice error: ' + event.error);
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Voice Command:', transcript);
      parseVoiceCommand(transcript);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Recognition start error:', e);
      setIsListening(false);
    }
  };

  const parseVoiceCommand = async (text) => {
    // Check if device is online
    const isOnline = navigator.onLine;

    if (isOnline && import.meta.env.VITE_GEMINI_API_KEY) {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const menuContext = menuItems.map(i => `${i.name}`).join(", ");
        const prompt = `Extract items/quantities from: "${text}". Menu: [${menuContext}]. Return ONLY JSON array like [{"itemName": "Coffee", "quantity": 1}].`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text().replace(/```json|```/g, "").trim();
        const parsedItems = JSON.parse(jsonText);

        if (parsedItems.length > 0) {
          parsedItems.forEach(aiItem => {
            const matchedItem = menuItems.find(m => 
              m.name.toLowerCase().includes(aiItem.itemName.toLowerCase()) || 
              aiItem.itemName.toLowerCase().includes(m.name.toLowerCase())
            );
            if (matchedItem) addToCart(matchedItem, aiItem.quantity);
          });
          toast.success("AI parsed your order.");
          return;
        }
      } catch (err) {
        console.warn("AI failed, falling back to local parsing:", err);
      }
    }

    // LOCAL FALLBACK (Works Offline)
    localParseVoiceCommand(text);
  };

  const localParseVoiceCommand = (text) => {
    console.log("[Voice] Using local offline parser");
    const numberMap = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10 };
    
    let processedText = text.toLowerCase();
    Object.keys(numberMap).forEach(word => {
      processedText = processedText.replace(new RegExp(`\\b${word}\\b`, 'g'), numberMap[word]);
    });

    // Simple match: Look for numbers followed by menu item names
    menuItems.forEach(item => {
      const itemName = item.name.toLowerCase();
      if (processedText.includes(itemName)) {
        // Try to find quantity before the item name
        const regex = new RegExp(`(\\d+)?\\s*${itemName}`, 'i');
        const match = processedText.match(regex);
        const qty = match && match[1] ? parseInt(match[1]) : 1;
        
        addToCart(item, qty);
        toast.info(`Added ${qty} x ${item.name} (Offline Mode)`);
      }
    });
  };

  const updateQty = useCallback((cartKey, delta) => {
    setCart(prev => {
      return prev
        .map(c => c.cartKey === cartKey ? { ...c, quantity: c.quantity + delta } : c)
        .filter(c => c.quantity > 0);
    });
  }, []);

  const removeItem = useCallback((cartKey) => {
    setCart(prev => prev.filter(c => c.cartKey !== cartKey));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountValue('');
    setDiscountType('percentage');
    setTableNumber('');
    setCustomerName('');
  }, []);

  // Calculations
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const discountAmount = calculateDiscount(subtotal, discountType, Number(discountValue) || 0);
  const taxableAmount = subtotal - discountAmount;
  const gstPercent = config?.gstPercent || 5;
  const taxAmount = (taxableAmount * gstPercent) / 100;
  const totalAmount = taxableAmount + taxAmount;

  // Place order
  const placeOrder = async () => {
    if (cart.length === 0) return;

    try {
      const orderNumber = generateOrderNumber();
      const orderId = generateId();
      const now = new Date();

      const order = {
        id: orderId,
        orderNumber,
        orderType,
        orderDate: now,
        subtotal,
        discountType: discountAmount > 0 ? discountType : 'none',
        discountValue: Number(discountValue) || 0,
        discountAmount,
        taxPercent: gstPercent,
        taxAmount,
        totalAmount,
        paymentMode,
        status: 'COMPLETED',
        customerName: customerName || '',
        tableNumber: tableNumber || '',
        createdAt: now,
        updatedAt: now,
      };

      const orderItems = cart.map(c => ({
        id: generateId(),
        orderId,
        menuItemId: c.menuItemId,
        menuItemName: c.unit ? `${c.menuItemName} (${c.unit})` : c.menuItemName,
        price: c.price,
        quantity: c.quantity,
        total: c.price * c.quantity,
      }));

      // Transaction: save order + items + deduct inventory
      await db.transaction('rw', [db.orders, db.orderItems, db.inventoryItems, db.menuItemIngredients, db.inventoryTransactions], async () => {
        await db.orders.add(order);
        await db.orderItems.bulkAdd(orderItems);

        // Auto-deduct inventory
        for (const item of cart) {
          const ingredients = await db.menuItemIngredients
            .where('menuItemId').equals(item.menuItemId).toArray();

          for (const ing of ingredients) {
            const invItem = await db.inventoryItems.get(ing.inventoryItemId);
            if (invItem) {
              const deductQty = ing.quantityRequired * item.quantity;
              const newStock = Math.max(0, invItem.currentStock - deductQty);

              await db.inventoryItems.update(ing.inventoryItemId, {
                currentStock: newStock,
                updatedAt: now,
              });

              await db.inventoryTransactions.add({
                id: generateId(),
                inventoryItemId: ing.inventoryItemId,
                orderId,
                type: 'SALE_DEDUCTION',
                quantity: -deductQty,
                balanceAfter: newStock,
                createdAt: now,
              });
            }
          }
        }
      });

      setCompletedOrder(order);
      setCompletedOrderItems(orderItems);

      toast.success(`Order ${orderNumber} placed! Total: ${formatCurrency(totalAmount)}`);
      clearCart();
      setShowPayment(false);
    } catch (err) {
      console.error('Order error:', err);
      toast.error('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="pos-layout">
      {/* Left: Menu Panel */}
      <div className="pos-menu-panel">
        <div className="pos-menu-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>🛒 New Order</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="search-bar" style={{ width: 180 }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                className={`btn btn-icon ${isListening ? 'listening' : ''}`}
                style={{ 
                  background: isListening ? 'var(--color-danger)' : 'var(--color-primary-bg)',
                  color: isListening ? '#fff' : 'var(--color-primary)',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  border: isListening ? 'none' : '1px solid var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                onClick={startListening}
                title="Voice Order"
              >
                <Mic size={20} style={{ position: 'static', transform: 'none' }} />
              </button>
            </div>
          </div>
          <div className="pos-category-tabs">
            <button
              className={`pos-category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`pos-category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pos-items-grid">
          {filteredItems.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <ShoppingBag size={40} />
              <p>No items found</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="pos-item-card" onClick={() => addToCart(item)}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span className={item.isVeg ? 'badge-veg' : 'badge-nonveg'} />
                </div>
                <div className="item-name">{item.name}</div>
                <div className="item-price">{formatCurrency(item.price)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className="pos-cart-panel">
        <div className="cart-header">
          <h2>Current Order</h2>
          <div className="cart-type-toggle">
            <button
              className={`cart-type-btn ${orderType === 'dine-in' ? 'active' : ''}`}
              onClick={() => setOrderType('dine-in')}
            >
              Dine-in
            </button>
            <button
              className={`cart-type-btn ${orderType === 'takeaway' ? 'active' : ''}`}
              onClick={() => setOrderType('takeaway')}
            >
              Takeaway
            </button>
          </div>
        </div>

        {orderType === 'dine-in' && (
          <div style={{ padding: '8px 20px 0', display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              style={{ flex: 1, minHeight: 36, fontSize: '0.8rem' }}
              placeholder="Table #"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
            />
            <input
              className="form-input"
              style={{ flex: 1, minHeight: 36, fontSize: '0.8rem' }}
              placeholder="Customer name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>
        )}

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={36} />
              <p>Tap items to add to order</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartKey} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">
                    {item.menuItemName} 
                    {item.unit && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 6 }}>({item.unit})</span>}
                  </div>
                  <div className="cart-item-price">{formatCurrency(item.price)} each</div>
                </div>
                <div className="cart-qty-control">
                  <button className="cart-qty-btn minus" onClick={() => updateQty(item.cartKey, -1)}>−</button>
                  <span className="cart-qty-value">{item.quantity}</span>
                  <button className="cart-qty-btn" onClick={() => updateQty(item.cartKey, 1)}>+</button>
                </div>
                <div className="cart-item-total">{formatCurrency(item.price * item.quantity)}</div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeItem(item.cartKey)}>
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <>
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Subtotal ({cart.reduce((s, c) => s + c.quantity, 0)} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="cart-summary-row discount">
                  <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'})</span>
                  <span>−{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="cart-summary-row">
                <span>GST ({gstPercent}%)</span>
                <span>+{formatCurrency(taxAmount)}</span>
              </div>
              <div className="cart-summary-row total">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="cart-actions">
              <button className="btn btn-secondary" onClick={() => setShowDiscount(true)}>
                <Percent size={16} /> Discount
              </button>
              <button className="btn btn-danger btn-sm" onClick={clearCart}>
                <Trash2 size={16} />
              </button>
              <button className="btn btn-success btn-lg" style={{ flex: 2 }} onClick={() => setShowPayment(true)}>
                Pay {formatCurrency(totalAmount)}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Discount Modal */}
      <Modal
        isOpen={showDiscount}
        onClose={() => setShowDiscount(false)}
        title="Apply Discount"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setDiscountValue(''); setShowDiscount(false); }}>
              Remove Discount
            </button>
            <button className="btn btn-primary" onClick={() => setShowDiscount(false)}>
              Apply
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Discount Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn ${discountType === 'percentage' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDiscountType('percentage')}
            >
              Percentage (%)
            </button>
            <button
              className={`btn ${discountType === 'flat' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDiscountType('flat')}
            >
              Flat Amount (₹)
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">
            {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
          </label>
          <input
            className="form-input"
            type="number"
            min="0"
            max={discountType === 'percentage' ? '100' : subtotal}
            placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 50'}
            value={discountValue}
            onChange={e => setDiscountValue(e.target.value)}
          />
        </div>
        {discountValue && (
          <div style={{ padding: '8px 12px', background: 'var(--color-success-bg)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>
            Discount: {formatCurrency(calculateDiscount(subtotal, discountType, Number(discountValue)))}
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        title="Complete Payment"
        footer={
          <button className="btn btn-success btn-lg" style={{ width: '100%' }} onClick={placeOrder}>
            Confirm & Place Order — {formatCurrency(totalAmount)}
          </button>
        }
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency(totalAmount)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
            {cart.reduce((s, c) => s + c.quantity, 0)} items • {orderType}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Payment Mode</label>
          <div className="payment-modes">
            {[
              { mode: 'Cash', icon: '💵' },
              { mode: 'UPI', icon: '📱' },
              { mode: 'Card', icon: '💳' },
            ].map(p => (
              <button
                key={p.mode}
                className={`payment-mode-btn ${paymentMode === p.mode ? 'active' : ''}`}
                onClick={() => setPaymentMode(p.mode)}
              >
                <span className="pay-icon">{p.icon}</span>
                {p.mode}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Success Modal for Printing Receipt */}
      <Modal
        isOpen={!!completedOrder}
        onClose={() => { setCompletedOrder(null); setCompletedOrderItems([]); }}
        title="Order Completed Successfully!"
        footer={
          <button className="btn btn-primary" onClick={() => { setCompletedOrder(null); setCompletedOrderItems([]); }}>
            New Order
          </button>
        }
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 16 }}>Order {completedOrder?.orderNumber} placed</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-lg" onClick={() => handlePrint('kot')}>
              📝 Print KOT
            </button>
            <button className="btn btn-success btn-lg" onClick={() => handlePrint('receipt')}>
              🖨 Print Receipt
            </button>
          </div>
        </div>
      </Modal>

      <ReceiptPrinter 
        ref={receiptRef}
        order={completedOrder} 
        orderItems={completedOrderItems} 
        config={config} 
        printType={printType}
      />

      {/* Variant Selection Modal */}
      <Modal
        isOpen={showVariantModal}
        onClose={() => setShowVariantModal(false)}
        title={`Select Unit: ${activeVariantItem?.name}`}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {/* Variants */}
          {activeVariantItem?.variants?.map((v, i) => (
            <button 
              key={i}
              className="btn btn-secondary" 
              style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 4, height: 'auto', border: '1.5px solid var(--border-color)' }}
              onClick={() => addToCart(activeVariantItem, 1, v)}
            >
              <span style={{ fontWeight: 700 }}>{v.unit}</span>
              <span style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>{formatCurrency(v.price)}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
