import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import App from './App'
import store from './seller/redux/store'
import { applyInitialTheme } from './seller/hooks/useTheme'
import { ToastProvider } from './seller/components/ui/Toast'
import './styles/index.css'

// Stamp the saved/OS theme before first paint so there's no light-mode flash.
applyInitialTheme()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
