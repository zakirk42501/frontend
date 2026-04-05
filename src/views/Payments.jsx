import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, WalletCards } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { SearchableSelect } from '../components/SearchableSelect';
import api from '../lib/api';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const Payments = () => {
  const containerRef = useRef(null);
  const { addToast } = useToast();
  const [recoveryMen, setRecoveryMen] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    recoveryManId: '',
    accountId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRecoveryMen();
    fetchAccounts();
  }, []);

  const fetchRecoveryMen = async () => {
    try {
      const res = await api.get('/recovery-men');
      setRecoveryMen(res || []);
    } catch {
      addToast('Failed to load recovery men', 'error');
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res || []);
    } catch {
      addToast('Failed to load accounts', 'error');
    }
  };

  const filteredAccounts = useMemo(() => (
    form.recoveryManId ? accounts.filter((acc) => acc.recoveryManId === form.recoveryManId) : []
  ), [accounts, form.recoveryManId]);

  const handleOnChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'recoveryManId') {
        next.accountId = '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recoveryManId || !form.accountId || !form.amount || !form.paymentDate) {
      addToast('Please fill all required fields', 'info');
      return;
    }

    try {
      await api.post('/payments', {
        recoveryManId: form.recoveryManId,
        accountId: form.accountId,
        amount: parseFloat(form.amount),
        paymentDate: form.paymentDate,
      });
      addToast('Payment added successfully', 'success');
      setForm((prev) => ({ ...prev, accountId: '', amount: '' }));
      await fetchAccounts();
    } catch (error) {
      addToast(error.message || 'Failed to add payment', 'error');
    }
  };

  const rmOptions = recoveryMen.map((rm) => ({ label: rm.fullName, value: rm.id }));
  const accOptions = filteredAccounts.map((acc) => ({
    label: `${acc.accountNo} - ${acc.customerName}`,
    subLabel: `Item: ${acc.itemName} | Balance: ${acc.balanceAmount}`,
    value: acc.id,
  }));

  useGSAP(() => {
    if (containerRef.current) {
      gsap.fromTo('.card', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' });
    }
  }, []);

  return (
    <div className="section-container" style={{ maxWidth: '600px', margin: '0 auto' }} ref={containerRef}>
      <div className="card">
        <div className="card-header flex flex-col items-center py-6">
          <div className="bg-primary-bg p-4 rounded-full text-primary mb-4" style={{ borderRadius: '50%' }}>
            <WalletCards size={32} />
          </div>
          <h2 className="text-xl m-0">Add Payment</h2>
          <p className="text-muted text-sm mt-2">Record an installment payment against an account.</p>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">Recovery Man</label>
              <SearchableSelect options={rmOptions} value={form.recoveryManId} onChange={(val) => handleOnChange('recoveryManId', val)} placeholder="Search staff..." />
            </div>
            <div className="mb-4">
              <label className="form-label">Account</label>
              <SearchableSelect options={accOptions} value={form.accountId} onChange={(val) => handleOnChange('accountId', val)} placeholder={form.recoveryManId ? (filteredAccounts.length > 0 ? 'Search account...' : 'No accounts found for this staff') : 'Select recovery man first'} disabled={!form.recoveryManId || filteredAccounts.length === 0} />
            </div>
            <div className="mb-4">
              <label className="form-label">Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>Rs.</span>
                <input type="number" className="input-field" style={{ paddingLeft: '2rem' }} value={form.amount} onChange={(e) => handleOnChange('amount', e.target.value)} placeholder="0.00" min="0" required />
              </div>
            </div>
            <div className="mb-6">
              <label className="form-label">Date</label>
              <input type="date" className="input-field" value={form.paymentDate} onChange={(e) => handleOnChange('paymentDate', e.target.value)} required />
            </div>
            <div className="flex justify-center mt-6">
              <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '44px', fontSize: '1rem' }}>
                <Plus size={20} /> Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
