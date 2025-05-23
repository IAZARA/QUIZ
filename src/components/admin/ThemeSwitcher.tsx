import React from 'react';
import { useThemeStore } from '../../store/themeStore';
import { Sun, Moon } from 'lucide-react'; // Icons for light/dark mode

const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-blue-700 focus:outline-none"
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeSwitcher;
