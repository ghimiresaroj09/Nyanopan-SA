import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Settings } from 'lucide-react';
import { useAuth } from '../../../application/auth/AuthProvider';
import { useClickOutside } from '../../../application/hooks/useClickOutside';
import { AccountModal } from '../auth/AccountModal';

export function Topbar({
  open,
  onToggleSidebar,
}: {
  open: boolean;
  onToggleSidebar: () => void;
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenuOpen(false));

  return (
    <header className="topbar">
      {!open && (
        <button
          type="button"
          className="icon-btn"
          aria-label="Open sidebar"
          onClick={onToggleSidebar}
        >
          <Menu size={19} />
        </button>
      )}

      <div className="topbar-right">
        <div className="user-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="user-chip"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <img src="/logo/nyanopan-mark.png" alt="Nyanopan" className="user-logo" />
            <span className="user-meta">
              <span className="user-name">Nyanopan Admin</span>
              <span className="user-role">Super Admin</span>
            </span>
            <span className="user-caret">
              <ChevronDown size={16} />
            </span>
          </button>

          {menuOpen && (
            <div className="user-menu" role="menu">
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setAccountOpen(true);
                }}
              >
                <Settings size={15} /> Profile & password
              </button>
              <button
                type="button"
                className="menu-item danger"
                role="menuitem"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                  navigate('/login', { replace: true });
                }}
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </header>
  );
}
