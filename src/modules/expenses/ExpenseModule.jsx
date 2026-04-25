import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Search, Calendar } from 'lucide-react';
import db from '../../db/database';
import Modal from '../../shared/components/Modal';
import { useToast } from '../../shared/hooks/useToast';
import { generateId, formatCurrency, formatDate, formatDateTime, getStartOfDay, getEndOfDay } from '../../shared/utils/helpers';
import { format, subDays } from 'date-fns';

export default function ExpenseModule() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  // Form state
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expDate, setExpDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const toast = useToast();
  const expenseCategories = useLiveQuery(() => db.expenseCategories.filter(c => c.isActive).toArray(), [], []);
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), [], []);

  const dayStart = getStartOfDay(new Date(selectedDate));
  const dayEnd = getEndOfDay(new Date(selectedDate));

  const filtered = expenses.filter(e => {
    const d = new Date(e.date);
    if (d < dayStart || d > dayEnd) return false;
    if (filterCat !== 'all' && e.categoryId !== filterCat) return false;
    if (searchQuery && !e.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalForDay = filtered.reduce((s, e) => s + e.amount, 0);
  const getCategoryName = (id) => expenseCategories.find(c => c.id === id)?.name || '—';

  const quickDates = [
    { label: 'Today', date: format(new Date(), 'yyyy-MM-dd') },
    { label: 'Yesterday', date: format(subDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: '2 days ago', date: format(subDays(new Date(), 2), 'yyyy-MM-dd') },
  ];

  const openForm = () => {
    setExpAmount('');
    setExpCategory(expenseCategories[0]?.id || '');
    setExpDescription('');
    setExpDate(format(new Date(), 'yyyy-MM-dd'));
    setShowForm(true);
  };

  const saveExpense = async () => {
    if (!expAmount || Number(expAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!expCategory) { toast.error('Select a category'); return; }

    await db.expenses.add({
      id: generateId(),
      categoryId: expCategory,
      date: new Date(expDate),
      amount: Number(expAmount),
      description: expDescription.trim(),
      createdAt: new Date(),
    });

    toast.success(`Expense of ${formatCurrency(Number(expAmount))} added`);
    setShowForm(false);
  };

  const deleteExpense = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await db.expenses.delete(id);
    toast.info('Expense deleted');
  };

  return (
    <>
      <div className="page-header">
        <h1>💰 Expenses</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openForm}>
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Date picker & filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {quickDates.map(qd => (
              <button
                key={qd.date}
                className={`tab-btn ${selectedDate === qd.date ? 'active' : ''}`}
                onClick={() => setSelectedDate(qd.date)}
              >
                {qd.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="date"
              className="form-input"
              style={{ minHeight: 36, fontSize: '0.8rem', width: 160 }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="search-bar" style={{ marginLeft: 'auto', width: 200 }}>
            <Search size={16} />
            <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <button className={`pos-category-tab ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>
            All Categories
          </button>
          {expenseCategories.map(cat => (
            <button key={cat.id} className={`pos-category-tab ${filterCat === cat.id ? 'active' : ''}`} onClick={() => setFilterCat(cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Summary card */}
        <div className="stat-card negative" style={{ marginBottom: 20, maxWidth: 300 }}>
          <div className="stat-label">Total Expenses — {formatDate(new Date(selectedDate))}</div>
          <div className="stat-value">{formatCurrency(totalForDay)}</div>
          <div className="stat-sub">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Expense table */}
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date/Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5"><div className="empty-state"><p>No expenses for this date</p></div></td></tr>
              ) : (
                filtered.map(exp => (
                  <tr key={exp.id}>
                    <td><span className="badge badge-warning">{getCategoryName(exp.categoryId)}</span></td>
                    <td>{exp.description || '—'}</td>
                    <td><strong style={{ color: 'var(--color-danger)' }}>{formatCurrency(exp.amount)}</strong></td>
                    <td style={{ fontSize: '0.8rem' }}>{formatDateTime(exp.createdAt)}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteExpense(exp.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Expense"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveExpense}>Add Expense</button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" min="0" placeholder="500" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={expDate} onChange={e => setExpDate(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select className="form-select" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
            <option value="">Select category</option>
            {expenseCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="e.g. Purchased vegetables from wholesale market"
            value={expDescription}
            onChange={e => setExpDescription(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
