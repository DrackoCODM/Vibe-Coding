import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the associated formatting is currently active. */
  active?: boolean;
  children: ReactNode;
}

export function ToolbarButton({
  active = false,
  children,
  className,
  ...rest
}: ToolbarButtonProps) {
  const classes = ['gratis-toolbar-button', active ? 'is-active' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" aria-pressed={active} className={classes} {...rest}>
      {children}
    </button>
  );
}
