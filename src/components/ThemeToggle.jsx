import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'tactical':
        return '🎯';
      default:
        return '☀️';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'tactical':
        return 'Tactical';
      default:
        return 'Light';
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Current theme: ${getThemeLabel()}. Click to switch.`}
      aria-label={`Switch theme. Current: ${getThemeLabel()}`}
    >
      <span className="theme-icon">{getThemeIcon()}</span>
      <span className="theme-label">{getThemeLabel()}</span>
    </button>
  );
};

export default ThemeToggle;
