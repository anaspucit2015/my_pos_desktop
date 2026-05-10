import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Receipt,
  LayoutGrid,
  Package,
  Users,
  BarChart3,
  Settings,
  Tag,
} from 'lucide-react';
import { UserRole } from '@my-pos/shared';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../ui/ThemeToggle';

interface INavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: INavItem[] = [
  { to: '/pos',       icon: Receipt,    label: 'Point of Sale' },
  { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard'     },
  { to: '/inventory', icon: Package,    label: 'Inventory'     },
  { to: '/customers', icon: Users,      label: 'Customers'     },
];

const ADMIN_NAV_ITEMS: INavItem[] = [
  { to: '/categories', icon: Tag,       label: 'Categories' },
  { to: '/reports',    icon: BarChart3, label: 'Reports'    },
];

/**
 * Wraps any sidebar item with a styled tooltip that slides in from the right on hover.
 */
function Tooltip({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="group relative flex items-center">
      {children}
      {/* Tooltip bubble */}
      <div
        className="pointer-events-none absolute left-full ml-3 z-50
                   flex items-center whitespace-nowrap
                   rounded-lg border border-line bg-surface-nav px-2.5 py-1.5
                   text-xs font-medium text-t1
                   opacity-0 translate-x-1
                   group-hover:opacity-100 group-hover:translate-x-0
                   transition-all duration-150 ease-out"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
      >
        {/* Arrow */}
        <span
          className="absolute -left-[5px] top-1/2 -translate-y-1/2
                     h-2.5 w-2.5 rotate-45 rounded-sm
                     border-l border-b border-line bg-surface-nav"
        />
        {label}
      </div>
    </div>
  );
}

/**
 * Icon-only vertical sidebar. 60 px wide.
 * Tooltips are shown via custom styled overlays on hover.
 * ThemeToggle and user avatar live at the bottom.
 */
export default function Sidebar(): React.JSX.Element {
  const { currentUser, logout } = useAuthStore();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const visibleItems = isAdmin
    ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : NAV_ITEMS;

  const initials =
    ((currentUser?.firstName?.[0] ?? '') + (currentUser?.lastName?.[0] ?? '')).toUpperCase() || '?';

  const signOutLabel = `Sign out (${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''})`.trim();

  return (
    <aside className="flex h-screen w-[60px] flex-shrink-0 flex-col items-center
                      border-r border-line bg-surface-nav py-3 gap-1">

      {/* Logo mark */}
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-input bg-accent">
        <span className="text-sm font-medium text-accent-fg select-none">P</span>
      </div>

      {/* Navigation items */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <Tooltip key={to} label={label}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex h-9 w-9 items-center justify-center rounded-input transition-colors ${
                  isActive
                    ? 'bg-accent/[0.15] text-accent'
                    : 'text-t2 hover:bg-surface-hover hover:text-t1'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.75} />
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-1 mt-2">
        <ThemeToggle />

        {/* Settings (admin only) */}
        {isAdmin && (
          <Tooltip label="Settings">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex h-9 w-9 items-center justify-center rounded-input transition-colors ${
                  isActive
                    ? 'bg-accent/[0.15] text-accent'
                    : 'text-t2 hover:bg-surface-hover hover:text-t1'
                }`
              }
            >
              <Settings size={18} strokeWidth={1.75} />
            </NavLink>
          </Tooltip>
        )}

        {/* User avatar — click to sign out */}
        <Tooltip label={signOutLabel}>
          <button
            onClick={logout}
            className="mt-1 flex h-8 w-8 items-center justify-center rounded-full
                       bg-accent/20 text-accent text-xs font-medium
                       hover:bg-accent/30 transition-colors select-none"
          >
            {initials}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
