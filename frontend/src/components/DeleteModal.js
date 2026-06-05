import React, { useEffect } from 'react';
import './Modal.css';

const DeleteModal = ({ taskTitle, onConfirm, onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal modal--sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
      >
        <div className="modal__header">
          <h2 className="modal__title" id="delete-modal-title">Delete Task</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="modal__body">
          <div className="delete-icon" aria-hidden="true">🗑️</div>
          <p className="delete-message" id="delete-modal-desc">
            Are you sure you want to delete{' '}
            <strong>"{taskTitle}"</strong>?
            <br />
            <span className="delete-warning">This action cannot be undone.</span>
          </p>

          <div className="modal__actions">
            <button className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn--danger" onClick={onConfirm} autoFocus>
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
