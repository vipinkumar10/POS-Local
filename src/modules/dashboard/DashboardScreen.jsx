import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag, Wallet, AlertTriangle, ArrowUpRight, Calendar } from 'lucide-react';
import db from '../../db/database';
import { formatCurrency, getStartOfDay, getEndOfDay, getDateRange, formatDate } from '../../shared/utils/helpers';

const PIE_COLORS = ['#e8590c', '#1971c2', '#2f9e44', '#e67700', '#9c36b5', '#0c8599'];

export default function DashboardScreen() {
  const today = new Date();
  const [fromDate, setFromDate] = useState(formatDate(today, 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(formatDate(today, 'yyyy-MM-dd'));

  const startDate = getStartOfDay(new Date(fromDate));
  const endDate = getEndOfDay(new Date(toDate));

  const filteredOrders = useLiveQuery(
    () => db.orders.where('orderDate').between(startDate, endDate).toArray(),
    [fromDate, toDate], []
  );

  const filteredExpenses = useLiveQuery(
    () => db.expenses.where('date').between(startDate, endDate).toArray(),
    [fromDate, toDate], []
  );

  const allOrders = useLiveQuery(() => db.orders.toArray(), [], []);
  const allOrderItems = useLiveQuery(() => db.orderItems.toArray(), [], []);
  const lowStockItems = useLiveQuery(
    () => db.inventoryItems.filter(item => item.currentStock <= item.minStockAlert).toArray(),
    [], []
  );

  const totalSales = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalSales - totalExpenses;
  const avgOrderValue = filteredOrders.length ? totalSales / filteredOrders.length : 0;

  // Payment mode breakdown
  const paymentData = filteredOrders.reduce((acc, o) => {
    const mode = o.paymentMode || 'Cash';
    acc[mode] = (acc[mode] || 0) + o.totalAmount;
    return acc;
  }, {});
  const pieData = Object.entries(paymentData).map(([name, value]) => ({ name, value }));

  // Top selling items (for selected range)
  const rangeOrderIds = filteredOrders.map(o => o.id);
  const itemSales = allOrderItems
    .filter(oi => rangeOrderIds.includes(oi.orderId))
    .reduce((acc, oi) => {
      acc[oi.menuItemName] = (acc[oi.menuItemName] || 0) + oi.quantity;
      return acc;
    }, {});

  const topItems = Object.entries(itemSales)
    .map(([name, qty]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, quantity: qty }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  // trend data logic based on range duration
  const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const trendData = [];
  if (diffDays <= 31) {
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dEnd = getEndOfDay(d);
      const daySales = allOrders
        .filter(o => o.orderDate >= d && o.orderDate <= dEnd)
        .reduce((s, o) => s + o.totalAmount, 0);
      trendData.push({ label: formatDate(d, 'dd MMM'), sales: daySales });
    }
  }

  return (
    <>
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Analytics Overview
          </p>
        </div>
        <div className="date-filter-group">
          <div className="date-input-wrapper">
            <Calendar size={14} />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <span>to</span>
          <div className="date-input-wrapper">
            <Calendar size={14} />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="dashboard-grid">
          {/* Stat Cards */}
          <div className="stat-card primary">
            <div className="stat-label"><ShoppingBag size={14} style={{ display: 'inline', marginRight: 4 }} />Total Sales</div>
            <div className="stat-value">{formatCurrency(totalSales)}</div>
            <div className="stat-sub">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</div>
          </div>

          <div className="stat-card negative">
            <div className="stat-label"><Wallet size={14} style={{ display: 'inline', marginRight: 4 }} />Total Expenses</div>
            <div className="stat-value">{formatCurrency(totalExpenses)}</div>
            <div className="stat-sub">{filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}</div>
          </div>

          <div className={`stat-card ${netProfit >= 0 ? 'positive' : 'negative'}`}>
            <div className="stat-label">
              {netProfit >= 0 ? <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} /> : <TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />}
              Net Profit/Loss
            </div>
            <div className="stat-value">{formatCurrency(netProfit)}</div>
            <div className="stat-sub">{netProfit >= 0 ? 'Profit' : 'Loss'} for period</div>
          </div>

          <div className="stat-card info">
            <div className="stat-label"><ArrowUpRight size={14} style={{ display: 'inline', marginRight: 4 }} />Avg. Order Value</div>
            <div className="stat-value">{formatCurrency(avgOrderValue)}</div>
            <div className="stat-sub">Range average</div>
          </div>

          {/* Weekly Sales Trend */}
          <div className="chart-card span-2">
            <h3>📈 Weekly Sales Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light)" />
                <XAxis dataKey="label" fontSize={12} tick={{ fill: 'var(--text-tertiary)' }} />
                <YAxis fontSize={12} tick={{ fill: 'var(--text-tertiary)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }}
                  formatter={(v) => [formatCurrency(v), 'Sales']}
                />
                <Line type="monotone" dataKey="sales" stroke="#e8590c" strokeWidth={2.5} dot={{ fill: '#e8590c', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Selling Items */}
          <div className="chart-card span-2">
            <h3>🏆 Top Selling Items</h3>
            {topItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>No sales data yet. Start taking orders!</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light)" />
                  <XAxis type="number" fontSize={12} tick={{ fill: 'var(--text-tertiary)' }} />
                  <YAxis dataKey="name" type="category" width={110} fontSize={11} tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13 }}
                  />
                  <Bar dataKey="quantity" fill="#e8590c" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="chart-card span-2">
            <h3>💳 Payment Modes (Today)</h3>
            {pieData.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>No orders today yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="value" paddingAngle={4}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="chart-card span-2">
            <h3><AlertTriangle size={16} style={{ display: 'inline', marginRight: 4, color: 'var(--color-warning)' }} />Low Stock Alerts</h3>
            {lowStockItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>All stock levels are healthy! 🎉</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div className="alert-item" key={item.id}>
                  <div>
                    <div className="alert-name">{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Min: {item.minStockAlert} {item.unit}</div>
                  </div>
                  <div className="alert-stock">
                    {item.currentStock} {item.unit}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
