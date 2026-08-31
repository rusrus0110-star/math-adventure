import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import styles from './PrimaryButton.module.css';

export function PrimaryButton({
  children,
  className,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  const classes = [styles.button, className].filter(Boolean).join(' ');
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
