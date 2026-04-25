import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag, Wallet, AlertTriangle, ArrowUpRight, } from 'lucide-react';
import db from '../../db/database';
import { formatCurrency, getStartOfDay, getEndOfDay, getDateRange, formatDate } from '../../shared/utils/helpers';

const PIE_COLORS = ['#e8590c', '#1971c2', '#2f9e44', '#e67700', '#9c36b5', '#0c8599'];

export default function DashboardScreen() {
  const today = new Date();
  const startOfToday = getStartOfDay(today);
  const endOfToday = getEndOfDay(today);

  const todayOrders = useLiveQuery(
    () => db.orders.where('orderDate').between(startOfToday, endOfToday).toArray(),
    [], []
  );

  const todayExpenses = useLiveQuery(
    () => db.expenses.where('date').between(startOfToday, endOfToday).toArray(),
    [], []
  );

  const allOrders = useLiveQuery(() => db.orders.toArray(), [], []);
  const allOrderItems = useLiveQuery(() => db.orderItems.toArray(), [], []);
  const lowStockItems = useLiveQuery(
    () => db.inventoryItems.filter(item => item.currentStock <= item.minStockAlert).toArray(),
    [], []
  );

  const totalSales = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalExpenses = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalSales - totalExpenses;
  const avgOrderValue = todayOrders.length ? totalSales / todayOrders.length : 0;

  // Payment mode breakdown
  const paymentData = todayOrders.reduce((acc, o) => {
    const mode = o.paymentMode || 'Cash';
    acc[mode] = (acc[mode] || 0) + o.totalAmount;
    return acc;
  }, {});
  const pieData = Object.entries(paymentData).map(([name, value]) => ({ name, value }));

  // Top selling items (all time)
  const itemSales = allOrderItems.reduce((acc, oi) => {
    acc[oi.menuItemName] = (acc[oi.menuItemName] || 0) + oi.quantity;
    return acc;
  }, {});
  const topItems = Object.entries(itemSales)
    .map(([name, qty]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, quantity: qty }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  // Weekly trend
  const weekDays = getDateRange(7);
  const trendData = weekDays.map(({ date, label }) => {
    const dayEnd = getEndOfDay(date);
    const daySales = allOrders
      .filter(o => o.orderDate >= date && o.orderDate <= dayEnd)
      .reduce((s, o) => s + o.totalAmount, 0);
    return { label, sales: daySales };
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {formatDate(today, 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
      </div>

      <div className="page-content">
        <div className="dashboard-grid">
          {/* Stat Cards */}
          <div className="stat-card primary">
            <div className="stat-label"><ShoppingBag size={14} style={{ display: 'inline', marginRight: 4 }} />Today's Sales</div>
            <div className="stat-value">{formatCurrency(totalSales)}</div>
            <div className="stat-sub">{todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''}</div>
          </div>

          <div className="stat-card negative">
            <div className="stat-label"><Wallet size={14} style={{ display: 'inline', marginRight: 4 }} />Today's Expenses</div>
            <div className="stat-value">{formatCurrency(totalExpenses)}</div>
            <div className="stat-sub">{todayExpenses.length} transaction{todayExpenses.length !== 1 ? 's' : ''}</div>
          </div>

          <div className={`stat-card ${netProfit >= 0 ? 'positive' : 'negative'}`}>
            <div className="stat-label">
              {netProfit >= 0 ? <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} /> : <TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />}
              Net Profit/Loss
            </div>
            <div className="stat-value">{formatCurrency(netProfit)}</div>
            <div className="stat-sub">{netProfit >= 0 ? 'Profit' : 'Loss'} today</div>
          </div>

          <div className="stat-card info">
            <div className="stat-label"><ArrowUpRight size={14} style={{ display: 'inline', marginRight: 4 }} />Avg. Order Value</div>
            <div className="stat-value">{formatCurrency(avgOrderValue)}</div>
            <div className="stat-sub">Per order average</div>
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
