import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './index.css';
import { ThemeProvider } from './components/theme-provider';
import { NavigationProvider } from './components/providers/NavigationProvider';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <NavigationProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </NavigationProvider>
    </ThemeProvider>
  </StrictMode>
);
