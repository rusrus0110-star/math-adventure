import type { PropsWithChildren } from 'react';
import styles from './AppShell.module.css';

export function AppShell({ children }: PropsWithChildren) {
  return <main className={styles.shell}>{children}</main>;
}
