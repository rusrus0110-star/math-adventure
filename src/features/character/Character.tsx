import { defaultCharacter } from './characters';
import type { CharacterMood } from './character.types';
import styles from './Character.module.css';

interface CharacterProps {
  mood?: CharacterMood;
  size?: 'small' | 'large';
  className?: string;
}

export function Character({
  mood = 'idle',
  size = 'large',
  className = '',
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
    </div>
  );
}
