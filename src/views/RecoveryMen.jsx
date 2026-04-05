import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ConfirmModal, Modal } from '../components/Modal';
import { SearchableSelect } from '../components/SearchableSelect';
import api from '../lib/api';
import { attachRealtimeRefresh } from '../lib/realtime';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const RecoveryMen = () => {
  const containerRef = useRef(null);
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recoveryMen, setRecoveryMen] = useState([]);
  const [newManName, setNewManName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [manToDelete, setManToDelete] = useState(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignToId, setReassignToId] = useState('');
  const [reassignOptions, setReassignOptions] = useState([]);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const fetchRecoveryMen = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recovery-men');
      setRecoveryMen(res || []);
    } catch (err) {
      addToast('Failed to load recovery men', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecoveryMen();
  }, []);

  useEffect(() => attachRealtimeRefresh(fetchRecoveryMen, ['recovery_men']), []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newManName.trim()) {
      addToast('Name is required', 'info');
      return;
    }

    try {
      await api.post('/recovery-men', { fullName: newManName.trim() });
      addToast('Recovery man added successfully', 'success');
      setNewManName('');
      await fetchRecoveryMen();
    } catch (error) {
      setWarningMessage(error.message || 'Failed to add recovery man');
      setWarningModalOpen(true);
    }
  };

  const attemptDelete = (man) => {
    setManToDelete(man);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/recovery-men/${manToDelete.id}`);
      addToast('Recovery man deleted successfully', 'success');
      await fetchRecoveryMen();
    } catch (error) {
      if (error.status === 409 && error.data?.requiresReassignment) {
        setDeleteModalOpen(false);
        setReassignOptions((error.data.alternatives || []).map((m) => ({ label: m.fullName, value: m.id })));
        setReassignModalOpen(true);
        return;
      }

      setWarningMessage(error.message || 'Failed to delete recovery man');
      setWarningModalOpen(true);
      throw error;
    }
  };

  const handleReassignAndDelete = async () => {
    if (!reassignToId) {
      addToast('Please select a recovery man to reassign accounts to.', 'info');
      return;
    }

    try {
      await api.delete(`/recovery-men/${manToDelete.id}?reassignToId=${reassignToId}`);
      addToast('Recovery man deleted and accounts reassigned successfully', 'success');
      setReassignModalOpen(false);
      setReassignToId('');
      await fetchRecoveryMen();
    } catch (error) {
      addToast(error.message || 'Failed to delete and reassign', 'error');
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  useGSAP(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo('.card', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
    }
  }, [loading, recoveryMen]);

  return (
    <div className="section-container" ref={containerRef}>
      <div className="card mb-6">
        <div className="card-header">
          <h3>Add Recovery Man</h3>
        </div>
        <div className="card-body">
          <form className="add-inline-form" onSubmit={handleAdd}>
            <div className="input-group" style={{ flex: 1 }}>
              <input
                type="text"
                className="input-field"
                placeholder="Full Name"
                value={newManName}
                onChange={(e) => setNewManName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <Plus size={18} />
              Add
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Active Recovery Men</h3>
          <span className="badge badge-primary">{recoveryMen.length}</span>
        </div>
        <div className="card-body p-0">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="text-center">Loading...</td></tr>
                ) : recoveryMen.length === 0 ? (
                  <tr><td colSpan="3" className="text-center">No recovery men found.</td></tr>
                ) : (
                  recoveryMen.map((man) => (
                    <tr key={man.id}>
                      <td className="font-medium">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-muted" />
                          {man.fullName}
                        </div>
                      </td>
                      <td className="text-muted">{formatDateTime(man.createdAt)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-icon btn-ghost text-danger" onClick={() => attemptDelete(man)} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Recovery Man" message={`Are you sure you want to delete ${manToDelete?.fullName}?`} confirmText="Delete" confirmDanger={true} />

      <Modal isOpen={warningModalOpen} onClose={() => setWarningModalOpen(false)} title="Warning" maxWidth="400px">
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="text-danger"><Users size={48} /></div>
          <p className="text-secondary">{warningMessage}</p>
          <button className="btn btn-primary mt-4 w-full" onClick={() => setWarningModalOpen(false)}>Understood</button>
        </div>
      </Modal>

      <Modal isOpen={reassignModalOpen} onClose={() => setReassignModalOpen(false)} title="Reassign Accounts" maxWidth="450px">
        <div className="reassign-modal-body text-secondary">
          <p className="mb-4">
            <strong>{manToDelete?.fullName}</strong> has active accounts. Reassign those accounts before deletion.
          </p>

          <div className="form-group mb-6">
            <label className="form-label">Select Alternate Recovery Man</label>
            <SearchableSelect options={reassignOptions} value={reassignToId} onChange={setReassignToId} placeholder="Search recovery man..." />
          </div>

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setReassignModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleReassignAndDelete}>Confirm & Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
