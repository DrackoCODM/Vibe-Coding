import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

export interface MenuItem {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  icon?: ReactNode;
  onSelect: () => void;
}

export interface MenuDefinition {
  label: string;
  items: MenuItem[];
}

export interface MenuBarProps {
  menus: MenuDefinition[];
}

export function MenuBar({ menus }: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openMenu]);

  return (
    <nav ref={navRef} aria-label="Main menu" className="relative flex gap-0.5">
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={openMenu === menu.label}
            className={`gratis-focus-ring rounded-md px-2.5 py-1 text-xs font-medium text-muted transition-colors duration-fast hover:bg-ink/5 hover:text-ink ${
              openMenu === menu.label ? 'bg-ink/8 text-ink' : ''
            }`}
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpenMenu(null);
            }}
          >
            {menu.label}
          </button>
          {openMenu === menu.label && (
            <ul
              role="menu"
              aria-label={menu.label}
              className="animate-menu-in absolute left-0 z-20 mt-1.5 min-w-56 origin-top rounded-lg border border-line bg-overlay p-1 shadow-elev3"
            >
              {menu.items.map((item) => (
                <li key={item.label} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    className="gratis-focus-ring flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs text-ink transition-colors duration-fast hover:bg-ink/5 disabled:opacity-40"
                    onClick={() => {
                      setOpenMenu(null);
                      item.onSelect();
                    }}
                  >
                    {item.icon && (
                      <span className="flex w-4 shrink-0 justify-center text-muted" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <span className="text-2xs text-faint">{item.shortcut}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}
