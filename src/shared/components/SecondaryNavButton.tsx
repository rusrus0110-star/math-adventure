import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './SecondaryButton.module.css';

interface SecondaryNavButtonProps {
  to: LinkProps['to'];
  label: string;
  icon: ReactNode;
}

export function SecondaryNavButton({ to, label, icon }: SecondaryNavButtonProps) {
  return (
    <Link className={styles.button} to={to}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
