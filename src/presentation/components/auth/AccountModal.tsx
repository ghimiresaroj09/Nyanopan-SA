import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../../application/auth/AuthProvider';
import { authApi } from '../../../data/api/repositories';
import { useToast } from '../../../application/toast/ToastProvider';
import { formatDate } from '../../../shared/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { PasswordInput } from '../ui/PasswordInput';
import { Badge } from '../ui/Badge';

export function AccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
      setError(null);
    }
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!oldPassword) return setError('Enter your current password.');
    if (newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (newPassword !== confirm) return setError('New passwords do not match.');
    setError(null);
    setSaving(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      toast.success('Password updated — signing out.');
      onClose();
      await logout();
      navigate('/login', { replace: true });
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not change password.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="My account"
      width={480}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="stack">
        <div className="account-profile">
          <img src="/logo/nyanopan-mark.png" alt="Nyanopan" className="account-logo" />
          <div className="account-profile-meta">
            <div className="cell-main" style={{ fontSize: 15 }}>
              Nyanopan Admin
            </div>
            <div className="account-badges">
              {user?.is_staff && (
                <Badge tone="sage" dot={false}>
                  <ShieldCheck size={12} style={{ marginRight: 4 }} /> Super Admin
                </Badge>
              )}
              <Badge tone={user?.is_active ? 'success' : 'danger'}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        {user?.date_joined && (
          <div className="cell-sub">Member since {formatDate(user.date_joined)}</div>
        )}

        <div className="account-divider" />

        <form className="stack" onSubmit={submit} style={{ gap: 12 }}>
          <div className="section-title">
            <KeyRound size={14} /> Change password
          </div>
          <Field label="Current password">
            <PasswordInput
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="New password">
            <PasswordInput
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
            />
          </Field>
          {error && (
            <div className="form-error" style={{ marginTop: 0 }}>
              <X size={15} /> {error}
            </div>
          )}
          <Button type="submit" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            <KeyRound size={15} /> {saving ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
