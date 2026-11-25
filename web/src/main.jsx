import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/global.css';
import { ToastProvider } from './components/Toast.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
