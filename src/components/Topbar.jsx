import React, { useState, useEffect } from 'react';
import { Menu, Moon, Sun, RefreshCw, ShieldAlert } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ConfirmModal, Modal } from './Modal';
import api from '../lib/api';
import './Topbar.css';

const RESET_CODE = import.meta.env.VITE_RESET_DB_CODE || '';

export const Topbar = ({ onMenuClick }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetCodeModalOpen, setResetCodeModalOpen] = useState(false);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const location = useLocation();
  const { addToast } = useToast();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const getPageTitle = (path) => {
    if (path === '/') return 'Dashboard';
    if (path === '/recovery-men') return 'Recovery Men';
    if (path === '/accounts') return 'Accounts';
    if (path === '/payments') return 'Payments';
    if (path === '/inventory') return 'Inventory';
    return '';
  };

  const handleResetDb = async () => {
    if (!RESET_CODE) {
      addToast('Reset code is not configured in frontend env.', 'error');
      return;
    }

    if (!resetCodeInput.trim()) {
      addToast('Reset code is required.', 'info');
      return;
    }

    if (resetCodeInput.trim() !== RESET_CODE) {
      addToast('Reset code does not match.', 'error');
      return;
    }

    try {
      await api.post('/dev/reset', { resetCode: resetCodeInput.trim() });
      addToast('Database reset successfully. Schema is intact.', 'success');
      setResetCodeModalOpen(false);
      setResetCodeInput('');
      api.clearCache?.();
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (error) {
      addToast(error.message || 'Failed to reset database.', 'error');
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <button className="mobile-menu-btn btn-icon" onClick={onMenuClick}>
            <Menu size={24} />
          </button>

          <div className="topbar-title-wrap">
            <h1 className="page-title">{getPageTitle(location.pathname)}</h1>
            <span className="date-chip">{today}</span>
          </div>
        </div>

        <div className="topbar-right">
          <button
            className={`theme-toggle-switch ${theme === 'light' ? 'light-active' : 'dark-active'}`}
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            <div className="theme-toggle-thumb">
              {theme === 'dark' ? <Moon size={14} className="theme-icon moon-icon" /> : <Sun size={14} className="theme-icon sun-icon" />}
            </div>
            <Sun size={14} className="theme-icon-bg sun-bg" />
            <Moon size={14} className="theme-icon-bg moon-bg" />
          </button>

          <button className="reset-btn btn btn-danger" onClick={() => setResetModalOpen(true)}>
            <RefreshCw size={16} />
            <span className="hide-mobile">Reset DB</span>
          </button>
        </div>
      </header>

      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={async () => {
          setResetModalOpen(false);
          setResetCodeModalOpen(true);
        }}
        title="Reset Database"
        message="Are you sure you want to completely reset the database? This will clear all data but keep the schema."
        confirmText="Continue"
        confirmDanger={true}
      />

      <Modal isOpen={resetCodeModalOpen} onClose={() => setResetCodeModalOpen(false)} title="Enter Reset Code" maxWidth="420px">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-element" style={{ backgroundColor: 'var(--bg-element)' }}>
            <ShieldAlert size={20} className="text-danger" />
            <p className="text-secondary">Enter the reset code to confirm database reset.</p>
          </div>
          <div>
            <label className="form-label">Reset Code</label>
            <input
              type="password"
              className="input-field"
              value={resetCodeInput}
              onChange={(e) => setResetCodeInput(e.target.value)}
              placeholder="Enter reset code"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setResetCodeModalOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleResetDb}>Verify & Reset</button>
          </div>
        </div>
      </Modal>
    </>
  );
};
