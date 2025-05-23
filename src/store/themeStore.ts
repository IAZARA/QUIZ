import {create} from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: localStorage.getItem('theme') as Theme || 'light', // Load theme from localStorage or default to light
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme); // Persist theme choice
      document.body.setAttribute('data-theme', newTheme); // Apply theme to body
      return { theme: newTheme };
    }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme); // Apply theme to body
    set({ theme });
  }
}));

// Initialize theme on load
const initialTheme = localStorage.getItem('theme') as Theme || 'light';
if (document.body) { // Ensure body exists before setting attribute
  document.body.setAttribute('data-theme', initialTheme);
} else {
  // Fallback for environments where document.body might not be immediately available
  // This is less likely in a typical React app lifecycle but good for robustness
  document.addEventListener('DOMContentLoaded', () => {
    document.body.setAttribute('data-theme', initialTheme);
  });
}
