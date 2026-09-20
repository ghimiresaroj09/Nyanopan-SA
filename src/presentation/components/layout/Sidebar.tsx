import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Home,
  Inbox,
  Mail,
  Package,
  Settings2,
  Shapes,
  SlidersHorizontal,
  Tags,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../../shared/format';

interface NavEntry {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const CATALOG_ITEMS: NavEntry[] = [
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/attributes', label: 'Attributes', icon: SlidersHorizontal },
  { to: '/models', label: 'Models', icon: Shapes },
  { to: '/products', label: 'Products', icon: Package },
];

const CMS_ITEMS: NavEntry[] = [
  { to: '/home-page', label: 'Home Page', icon: Home },
  { to: '/configuration', label: 'Configuration', icon: Settings2 },
  { to: '/policies', label: 'Policies', icon: FileText },
  { to: '/story', label: 'Our Story & Sustainability', icon: BookOpen },
];

const AUDIENCE_ITEMS: NavEntry[] = [
  { to: '/subscriptions', label: 'Subscriptions', icon: Mail },
  { to: '/contact-us', label: 'Contact Us', icon: Inbox },
];

function NavSection({ label, items }: { label: string; items: NavEntry[] }) {
  return (
    <>
      <div className="nav-section-label">{label}</div>
      {items.map(({ to, label: itemLabel, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={itemLabel}
          className={({ isActive }) => cn('nav-item', isActive && 'active')}
        >
          <Icon size={18} />
          <span className="nav-label">{itemLabel}</span>
        </NavLink>
      ))}
    </>
  );
}

export function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo/nyanopan-mark.png" alt="Nyanopan" className="brand-logo" />
        <span className="brand-name">Nyanopan</span>
        {open && (
          <button
            type="button"
            className="icon-btn sidebar-toggle"
            aria-label="Close sidebar"
            onClick={onToggle}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="nav" aria-label="Main navigation">
        <NavSection label="Catalog" items={CATALOG_ITEMS} />
        <NavSection label="CMS" items={CMS_ITEMS} />
        <NavSection label="Audience" items={AUDIENCE_ITEMS} />
      </nav>
    </aside>
  );
}
