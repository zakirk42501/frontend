import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, ChevronUp, Plus, Search, Info, Edit, Trash2, Phone, MapPin, Hash, Package, User, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ConfirmModal, Modal } from '../components/Modal';
import { SearchableSelect } from '../components/SearchableSelect';
import api from '../lib/api';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './Accounts.css';

const initialInventoryQuickForm = { itemName: '', costPrice: '', quantity: 1 };

export const Accounts = () => {
  const containerRef = useRef(null);
  const accountNoRef = useRef(null);
  const customerNameRef = useRef(null);
  const customerNumberRef = useRef(null);
  const recoveryFieldRef = useRef(null);
  const inventoryFieldRef = useRef(null);
  const totalAmountRef = useRef(null);
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [recoveryMen, setRecoveryMen] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRmId, setFilterRmId] = useState('');
  const [expandedAccId, setExpandedAccId] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loadingInst, setLoadingInst] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteAccModalOpen, setDeleteAccModalOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [editInstModalOpen, setEditInstModalOpen] = useState(false);
  const [deleteInstModalOpen, setDeleteInstModalOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState(null);
  const [inventoryQuickModalOpen, setInventoryQuickModalOpen] = useState(false);
  const [inventoryQuickForm, setInventoryQuickForm] = useState(initialInventoryQuickForm);
  const [fieldErrors, setFieldErrors] = useState({ recoveryManId: '', selectedItems: '', customerNumber: '' });

  const initAccForm = {
    accountNo: '',
    customerName: '',
    customerNumber: '',
    customerAddress: '',
    totalAmount: '',
    recoveryManId: '',
    startDate: new Date().toISOString().split('T')[0],
    selectedItems: [],
  };

  const [accForm, setAccForm] = useState(initAccForm);
  const [editInstForm, setEditInstForm] = useState({ amount: '', installmentDate: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, rmRes, invRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/recovery-men'),
        api.get('/inventory'),
      ]);
      setAccounts(accRes || []);
      setRecoveryMen(rmRes || []);
      setInventory(invRes || []);
    } catch {
      addToast('Failed to load accounts data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadInstallments = async (accId) => {
    try {
      setLoadingInst(true);
      const res = await api.get(`/installments/${accId}`);
      setInstallments(res || []);
    } catch {
      addToast('Failed to load installments', 'error');
    } finally {
      setLoadingInst(false);
    }
  };

  const toggleExpand = (accId) => {
    if (expandedAccId === accId) {
      setExpandedAccId(null);
      setInstallments([]);
      return;
    }
    setExpandedAccId(accId);
    loadInstallments(accId);
  };

  const focusFieldRef = (ref) => {
    const node = ref?.current;
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = node.matches?.('input, textarea, button, [tabindex]') ? node : node.querySelector?.('input, textarea, button, [tabindex]');
    focusable?.focus?.();
  };

  const handleAccFormChange = (field, value) => {
    if (field === 'customerNumber') {
      const digitsOnly = String(value).replace(/\D/g, '').slice(0, 11);
      setAccForm((prev) => ({ ...prev, customerNumber: digitsOnly }));
      setFieldErrors((prev) => ({
        ...prev,
        customerNumber: digitsOnly.length === 0 || digitsOnly.length === 11 ? '' : 'Customer number must be 11 digits.',
      }));
      return;
    }

    setAccForm((prev) => ({ ...prev, [field]: value }));

    if (field === 'recoveryManId') {
      setFieldErrors((prev) => ({ ...prev, recoveryManId: value ? '' : prev.recoveryManId }));
    }
  };

  const openWarning = (message) => {
    setWarningMessage(message);
    setWarningModalOpen(true);
  };

  const updateSelectedItemQuantity = (inventoryItemId, nextQuantity) => {
    const inventoryItem = inventory.find((entry) => entry.id === inventoryItemId);
    if (!inventoryItem) return;

    const safeQuantity = Math.max(0, Math.min(nextQuantity, inventoryItem.quantity));
    setAccForm((prev) => {
      const existing = prev.selectedItems.find((entry) => entry.inventoryItemId === inventoryItemId);
      if (safeQuantity === 0) {
        return {
          ...prev,
          selectedItems: prev.selectedItems.filter((entry) => entry.inventoryItemId !== inventoryItemId),
        };
      }

      if (existing) {
        return {
          ...prev,
          selectedItems: prev.selectedItems.map((entry) =>
            entry.inventoryItemId === inventoryItemId ? { ...entry, quantity: safeQuantity } : entry,
          ),
        };
      }

      return {
        ...prev,
        selectedItems: [
          ...prev.selectedItems,
          {
            inventoryItemId: inventoryItem.id,
            itemName: inventoryItem.itemName,
            costPrice: Number(inventoryItem.costPrice || 0),
            quantity: safeQuantity,
          },
        ],
      };
    });
    setFieldErrors((prev) => ({ ...prev, selectedItems: '' }));
  };

  const removeSelectedItem = (inventoryItemId) => {
    updateSelectedItemQuantity(inventoryItemId, 0);
  };

  const handleInventoryOptionCommit = (inventoryItemId, currentQty, close) => {
    if (currentQty === 0) {
      updateSelectedItemQuantity(inventoryItemId, 1);
    }
    close?.();
    setTimeout(() => {
      focusFieldRef(totalAmountRef);
    }, 40);
  };

  const validateAccountForm = () => {
    const nextErrors = { recoveryManId: '', selectedItems: '', customerNumber: '' };

    if (!accForm.accountNo.trim()) {
      openWarning('Please fill all the fields.');
      focusFieldRef(accountNoRef);
      return false;
    }

    if (!accForm.customerName.trim()) {
      openWarning('Please fill all the fields.');
      focusFieldRef(customerNameRef);
      return false;
    }

    if (!String(accForm.totalAmount).trim()) {
      openWarning('Please fill all the fields.');
      focusFieldRef(totalAmountRef);
      return false;
    }

    if (accForm.customerNumber && accForm.customerNumber.length !== 11) {
      nextErrors.customerNumber = 'Customer number must be 11 digits.';
      setFieldErrors(nextErrors);
      focusFieldRef(customerNumberRef);
      return false;
    }

    if (!accForm.recoveryManId) {
      nextErrors.recoveryManId = 'Please select recovery man.';
      setFieldErrors(nextErrors);
      focusFieldRef(recoveryFieldRef);
      return false;
    }

    if (!accForm.selectedItems.length) {
      nextErrors.selectedItems = 'Please select item.';
      setFieldErrors(nextErrors);
      focusFieldRef(inventoryFieldRef);
      return false;
    }

    setFieldErrors(nextErrors);
    return true;
  };

  const validateInventoryQuickForm = () => {
    if (!inventoryQuickForm.itemName.trim() || !String(inventoryQuickForm.costPrice).trim() || !String(inventoryQuickForm.quantity).trim()) {
      addToast('Please fill all the fields.', 'info');
      return false;
    }
    return true;
  };

  const handleAccountError = (error) => {
    openWarning(error.message || 'Failed to save account');
  };

  const buildAccountPayload = () => ({
    accountNo: accForm.accountNo,
    customerName: accForm.customerName,
    customerNumber: accForm.customerNumber,
    customerAddress: accForm.customerAddress,
    totalAmount: parseFloat(accForm.totalAmount),
    recoveryManId: accForm.recoveryManId,
    startDate: accForm.startDate,
    selectedItems: accForm.selectedItems.map((item) => ({
      inventoryItemId: item.inventoryItemId,
      quantity: Number(item.quantity),
    })),
  });

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!validateAccountForm()) return;

    try {
      await api.post('/accounts', buildAccountPayload());
      addToast('Account created successfully', 'success');
      setCreateModalOpen(false);
      setAccForm(initAccForm);
      setFieldErrors({ recoveryManId: '', selectedItems: '', customerNumber: '' });
      await fetchData();
    } catch (error) {
      handleAccountError(error);
    }
  };

  const handleQuickInventorySubmit = async (e) => {
    e.preventDefault();
    if (!validateInventoryQuickForm()) return;

    try {
      await api.post('/inventory', {
        itemName: inventoryQuickForm.itemName,
        costPrice: parseFloat(inventoryQuickForm.costPrice) || 0,
        quantity: parseInt(inventoryQuickForm.quantity, 10) || 1,
      });
      addToast('Inventory item added successfully', 'success');
      setInventoryQuickModalOpen(false);
      setInventoryQuickForm(initialInventoryQuickForm);
      await fetchData();
    } catch (error) {
      addToast(error.message || 'Failed to add inventory item', 'error');
    }
  };

  const handleEditAccountSubmit = async (e) => {
    e.preventDefault();
    if (!validateAccountForm()) return;

    try {
      await api.put(`/accounts/${selectedAcc.id}`, buildAccountPayload());
      addToast('Account updated successfully', 'success');
      setEditModalOpen(false);
      await fetchData();
      if (expandedAccId === selectedAcc.id) {
        await loadInstallments(selectedAcc.id);
      }
    } catch (error) {
      handleAccountError(error);
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      await api.delete(`/accounts/${selectedAcc.id}`);
      addToast('Account deleted successfully', 'success');
      if (expandedAccId === selectedAcc.id) {
        setExpandedAccId(null);
        setInstallments([]);
      }
      await fetchData();
    } catch (error) {
      addToast(error.message || 'Failed to delete account', 'error');
      throw error;
    }
  };

  const handleEditInstSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/installments/${selectedInst.id}`, {
        amount: parseFloat(editInstForm.amount),
        installmentDate: editInstForm.installmentDate,
      });
      addToast('Installment updated successfully', 'success');
      setEditInstModalOpen(false);
      await loadInstallments(expandedAccId);
      await fetchData();
    } catch (error) {
      addToast(error.message || 'Failed to update installment', 'error');
    }
  };

  const confirmDeleteInst = async () => {
    try {
      await api.delete(`/installments/${selectedInst.id}`);
      addToast('Installment deleted', 'success');
      await loadInstallments(expandedAccId);
      await fetchData();
    } catch (error) {
      addToast(error.message || 'Failed to delete installment', 'error');
      throw error;
    }
  };

  const filteredAccounts = useMemo(() => accounts.filter((acc) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      String(acc.accountNo || '').toLowerCase().includes(term) ||
      String(acc.customerName || '').toLowerCase().includes(term) ||
      String(acc.customerNumber || '').toLowerCase().includes(term);
    const matchesRm = filterRmId ? acc.recoveryManId === filterRmId : true;
    return matchesSearch && matchesRm;
  }), [accounts, searchTerm, filterRmId]);

  const rmOptions = recoveryMen.map((rm) => ({ label: rm.fullName, value: rm.id }));
  const formatCurrency = (amt) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amt || 0);
  const invOptions = inventory.map((inv) => ({
    label: inv.itemName,
    subLabel: `Cost: ${formatCurrency(inv.costPrice)} | Available: ${inv.quantity}`,
    value: inv.id,
  }));

  const openEditModal = (acc, e) => {
    e?.stopPropagation();
    setSelectedAcc(acc);
    setAccForm({
      accountNo: acc.accountNo,
      customerName: acc.customerName,
      customerNumber: acc.customerNumber || '',
      customerAddress: acc.customerAddress || '',
      totalAmount: acc.totalAmount,
      recoveryManId: acc.recoveryManId,
      startDate: acc.startDate ? String(acc.startDate).split('T')[0] : '',
      selectedItems: (acc.selectedItems || []).map((item) => ({
        inventoryItemId: item.inventoryItemId,
        itemName: item.itemName,
        costPrice: Number(item.costPrice || 0),
        quantity: Number(item.quantity),
      })),
    });
    setFieldErrors({ recoveryManId: '', selectedItems: '', customerNumber: '' });
    setEditModalOpen(true);
  };

  const openInfoModal = (acc, e) => {
    e?.stopPropagation();
    setSelectedAcc(acc);
    setInfoModalOpen(true);
  };

  const openDeleteModal = (acc, e) => {
    e?.stopPropagation();
    setSelectedAcc(acc);
    setDeleteAccModalOpen(true);
  };

  useGSAP(() => {
    if (!loading && containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.account-card');
      if (cards.length > 0) {
        gsap.fromTo(cards, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'power2.out' });
      }
    }
  }, [loading, filteredAccounts]);

  return (
    <div className="accounts-layout" ref={containerRef}>
      <div className="accounts-toolbar mb-6">
        <div className="accounts-filters">
          <div className="input-group search-input-group">
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="Search by name, account no, phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="filter-select-group">
            <SearchableSelect options={rmOptions} value={filterRmId} onChange={setFilterRmId} placeholder="Filter by staff" />
          </div>
        </div>
        <button className="btn btn-primary new-acc-btn" onClick={() => { setAccForm(initAccForm); setFieldErrors({ recoveryManId: '', selectedItems: '', customerNumber: '' }); setCreateModalOpen(true); }}>
          <Plus size={18} /> New Account
        </button>
      </div>

      <div>
        {loading ? (
          <div className="p-4 text-center">Loading accounts...</div>
        ) : filteredAccounts.length === 0 ? (
          <div className="card p-6 text-center text-muted">No accounts found.</div>
        ) : (
          filteredAccounts.map((acc) => (
            <div key={acc.id} className="account-card">
              <div className="account-summary" onClick={() => toggleExpand(acc.id)}>
                <div className="acc-info-main">
                  <div className="acc-avatar">{acc.customerName?.charAt(0)?.toUpperCase() || 'A'}</div>
                  <div className="acc-details">
                    <h4>{acc.customerName}</h4>
                    <div className="acc-tags">
                      <span className="acc-tag"><Hash size={12} /> {acc.accountNo}</span>
                      <span className="acc-tag"><Package size={12} /> {acc.itemName}</span>
                      <span className="acc-tag"><User size={12} /> {acc.recoveryManName || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="acc-financials">
                  <span className="acc-balance">{formatCurrency(acc.balanceAmount)}</span>
                  <span className="acc-total">Total: {formatCurrency(acc.totalAmount)}</span>
                </div>

                <div className="acc-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon btn-ghost" onClick={(e) => openInfoModal(acc, e)} title="Info"><Info size={16} /></button>
                  <button className="btn-icon btn-ghost" onClick={(e) => openEditModal(acc, e)} title="Edit"><Edit size={16} /></button>
                  <button className="btn-icon btn-ghost text-danger" onClick={(e) => openDeleteModal(acc, e)} title="Delete"><Trash2 size={16} /></button>
                  <button className="btn-icon btn-ghost" onClick={() => toggleExpand(acc.id)}>
                    {expandedAccId === acc.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {expandedAccId === acc.id && (
                <div className="account-details-panel">
                  <h5 className="mb-2">Installment History</h5>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingInst ? (
                        <tr><td colSpan="4" className="text-center">Loading...</td></tr>
                      ) : installments.length === 0 ? (
                        <tr><td colSpan="4" className="text-center text-muted">No installments yet.</td></tr>
                      ) : (
                        installments.map((inst) => (
                          <tr key={inst.id}>
                            <td className="font-medium">{inst.installmentNo}</td>
                            <td className="font-medium">{inst.installmentDate ? String(inst.installmentDate).split('T')[0] : '-'}</td>
                            <td className="font-semibold text-primary">{formatCurrency(inst.amount)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="flex items-center justify-center gap-2">
                                <button className="btn-icon btn-ghost p-1" onClick={() => { setSelectedInst(inst); setEditInstForm({ amount: inst.amount, installmentDate: inst.installmentDate?.split('T')[0] || '' }); setEditInstModalOpen(true); }}><Edit size={14} /></button>
                                <button className="btn-icon btn-ghost p-1 text-danger" onClick={() => { setSelectedInst(inst); setDeleteInstModalOpen(true); }}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={(createModalOpen || editModalOpen) && !inventoryQuickModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditModalOpen(false); }}
        closeOnOverlay={false}
        title={createModalOpen ? 'Create Account' : 'Edit Account'}
        maxWidth="760px"
        headerActions={
          <button type="button" className="btn btn-secondary" onClick={() => { setInventoryQuickForm(initialInventoryQuickForm); setInventoryQuickModalOpen(true); }}>
            <Plus size={16} /> Add Inventory
          </button>
        }
      >
        <form onSubmit={createModalOpen ? handleCreateAccount : handleEditAccountSubmit}>
          <div className="account-form-grid">
            <div>
              <label className="form-label">Account No.</label>
              <input ref={accountNoRef} type="text" className="input-field" value={accForm.accountNo} onChange={(e) => handleAccFormChange('accountNo', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="input-field" value={accForm.startDate} onChange={(e) => handleAccFormChange('startDate', e.target.value)} required />
            </div>
            <div className="full-span">
              <label className="form-label">Customer Name</label>
              <input ref={customerNameRef} type="text" className="input-field" value={accForm.customerName} onChange={(e) => handleAccFormChange('customerName', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Customer Number (Optional)</label>
              <input ref={customerNumberRef} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={11} className={`input-field ${fieldErrors.customerNumber ? 'input-error' : ''}`} value={accForm.customerNumber} onChange={(e) => handleAccFormChange('customerNumber', e.target.value)} />
              {fieldErrors.customerNumber ? <small className="field-error">{fieldErrors.customerNumber}</small> : <small className="field-helper">Optional, 11 digits if provided</small>}
            </div>
            <div ref={recoveryFieldRef}>
              <label className="form-label">Recovery Man</label>
              <SearchableSelect options={rmOptions} value={accForm.recoveryManId} onChange={(v) => handleAccFormChange('recoveryManId', v)} placeholder="Search recovery man..." error={Boolean(fieldErrors.recoveryManId)} />
              {fieldErrors.recoveryManId ? <small className="field-error">{fieldErrors.recoveryManId}</small> : null}
            </div>
            <div className="full-span">
              <label className="form-label">Customer Address (Optional)</label>
              <textarea className="input-field" rows="2" value={accForm.customerAddress} onChange={(e) => handleAccFormChange('customerAddress', e.target.value)} />
            </div>
            <div ref={inventoryFieldRef} className="full-span">
              <label className="form-label">Inventory Item</label>
              <SearchableSelect
                options={invOptions}
                value=""
                onChange={() => {}}
                placeholder="Search inventory..."
                error={Boolean(fieldErrors.selectedItems)}
                clearable={false}
                renderOption={(opt, helpers) => {
                  const selectedEntry = accForm.selectedItems.find((entry) => entry.inventoryItemId === opt.value);
                  const currentQty = selectedEntry?.quantity || 0;
                  const maxQty = inventory.find((entry) => entry.id === opt.value)?.quantity || 0;

                  return (
                    <div className="inventory-option-row" onClick={() => handleInventoryOptionCommit(opt.value, currentQty, helpers.close)}>
                      <div className="inventory-option-copy">
                        <div className="opt-label">{opt.label}</div>
                        {opt.subLabel ? <div className="opt-sublabel">{opt.subLabel}</div> : null}
                      </div>
                      <div className="qty-stepper" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => updateSelectedItemQuantity(opt.value, currentQty - 1)} disabled={currentQty === 0}>-</button>
                        <span>{currentQty}</span>
                        <button type="button" onClick={() => updateSelectedItemQuantity(opt.value, currentQty + 1)} disabled={currentQty >= maxQty}>+</button>
                      </div>
                    </div>
                  );
                }}
              />
              {fieldErrors.selectedItems ? <small className="field-error">{fieldErrors.selectedItems}</small> : null}
            </div>
            <div className="full-span selected-items-block">
              <label className="form-label">Selected Items</label>
              {accForm.selectedItems.length === 0 ? (
                <div className="selected-items-empty">No inventory item selected yet.</div>
              ) : (
                <div className="selected-items-list">
                  {accForm.selectedItems.map((item) => (
                    <div key={item.inventoryItemId} className="selected-item-chip">
                      <div>
                        <strong>{item.itemName}</strong>
                        <span>Qty: {item.quantity} | Cost: {formatCurrency(item.costPrice)}</span>
                      </div>
                      <button type="button" className="btn-icon btn-ghost text-danger" onClick={() => removeSelectedItem(item.inventoryItemId)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="form-label">Total Sell Price</label>
              <input ref={totalAmountRef} type="number" min="0" className="input-field" value={accForm.totalAmount} onChange={(e) => handleAccFormChange('totalAmount', e.target.value)} required />
            </div>
          </div>
          <div className="modal-actions mt-6">
            <button type="button" className="btn btn-ghost" onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">{createModalOpen ? 'Create Account' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={inventoryQuickModalOpen}
        onClose={() => setInventoryQuickModalOpen(false)}
        closeOnOverlay={false}
        title="Add Inventory Item"
        maxWidth="520px"
      >
        <form onSubmit={handleQuickInventorySubmit}>
          <div className="inventory-form-grid">
            <div>
              <label className="form-label">Item Name</label>
              <input type="text" className="input-field" value={inventoryQuickForm.itemName} onChange={(e) => setInventoryQuickForm((prev) => ({ ...prev, itemName: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Cost Price</label>
              <input type="number" min="0" className="input-field" value={inventoryQuickForm.costPrice} onChange={(e) => setInventoryQuickForm((prev) => ({ ...prev, costPrice: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Quantity</label>
              <input type="number" min="1" className="input-field" value={inventoryQuickForm.quantity} onChange={(e) => setInventoryQuickForm((prev) => ({ ...prev, quantity: e.target.value }))} required />
            </div>
          </div>
          <div className="modal-actions mt-6">
            <button type="submit" className="btn btn-primary">Add Inventory</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="Customer Information" maxWidth="450px">
        {selectedAcc && (
          <div className="flex flex-col gap-4 text-sm mt-2">
            <div className="flex items-center gap-3 p-3 bg-element rounded-lg" style={{ backgroundColor: 'var(--bg-element)' }}>
              <User size={20} className="text-muted" />
              <div>
                <p className="font-semibold text-primary mb-0">{selectedAcc.customerName}</p>
                <p className="text-muted mb-0">Acc: {selectedAcc.accountNo}</p>
              </div>
            </div>
            <div className="flex gap-2 items-start"><Phone size={16} className="text-muted mt-1" /> <span>{selectedAcc.customerNumber || 'N/A'}</span></div>
            <div className="flex gap-2 items-start"><MapPin size={16} className="text-muted mt-1" /> <span>{selectedAcc.customerAddress || 'N/A'}</span></div>
            <div className="flex gap-2 items-start"><Package size={16} className="text-muted mt-1" /> <span>{selectedAcc.itemName || 'N/A'}</span></div>
            <div className="flex gap-2 items-start"><User size={16} className="text-muted mt-1" /> <span>Recovery: {selectedAcc.recoveryManName || 'N/A'}</span></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={editInstModalOpen} onClose={() => setEditInstModalOpen(false)} title="Edit Installment" maxWidth="400px">
        <form onSubmit={handleEditInstSubmit}>
          <div className="mb-4">
            <label className="form-label">Amount</label>
            <input type="number" className="input-field" value={editInstForm.amount} onChange={(e) => setEditInstForm({ ...editInstForm, amount: e.target.value })} required />
          </div>
          <div className="mb-4">
            <label className="form-label">Date</label>
            <input type="date" className="input-field" value={editInstForm.installmentDate} onChange={(e) => setEditInstForm({ ...editInstForm, installmentDate: e.target.value })} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditInstModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={warningModalOpen} onClose={() => setWarningModalOpen(false)} title="Warning" maxWidth="420px">
        <div className="flex flex-col gap-4 py-2">
          <p className="text-secondary">{warningMessage}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => setWarningModalOpen(false)}>OK</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={deleteAccModalOpen} onClose={() => setDeleteAccModalOpen(false)} onConfirm={confirmDeleteAccount} title="Delete Account" message={`Are you sure you want to delete ${selectedAcc?.customerName}'s account? This will also remove all installments and restore inventory if applicable.`} confirmText="Delete" confirmDanger={true} />
      <ConfirmModal isOpen={deleteInstModalOpen} onClose={() => setDeleteInstModalOpen(false)} onConfirm={confirmDeleteInst} title="Delete Installment" message="Are you sure you want to delete this installment? The account balance will be recalculated." confirmText="Delete" confirmDanger={true} />
    </div>
  );
};
