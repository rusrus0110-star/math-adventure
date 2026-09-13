import { defaultCharacter } from './characters';
import type { CharacterMood } from './character.types';
import styles from './Character.module.css';

interface CharacterProps {
  mood?: CharacterMood;
  size?: 'small' | 'large';
  className?: string;
  accessoryIcon?: string | null | undefined;
}

export function Character({
  mood = 'idle',
  size = 'large',
  className = '',
  accessoryIcon = null,
}: CharacterProps) {
  const imageSrc = defaultCharacter.assets[mood];

  return (
    <div
      className={`${styles.character} ${styles[size]} ${styles[mood]} ${className}`.trim()}
    >
      <img
        key={mood}
        src={imageSrc}
        alt={defaultCharacter.name}
        draggable={false}
      />
      {accessoryIcon && (
        <span className={styles.accessory} aria-hidden="true">
          {accessoryIcon}
        </span>
      )}
    </div>
  );
}
