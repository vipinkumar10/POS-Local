import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Edit2, Search, PackagePlus, AlertTriangle } from 'lucide-react';
import db from '../../db/database';
import Modal from '../../shared/components/Modal';
import { useToast } from '../../shared/hooks/useToast';
import { generateId } from '../../shared/utils/helpers';

export default function InventoryManagement() {
  const [showForm, setShowForm] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLow, setFilterLow] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [openingStock, setOpeningStock] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');

  // Adjust state
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('add');
  const [adjustNote, setAdjustNote] = useState('');

  const toast = useToast();
  const items = useLiveQuery(() => db.inventoryItems.toArray(), [], []);

  const filtered = items.filter(i => {
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterLow && i.currentStock > i.minStockAlert) return false;
    return true;
  });

  const lowCount = items.filter(i => i.currentStock <= i.minStockAlert).length;

  const getStockLevel = (item) => {
    const ratio = item.openingStock > 0 ? item.currentStock / item.openingStock : 0;
    if (item.currentStock <= item.minStockAlert) return 'danger';
    if (ratio < 0.4) return 'warning';
    return 'good';
  };

  const getStockPercent = (item) => {
    if (item.openingStock <= 0) return 0;
    return Math.min(100, (item.currentStock / item.openingStock) * 100);
  };

  const openForm = (item = null) => {
    if (item) {
      setEditItem(item);
      setName(item.name);
      setUnit(item.unit);
      setOpeningStock(String(item.openingStock));
      setMinStockAlert(String(item.minStockAlert));
      setCostPerUnit(String(item.costPerUnit));
    } else {
      setEditItem(null);
      setName('');
      setUnit('kg');
      setOpeningStock('');
      setMinStockAlert('');
      setCostPerUnit('');
    }
    setShowForm(true);
  };

  const saveItem = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    const data = {
      name: name.trim(),
      unit,
      openingStock: Number(openingStock) || 0,
      minStockAlert: Number(minStockAlert) || 0,
      costPerUnit: Number(costPerUnit) || 0,
      updatedAt: new Date(),
    };

    if (editItem) {
      await db.inventoryItems.update(editItem.id, data);
      toast.success('Inventory item updated');
    } else {
      await db.inventoryItems.add({ id: generateId(), ...data, currentStock: Number(openingStock) || 0 });
      toast.success('Inventory item added');
    }
    setShowForm(false);
  };

  const openAdjust = (item) => {
    setAdjustItem(item);
    setAdjustQty('');
    setAdjustType('add');
    setAdjustNote('');
    setShowAdjust(true);
  };

  const saveAdjust = async () => {
    const qty = Number(adjustQty);
    if (!qty || qty <= 0) { toast.error('Enter a valid quantity'); return; }

    const delta = adjustType === 'add' ? qty : -qty;
    const newStock = Math.max(0, adjustItem.currentStock + delta);

    await db.transaction('rw', [db.inventoryItems, db.inventoryTransactions], async () => {
      await db.inventoryItems.update(adjustItem.id, {
        currentStock: newStock,
        updatedAt: new Date(),
      });
      await db.inventoryTransactions.add({
        id: generateId(),
        inventoryItemId: adjustItem.id,
        orderId: null,
        type: adjustType === 'add' ? 'MANUAL_ADD' : 'MANUAL_DEDUCT',
        quantity: delta,
        balanceAfter: newStock,
        createdAt: new Date(),
      });
    });

    toast.success(`Stock ${adjustType === 'add' ? 'added' : 'deducted'}: ${qty} ${adjustItem.unit}`);
    setShowAdjust(false);
  };

  return (
    <>
      <div className="page-header">
        <h1>📦 Inventory</h1>
        <div className="page-header-actions">
          {lowCount > 0 && (
            <button
              className={`btn ${filterLow ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setFilterLow(!filterLow)}
            >
              <AlertTriangle size={15} /> {lowCount} Low Stock
            </button>
          )}
          <button className="btn btn-primary" onClick={() => openForm()}>
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ marginBottom: 16 }}>
          <div className="search-bar" style={{ maxWidth: 300 }}>
            <Search size={16} />
            <input placeholder="Search inventory..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="card" style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Unit</th>
                <th>Opening Stock</th>
                <th>Current Stock</th>
                <th>Min Alert</th>
                <th>Stock Level</th>
                <th>Cost/Unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8"><div className="empty-state"><p>No inventory items found</p></div></td></tr>
              ) : (
                filtered.map(item => {
                  const level = getStockLevel(item);
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.unit}</td>
                      <td>{item.openingStock}</td>
                      <td>
                        <strong style={{ color: level === 'danger' ? 'var(--color-danger)' : level === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                          {item.currentStock}
                        </strong>
                      </td>
                      <td>{item.minStockAlert}</td>
                      <td style={{ minWidth: 120 }}>
                        <div className="stock-bar">
                          <div className={`stock-bar-fill ${level}`} style={{ width: `${getStockPercent(item)}%` }} />
                        </div>
                      </td>
                      <td>₹{item.costPerUnit}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-success btn-sm" onClick={() => openAdjust(item)} title="Adjust Stock">
                            <PackagePlus size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => openForm(item)}>
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveItem}>{editItem ? 'Update' : 'Add Item'}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Item Name *</label>
          <input className="form-input" placeholder="e.g. Chicken" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select className="form-select" value={unit} onChange={e => setUnit(e.target.value)}>
              <option value="kg">Kilogram (kg)</option>
              <option value="g">Gram (g)</option>
              <option value="litre">Litre</option>
              <option value="ml">Millilitre (ml)</option>
              <option value="pcs">Pieces (pcs)</option>
              <option value="dozen">Dozen</option>
              <option value="packet">Packet</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cost per Unit (₹)</label>
            <input className="form-input" type="number" min="0" placeholder="0" value={costPerUnit} onChange={e => setCostPerUnit(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{editItem ? 'Opening Stock' : 'Opening Stock *'}</label>
            <input className="form-input" type="number" min="0" placeholder="0" value={openingStock} onChange={e => setOpeningStock(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Min Stock Alert</label>
            <input className="form-input" type="number" min="0" placeholder="5" value={minStockAlert} onChange={e => setMinStockAlert(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={showAdjust}
        onClose={() => setShowAdjust(false)}
        title={`Adjust Stock — ${adjustItem?.name || ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAdjust(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveAdjust}>Confirm Adjustment</button>
          </>
        }
      >
        {adjustItem && (
          <>
            <div style={{ padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 8, fontSize: '0.85rem' }}>
              Current Stock: <strong>{adjustItem.currentStock} {adjustItem.unit}</strong>
            </div>
            <div className="form-group">
              <label className="form-label">Adjustment Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`btn ${adjustType === 'add' ? 'btn-success' : 'btn-secondary'}`} onClick={() => setAdjustType('add')}>
                  + Add Stock
                </button>
                <button className={`btn ${adjustType === 'deduct' ? 'btn-danger' : 'btn-secondary'}`} style={adjustType === 'deduct' ? { background: 'var(--color-danger)', color: '#fff' } : {}} onClick={() => setAdjustType('deduct')}>
                  − Deduct Stock
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity ({adjustItem.unit})</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
            </div>
            {adjustQty && (
              <div style={{ padding: '8px 12px', background: adjustType === 'add' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: adjustType === 'add' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                New Stock: {Math.max(0, adjustItem.currentStock + (adjustType === 'add' ? Number(adjustQty) : -Number(adjustQty)))} {adjustItem.unit}
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
