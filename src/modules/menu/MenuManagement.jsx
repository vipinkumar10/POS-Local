import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Edit2, Trash2, Search, BookOpen, X, Upload, Download } from 'lucide-react';
import db from '../../db/database';
import Modal from '../../shared/components/Modal';
import { useToast } from '../../shared/hooks/useToast';
import { generateId, formatCurrency } from '../../shared/utils/helpers';

export default function MenuManagement() {
  const fileInputRef = useRef(null);
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
  const [itemVariants, setItemVariants] = useState([]); // [{ unit: 'Half', price: 100 }]

  // Category form state
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🍽');

  // Recipe state
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeItem, setRecipeItem] = useState(null);
  const [currentIngredients, setCurrentIngredients] = useState([]);
  const [searchInv, setSearchInv] = useState('');

  const toast = useToast();
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray(), [], []);

  // ---- CSV Import Logic ----
  const downloadTemplate = () => {
    const headers = 'Name,Category,Price,Unit,IsVeg(true/false),Variants(Unit:Price|Unit:Price)\n' +
                    'Chicken Momo,Starters,150,plate,false,Half:80|Full:150\n' +
                    'Paneer Tikka,Starters,220,plate,true,';
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu_template.csv';
    a.click();
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        const items = [];
        const newCategories = new Set();

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          // Split by comma but handle potential quotes if needed (simplified for now)
          const [name, category, rawPrice, unit, rawIsVeg, rawVariants] = lines[i].split(',').map(s => s?.trim());
          
          if (name && category) {
            // Clean price (remove ₹, spaces, etc.)
            const price = Number(String(rawPrice || '0').replace(/[^0-9.]/g, ''));
            
            // Robust Veg check
            const vegValue = String(rawIsVeg).toLowerCase();
            const isVeg = vegValue === 'true' || vegValue === 'yes' || vegValue === 'veg' || vegValue === '1';

            // Parse Variants (Format: Half:100|Full:200)
            const variants = [];
            if (rawVariants && rawVariants.includes(':')) {
              rawVariants.split('|').forEach(v => {
                const [vUnit, vPrice] = v.split(':');
                if (vUnit && vPrice) {
                  variants.push({ 
                    unit: vUnit.trim(), 
                    price: Number(vPrice.replace(/[^0-9.]/g, '')) 
                  });
                }
              });
            }

            items.push({ name, category, price, unit: unit || 'plate', isVeg, variants });
            newCategories.add(category);
          }
        }

        if (items.length === 0) throw new Error('No valid items found');

        const existingCats = await db.categories.toArray();
        for (const catName of newCategories) {
          const exists = existingCats.find(c => c.name.toLowerCase() === catName.toLowerCase());
          if (!exists) {
            const id = generateId();
            await db.categories.add({ id, name: catName, icon: '🍽', isActive: true, sortOrder: 0, updatedAt: new Date() });
            existingCats.push({ id, name: catName });
          }
        }

        const finalCats = await db.categories.toArray();
        for (const item of items) {
          const cat = finalCats.find(c => c.name.toLowerCase() === item.category.toLowerCase());
          await db.menuItems.add({
            id: generateId(),
            name: item.name,
            categoryId: cat.id,
            price: item.price,
            unit: item.unit,
            isVeg: item.isVeg,
            isActive: true,
            updatedAt: new Date(),
            variants: item.variants
          });
        }
        toast.success(`Imported ${items.length} items!`);
        fileInputRef.current.value = '';
      } catch (err) { toast.error('Import failed: ' + err.message); }
    };
    reader.readAsText(file);
  };
  const menuItems = useLiveQuery(() => db.menuItems.toArray(), [], []);
  const inventoryItems = useLiveQuery(() => db.inventoryItems.toArray(), [], []);

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
      setItemVariants(item.variants || []);
    } else {
      setEditItem(null);
      setItemName('');
      setItemPrice('');
      setItemCategory(categories[0]?.id || '');
      setItemIsVeg(true);
      setItemUnit('plate');
      setItemVariants([]);
    }
    setShowItemForm(true);
  };

  const saveItem = async () => {
    const hasVariants = itemVariants.length > 0;
    if (!itemName.trim() || (!itemPrice && !hasVariants) || !itemCategory) {
      toast.error('Please fill name, category and price');
      return;
    }
    const data = {
      name: itemName.trim(),
      price: hasVariants ? (Number(itemPrice) || itemVariants[0].price) : Number(itemPrice),
      categoryId: itemCategory,
      isVeg: itemIsVeg,
      unit: hasVariants ? (itemUnit || itemVariants[0].unit) : itemUnit,
      variants: itemVariants.map(v => ({ ...v, price: Number(v.price) })),
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

  // ---- Recipe CRUD ----
  const openRecipeModal = async (item) => {
    setRecipeItem(item);
    const ingredients = await db.menuItemIngredients
      .where('menuItemId').equals(item.id).toArray();

    // Enrich with inventory names and units
    const enriched = await Promise.all(ingredients.map(async ing => {
      const inv = await db.inventoryItems.get(ing.inventoryItemId);
      return { ...ing, inventoryName: inv?.name || 'Unknown', unit: inv?.unit || '' };
    }));

    setCurrentIngredients(enriched);
    setShowRecipeModal(true);
  };

  const addIngredient = async (invItem) => {
    const exists = currentIngredients.find(i => i.inventoryItemId === invItem.id);
    if (exists) {
      toast.error('Ingredient already added');
      return;
    }

    const newIng = {
      id: generateId(),
      menuItemId: recipeItem.id,
      inventoryItemId: invItem.id,
      quantityRequired: 1,
      inventoryName: invItem.name,
      unit: invItem.unit
    };

    await db.menuItemIngredients.add(newIng);
    setCurrentIngredients([...currentIngredients, newIng]);
    setSearchInv('');
    toast.success('Ingredient added to recipe');
  };

  const updateIngQty = async (id, qty) => {
    const val = Number(qty);
    if (val < 0) return;
    await db.menuItemIngredients.update(id, { quantityRequired: val });
    setCurrentIngredients(prev => prev.map(i => i.id === id ? { ...i, quantityRequired: val } : i));
  };

  const removeIngredient = async (id) => {
    await db.menuItemIngredients.delete(id);
    setCurrentIngredients(prev => prev.filter(i => i.id !== id));
    toast.info('Ingredient removed from recipe');
  };

  const EMOJI_OPTIONS = ['🍽', '🥟', '☕', '🍱', '🍗', '🍛', '🍰', '🥤', '🍕', '🌮', '🍜', '🥗', '🍔', '🧁', '🫖', '🍿'];

  return (
    <>
      <div className="page-header">
        <h1>🍽 Menu Management</h1>
        <div className="page-header-actions">
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleCSVUpload} />
          <button className="btn btn-ghost" onClick={downloadTemplate} title="Download Template">
            <Download size={16} /> Template
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
            <Upload size={16} /> Bulk Import
          </button>
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
                          <button className="btn btn-secondary btn-sm" onClick={() => openRecipeModal(item)} title="Manage Recipe">
                            <BookOpen size={14} /> Recipe
                          </button>
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
            <label className="form-label" style={itemVariants.length > 0 ? { opacity: 0.5 } : {}}>
              Base Price (₹) {itemVariants.length > 0 ? '(Using Variants)' : '*'}
            </label>
            <input 
              className="form-input" 
              type="number" 
              min="0" 
              placeholder={itemVariants.length > 0 ? "Disabled" : "150"} 
              value={itemPrice} 
              onChange={e => setItemPrice(e.target.value)} 
              disabled={itemVariants.length > 0}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={itemVariants.length > 0 ? { opacity: 0.5 } : {}}>
              Base Unit {itemVariants.length > 0 ? '(Using Variants)' : ''}
            </label>
            <select 
              className="form-select" 
              value={itemUnit} 
              onChange={e => setItemUnit(e.target.value)}
              disabled={itemVariants.length > 0}
            >
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

        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Multi-Unit Variants (Optional)</label>
            <button 
              type="button" 
              className="btn btn-ghost btn-sm"
              onClick={() => setItemVariants([...itemVariants, { unit: '', price: '' }])}
            >
              + Add Unit
            </button>
          </div>
          {itemVariants.map((v, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input 
                placeholder="Unit (e.g. Half)" 
                className="form-input" 
                style={{ flex: 2 }}
                value={v.unit}
                onChange={e => {
                  const newV = [...itemVariants];
                  newV[idx].unit = e.target.value;
                  setItemVariants(newV);
                }}
              />
              <input 
                placeholder="Price" 
                type="number" 
                className="form-input" 
                style={{ flex: 1 }}
                value={v.price}
                onChange={e => {
                  const newV = [...itemVariants];
                  newV[idx].price = e.target.value;
                  setItemVariants(newV);
                }}
              />
              <button 
                type="button" 
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => {
                  const newV = itemVariants.filter((_, i) => i !== idx);
                  setItemVariants(newV);
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
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

      {/* Recipe Management Modal */}
      <Modal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title={`Recipe: ${recipeItem?.name || ''}`}
        footer={
          <button className="btn btn-primary" onClick={() => setShowRecipeModal(false)}>Done</button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Add ingredients that are consumed when preparing this item.
          </p>
          <div className="search-bar" style={{ width: '100%' }}>
            <Search size={16} />
            <input
              placeholder="Search ingredients to add..."
              value={searchInv}
              onChange={e => setSearchInv(e.target.value)}
            />
          </div>
          {searchInv && (
            <div className="card" style={{ padding: 4, marginTop: 4, maxHeight: 150, overflow: 'auto', border: '1.5px solid var(--color-primary-bg)' }}>
              {inventoryItems
                .filter(i => i.name.toLowerCase().includes(searchInv.toLowerCase()))
                .map(inv => (
                  <div
                    key={inv.id}
                    className="list-item-hover"
                    style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4, display: 'flex', justifyContent: 'space-between' }}
                    onClick={() => addIngredient(inv)}
                  >
                    <span>{inv.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{inv.unit}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Qty Required</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {currentIngredients.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
                    No ingredients added yet
                  </td>
                </tr>
              ) : (
                currentIngredients.map(ing => (
                  <tr key={ing.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ing.inventoryName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Per unit</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: 80, minHeight: 32, padding: '2px 8px' }}
                          value={ing.quantityRequired}
                          onChange={e => updateIngQty(ing.id, e.target.value)}
                        />
                        <span style={{ fontSize: '0.8rem' }}>{ing.unit}</span>
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeIngredient(ing.id)}>
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}
