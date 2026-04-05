import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = '500px', closeOnOverlay = true, headerActions = null }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlay) {
      onClose?.();
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <div className="modal-header-actions">
            {headerActions}
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmDanger = false,
}) => {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm?.();
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={submitting ? undefined : onClose} title={title} maxWidth="400px">
      <div className="confirm-modal-message">
        <p>{message}</p>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className={`btn ${confirmDanger ? 'btn-danger' : 'btn-primary'}`} onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Please wait...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};
