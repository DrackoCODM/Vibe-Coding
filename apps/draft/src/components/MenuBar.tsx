const MENUS = ['File', 'Edit', 'View', 'Insert', 'Format'] as const;

export function MenuBar() {
  return (
    <nav aria-label="Main menu" className="flex gap-1">
      {MENUS.map((menu) => (
        <button
          key={menu}
          type="button"
          className="rounded px-2 py-0.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {menu}
        </button>
      ))}
    </nav>
  );
}
