import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ConfirmModal, Modal } from '../components/Modal';
import api from '../lib/api';
import { attachRealtimeRefresh } from '../lib/realtime';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const initialInventoryForm = { itemName: '', costPrice: '', quantity: 1 };

export const Inventory = () => {
  const containerRef = useRef(null);
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [addForm, setAddForm] = useState(initialInventoryForm);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setInventory(res || []);
    } catch {
      addToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => attachRealtimeRefresh(fetchInventory, ['inventory_items', 'accounts', 'account_inventory_items']), []);

  const handleAddOnChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateInventoryForm = (form) => {
    if (!form.itemName.trim() || !String(form.costPrice).trim() || !String(form.quantity).trim()) {
      addToast('Please fill all the fields.', 'info');
      return false;
    }
    return true;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateInventoryForm(addForm)) return;

    try {
      await api.post('/inventory', {
        itemName: addForm.itemName,
        costPrice: parseFloat(addForm.costPrice) || 0,
        quantity: parseInt(addForm.quantity, 10) || 1,
      });
      addToast('Inventory item added successfully', 'success');
      setAddForm(initialInventoryForm);
      await fetchInventory();
    } catch (error) {
      addToast(error.message || 'Failed to add inventory item', 'error');
    }
  };

  const handleEditClick = (item) => {
    setEditForm({
      id: item.id,
      itemName: item.itemName,
      costPrice: item.costPrice,
      quantity: item.quantity,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateInventoryForm(editForm)) return;

    try {
      await api.put(`/inventory/${editForm.id}`, {
        itemName: editForm.itemName,
        costPrice: parseFloat(editForm.costPrice) || 0,
        quantity: parseInt(editForm.quantity, 10) || 0,
      });
      addToast('Inventory item updated successfully', 'success');
      setEditModalOpen(false);
      await fetchInventory();
    } catch (error) {
      addToast(error.message || 'Failed to update inventory', 'error');
    }
  };

  const attemptDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/inventory/${itemToDelete.id}`);
      addToast('Inventory item deleted successfully', 'success');
      await fetchInventory();
    } catch (error) {
      addToast(error.message || 'Failed to delete inventory item', 'error');
      throw error;
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

  useGSAP(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo('.card', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
    }
  }, [loading, inventory]);

  return (
    <div className="section-container" ref={containerRef}>
      <div className="card mb-6">
        <div className="card-header">
          <h3>Add Inventory Item</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleAdd} className="inventory-form-grid">
            <div>
              <label className="form-label">Item Name</label>
              <input type="text" className="input-field" name="itemName" value={addForm.itemName} onChange={handleAddOnChange} placeholder="e.g. iPhone 14" required />
            </div>
            <div>
              <label className="form-label">Cost Price</label>
              <input type="number" className="input-field" name="costPrice" min="0" value={addForm.costPrice} onChange={handleAddOnChange} required />
            </div>
            <div>
              <label className="form-label">Quantity</label>
              <input type="number" className="input-field" name="quantity" min="1" value={addForm.quantity} onChange={handleAddOnChange} required />
            </div>
            <div className="full-span flex justify-center mt-4">
              <button type="submit" className="btn btn-primary" style={{ minWidth: '180px' }}>
                <Plus size={18} /> Add Item
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Current Inventory</h3>
          <span className="badge badge-primary">{inventory.length}</span>
        </div>
        <div className="card-body p-0">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Cost Price</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center">Loading...</td></tr>
                ) : inventory.length === 0 ? (
                  <tr><td colSpan="4" className="text-center">Inventory is empty.</td></tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id}>
                      <td className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-primary" />
                          {item.itemName}
                        </div>
                      </td>
                      <td className="font-medium text-secondary">{formatCurrency(item.costPrice)}</td>
                      <td><span className={`badge ${item.quantity > 5 ? 'badge-success' : 'badge-danger'}`}>{item.quantity}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="flex items-center justify-center gap-2">
                          <button className="btn-icon btn-ghost" onClick={() => handleEditClick(item)} title="Edit"><Edit size={16} /></button>
                          <button className="btn-icon btn-ghost text-danger" onClick={() => attemptDelete(item)} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Inventory Item" maxWidth="500px">
        {editForm && (
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label className="form-label">Item Name</label>
              <input type="text" className="input-field" value={editForm.itemName} onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="form-label">Cost Price</label>
              <input type="number" className="input-field" min="0" value={editForm.costPrice} onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })} required />
            </div>
            <div className="mb-6">
              <label className="form-label">Quantity</label>
              <input type="number" className="input-field" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} required />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Item" message={`Are you sure you want to delete ${itemToDelete?.itemName}? This action cannot be undone.`} confirmText="Delete" confirmDanger={true} />
    </div>
  );
};
