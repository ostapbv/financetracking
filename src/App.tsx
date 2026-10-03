import { useEffect } from 'react';
import { useFinanceStore } from './stores/useFinanceStore';
import { useUIStore } from './stores/useUIStore';
import { Layout } from './components/layout/Layout';

export function App() {
  const { initialize, settings } = useFinanceStore();
  const { setDarkMode } = useUIStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync theme with settings
  useEffect(() => {
    if (settings.theme === 'dark') {
      setDarkMode(true);
    } else if (settings.theme === 'light') {
      setDarkMode(false);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, [settings.theme, setDarkMode]);

  return <Layout />;
}

export default App;
