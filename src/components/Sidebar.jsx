import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  WalletCards, 
  Package, 
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  X
} from 'lucide-react';
import ledgerLogo from '../assets/ledger.png';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Overview', icon: <LayoutDashboard size={20} />, kicker: 'Dashboard' },
  { path: '/recovery-men', label: 'Recovery Men', icon: <Users size={20} />, kicker: 'Staff' },
  { path: '/accounts', label: 'Accounts', icon: <WalletCards size={20} />, kicker: 'Customers' },
  { path: '/payments', label: 'Payments', icon: <TrendingDown size={20} />, kicker: 'Transactions' },
  { path: '/inventory', label: 'Inventory', icon: <Package size={20} />, kicker: 'Stock' },
];

export const Sidebar = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {

  const overlayClass = isOpen ? 'sidebar-overlay active' : 'sidebar-overlay';
  const sidebarClass = `sidebar ${isOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`;

  return (
    <>
      {/* Mobile overlay */}
      <div className={overlayClass} onClick={() => setIsOpen(false)} />

      <aside className={sidebarClass}>
        <div className="sidebar-header">
          {!isCollapsed ? (
            <div className="sidebar-brand">
              <div className="brand-logo">
                <img src={ledgerLogo} alt="Logo" />
              </div>
              <div className="brand-text">
                <h2>Shah Ledger</h2>
                <span>Management</span>
              </div>
            </div>
          ) : (
            <div className="sidebar-brand collapsed">
              <div className="brand-logo">
                <img src={ledgerLogo} alt="Logo" />
              </div>
            </div>
          )}

          {/* Mobile close button */}
          <button className="mobile-close btn-icon" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="nav-text">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-kicker">{item.kicker}</span>
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="copyright">
              © All Rights Reserved<br />By Rk-Tiger
            </div>
          )}
          {/* Desktop collapse toggle */}
          <button className="collapse-toggle btn-icon" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
};
