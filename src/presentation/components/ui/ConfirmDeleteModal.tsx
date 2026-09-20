import { Button } from './Button';
import { Modal } from './Modal';

export function ConfirmDeleteModal({
  open,
  itemName,
  saving,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  itemName: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Delete"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" disabled={saving} onClick={onConfirm}>
            {saving ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      <p>
        Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be
        undone.
      </p>
    </Modal>
  );
}
