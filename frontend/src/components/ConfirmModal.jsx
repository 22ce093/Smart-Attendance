import './Modal.css';

export default function ConfirmModal({ title = 'Confirm', message = '', onConfirm, onCancel }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content small">
                <div className="modal-header">
                    <h2>{title}</h2>
                </div>

                <div className="modal-body">
                    <p>{message}</p>
                </div>

                <div className="modal-actions">
                    <button onClick={onCancel} className="cancel-btn">Cancel</button>
                    <button onClick={onConfirm} className="submit-btn">Delete</button>
                </div>
            </div>
        </div>
    );
}
