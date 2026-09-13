import { Link } from 'react-router-dom';
import { t } from '@/shared/i18n';
import styles from './SecondaryButton.module.css';

type BackButtonProps =
  | { to: string; onClick?: never }
  | { to?: never; onClick: () => void };

export function BackButton({ to, onClick }: BackButtonProps) {
  const content = <>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M19 12H5m7-7-7 7 7 7" />
    </svg>
    <span>{t('common.back')}</span>
  </>;

  return to !== undefined
    ? <Link className={styles.button} to={to}>{content}</Link>
    : <button className={styles.button} type="button" onClick={onClick}>{content}</button>;
}
