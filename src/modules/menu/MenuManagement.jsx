import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Edit2, Trash2, Search, ChevronRight } from 'lucide-react';
import db from '../../db/database';
import Modal from '../../shared/components/Modal';
import { useToast } from '../../shared/hooks/useToast';
import { generateId, formatCurrency } from '../../shared/utils/helpers';

export default function MenuManagement() {
  const [activeTab, setActiveTab] = useState('items');
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editCat, setEditCat] = useState(null);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Item form state
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemUnit, setItemUnit] = useState('plate');

  // Category form state
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🍽');

  const toast = useToast();
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray(), [], []);
  const menuItems = useLiveQuery(() => db.menuItems.toArray(), [], []);

  const filteredItems = menuItems.filter(i => {
    if (selectedCat !== 'all' && i.categoryId !== selectedCat) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!i.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name || '—';

  // ---- Item CRUD ----
  const openItemForm = (item = null) => {
    if (item) {
      setEditItem(item);
      setItemName(item.name);
      setItemPrice(String(item.price));
      setItemCategory(item.categoryId);
      setItemIsVeg(item.isVeg);
      setItemUnit(item.unit || 'plate');
    } else {
      setEditItem(null);
      setItemName('');
      setItemPrice('');
      setItemCategory(categories[0]?.id || '');
      setItemIsVeg(true);
      setItemUnit('plate');
    }
    setShowItemForm(true);
  };

  const saveItem = async () => {
    if (!itemName.trim() || !itemPrice || !itemCategory) {
      toast.error('Please fill all required fields');
      return;
    }
    const data = {
      name: itemName.trim(),
      price: Number(itemPrice),
      categoryId: itemCategory,
      isVeg: itemIsVeg,
      unit: itemUnit,
      isActive: true,
      imageBase64: '',
      updatedAt: new Date(),
    };

    if (editItem) {
      await db.menuItems.update(editItem.id, data);
      toast.success('Menu item updated');
    } else {
      await db.menuItems.add({ id: generateId(), ...data });
      toast.success('Menu item added');
    }
    setShowItemForm(false);
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await db.menuItems.update(id, { isActive: false });
    toast.info('Menu item removed');
  };

  // ---- Category CRUD ----
  const openCatForm = (cat = null) => {
    if (cat) {
      setEditCat(cat);
      setCatName(cat.name);
      setCatIcon(cat.icon);
    } else {
      setEditCat(null);
      setCatName('');
      setCatIcon('🍽');
    }
    setShowCatForm(true);
  };

  const saveCat = async () => {
    if (!catName.trim()) {
      toast.error('Category name is required');
      return;
    }
    const data = { name: catName.trim(), icon: catIcon, isActive: true, updatedAt: new Date() };

    if (editCat) {
      await db.categories.update(editCat.id, data);
      toast.success('Category updated');
    } else {
      const maxSort = Math.max(0, ...categories.map(c => c.sortOrder || 0));
      await db.categories.add({ id: generateId(), ...data, sortOrder: maxSort + 1 });
      toast.success('Category added');
    }
    setShowCatForm(false);
  };

  const deleteCat = async (id) => {
    if (!confirm('Delete this category?')) return;
    await db.categories.update(id, { isActive: false });
    toast.info('Category removed');
  };

  const EMOJI_OPTIONS = ['🍽', '🥟', '☕', '🍱', '🍗', '🍛', '🍰', '🥤', '🍕', '🌮', '🍜', '🥗', '🍔', '🧁', '🫖', '🍿'];

  return (
    <>
      <div className="page-header">
        <h1>🍽 Menu Management</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => openCatForm()}>
            <Plus size={16} /> Category
          </button>
          <button className="btn btn-primary" onClick={() => openItemForm()}>
            <Plus size={16} /> Menu Item
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          <button className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>
            Menu Items ({menuItems.filter(i => i.isActive).length})
          </button>
          <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
            Categories ({categories.filter(c => c.isActive).length})
          </button>
          {activeTab === 'items' && (
            <div className="search-bar" style={{ marginLeft: 'auto', width: 200 }}>
              <Search size={16} />
              <input placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          )}
        </div>

        {activeTab === 'items' && (
          <>
            {/* Category filter chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <button className={`pos-category-tab ${selectedCat === 'all' ? 'active' : ''}`} onClick={() => setSelectedCat('all')}>All</button>
              {categories.filter(c => c.isActive).map(cat => (
                <button key={cat.id} className={`pos-category-tab ${selectedCat === cat.id ? 'active' : ''}`} onClick={() => setSelectedCat(cat.id)}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            <div className="card" style={{ overflow: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.filter(i => i.isActive).map(item => (
                    <tr key={item.id}>
                      <td><span className={item.isVeg ? 'badge-veg' : 'badge-nonveg'} /></td>
                      <td><strong>{item.name}</strong></td>
                      <td>{getCategoryName(item.categoryId)}</td>
                      <td><strong>{formatCurrency(item.price)}</strong></td>
                      <td>{item.unit}</td>
                      <td><span className="badge badge-success">Active</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openItemForm(item)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'categories' && (
          <div className="card-grid">
            {categories.filter(c => c.isActive).map(cat => (
              <div key={cat.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: '2rem' }}>{cat.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{cat.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {menuItems.filter(i => i.categoryId === cat.id && i.isActive).length} items
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openCatForm(cat)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteCat(cat.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Form Modal */}
      <Modal
        isOpen={showItemForm}
        onClose={() => setShowItemForm(false)}
        title={editItem ? 'Edit Menu Item' : 'Add Menu Item'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowItemForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveItem}>
              {editItem ? 'Update' : 'Add Item'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Item Name *</label>
          <input className="form-input" placeholder="e.g. Chicken Momo" value={itemName} onChange={e => setItemName(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price (₹) *</label>
            <input className="form-input" type="number" min="0" placeholder="150" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select className="form-select" value={itemUnit} onChange={e => setItemUnit(e.target.value)}>
              <option value="plate">Plate</option>
              <option value="cup">Cup</option>
              <option value="glass">Glass</option>
              <option value="pcs">Pieces</option>
              <option value="combo">Combo</option>
              <option value="bowl">Bowl</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select className="form-select" value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
            <option value="">Select category</option>
            {categories.filter(c => c.isActive).map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn ${itemIsVeg ? 'btn-success' : 'btn-secondary'}`} onClick={() => setItemIsVeg(true)}>
              <span className="badge-veg" /> Veg
            </button>
            <button className={`btn ${!itemIsVeg ? 'btn-danger' : 'btn-secondary'}`} style={!itemIsVeg ? { background: 'var(--color-danger)', color: '#fff' } : {}} onClick={() => setItemIsVeg(false)}>
              <span className="badge-nonveg" /> Non-Veg
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Form Modal */}
      <Modal
        isOpen={showCatForm}
        onClose={() => setShowCatForm(false)}
        title={editCat ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCatForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveCat}>
              {editCat ? 'Update' : 'Add Category'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Category Name *</label>
          <input className="form-input" placeholder="e.g. Starters" value={catName} onChange={e => setCatName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Icon</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                className={`btn btn-icon ${catIcon === emoji ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCatIcon(emoji)}
                style={{ fontSize: '1.3rem' }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
