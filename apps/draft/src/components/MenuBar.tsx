import { useEffect, useRef, useState } from 'react';

export interface MenuItem {
  label: string;
  shortcut?: string;
  disabled?: boolean;
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
    <nav ref={navRef} aria-label="Main menu" className="relative flex gap-1">
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={openMenu === menu.label}
            className={`rounded px-2 py-0.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
              openMenu === menu.label ? 'bg-gray-100 dark:bg-gray-800' : ''
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
              className="absolute left-0 z-20 mt-1 min-w-52 rounded border border-gray-300 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-900"
            >
              {menu.items.map((item) => (
                <li key={item.label} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    className="flex w-full items-center justify-between gap-8 px-3 py-1 text-left text-sm hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
                    onClick={() => {
                      setOpenMenu(null);
                      item.onSelect();
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.shortcut}
                      </span>
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
