import React from 'react';
import {
  Home,
  ShieldAlert,
  Factory,
  Store,
  UserCheck,
  Wrench,
  Search,
  BookOpen
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, roles }) => {
  const menuItems = [
    { id: 'landing', label: 'Overview', icon: Home, showAlways: true },
    { id: 'verify', label: 'Verify Warranty', icon: Search, showAlways: true },
    { id: 'admin', label: 'Admin Portal', icon: ShieldAlert, highlight: roles?.isAdmin },
    { id: 'manufacturer', label: 'Manufacturer Portal', icon: Factory, highlight: roles?.isManuf },
    { id: 'retailer', label: 'Retailer Portal', icon: Store, highlight: roles?.isRet },
    { id: 'customer', label: 'Customer Portal', icon: UserCheck, showAlways: true },
    { id: 'service', label: 'Service Center', icon: Wrench, highlight: roles?.isServ }
  ];

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">PORTAL NAVIGATION</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-link ${isActive ? 'active' : ''} ${
                item.highlight ? 'highlight-role' : ''
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.highlight && <span className="active-dot" title="Authorized Role"></span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-box">
          <div className="status-header">
            <BookOpen size={14} className="text-indigo-400" />
            <span>Sepolia Network</span>
          </div>
          <p className="status-text">Smart Contract Driven</p>
        </div>
      </div>
    </aside>
  );
};
