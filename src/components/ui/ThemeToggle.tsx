import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme-provider';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-4 rounded-full hover:bg-muted/50 transition-colors"
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      {isDark ? (
        <Sun className="h-8 w-8" />
      ) : (
        <Moon className="h-8 w-8" />
      )}
    </button>
  );
};

export { ThemeToggle };
export default ThemeToggle;