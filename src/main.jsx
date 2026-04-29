import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import './index.css'
import App from './App.jsx'

const initialOptions = {
  "client-id": "test", // This will be replaced by the user in .env later, but for now we need something for the script to load
  currency: "USD",
  intent: "capture",
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PayPalScriptProvider options={initialOptions}>
        <App />
      </PayPalScriptProvider>
    </BrowserRouter>
  </StrictMode>,
)
