import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: './.env' });

console.log('Backend starting...');
console.log('Current directory:', process.cwd());
console.log('API Key present:', !!process.env.PRINTFUL_API_KEY);
if (process.env.PRINTFUL_API_KEY) {
  console.log('API Key starts with:', process.env.PRINTFUL_API_KEY.substring(0, 4) + '...');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Printful API Configuration
const PRINTFUL_API_URL = 'https://api.printful.com';
const headers = {
  'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
  'Content-Type': 'application/json'
};

// Route pour récupérer les produits avec détails (prix réels)
app.get('/api/products', async (req, res) => {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey || apiKey === 'YOUR_PRINTFUL_TOKEN_HERE') {
      return res.status(500).json({ 
        error: 'Printful API Key is missing. Please configure it in the .env file.' 
      });
    }

    // 1. Récupérer l'ID de la boutique
    const storesRes = await axios.get(`${PRINTFUL_API_URL}/stores`, { headers });
    const stores = storesRes.data.result;
    
    if (!stores || stores.length === 0) {
      return res.status(404).json({ error: 'No stores found in your Printful account.' });
    }

    console.log('Available Stores:', stores.map(s => `${s.name} (ID: ${s.id})`).join(', '));

    let storeId = null;
    let basicProducts = [];

    // On cherche la première boutique qui a des produits
    for (const store of stores) {
      console.log(`Checking store: ${store.name} (ID: ${store.id})...`);
      const productsRes = await axios.get(`${PRINTFUL_API_URL}/store/products?store_id=${store.id}`, { headers, timeout: 10000 });
      if (productsRes.data.result && productsRes.data.result.length > 0) {
        storeId = store.id;
        basicProducts = productsRes.data.result;
        console.log(`Found ${basicProducts.length} products in store: ${store.name}`);
        break;
      }
    }

    if (!storeId) {
      console.log('No products found in any store.');
      return res.json([]); // Return empty list instead of error
    }

    // 3. Récupérer les détails de chaque produit
    const detailedProducts = await Promise.all(basicProducts.map(async (p, index) => {
      try {
        console.log(`Fetching details for [${index + 1}/${basicProducts.length}]: ${p.name}`);
        const detailsRes = await axios.get(`${PRINTFUL_API_URL}/store/products/${p.id}?store_id=${storeId}`, { headers, timeout: 10000 });
        const details = detailsRes.data.result;
        // On prend le prix de la première variante comme prix de base
        const retailPrice = details.sync_variants[0]?.retail_price || 25.00;
        
        return {
          id: p.id,
          external_id: p.external_id,
          name: p.name,
          price: parseFloat(retailPrice),
          description: `Produit Printful: ${p.name}`,
          image: p.thumbnail_url,
          category: 'Printful',
          variants: details.sync_variants.map(v => ({
            id: v.id,
            external_id: v.external_id,
            name: v.name,
            price: parseFloat(v.retail_price)
          }))
        };
      } catch (err) {
        console.error(`Error fetching details for product ${p.id}:`, err.message);
        return {
          id: p.id,
          name: p.name,
          price: 25.00,
          image: p.thumbnail_url,
          category: 'Printful'
        };
      }
    }));

    res.json(detailedProducts);
  } catch (error) {
    console.error('Error fetching Printful products:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch products from Printful' });
  }
});

// PayPal API Configuration
const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(`${PAYPAL_API_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('PayPal Auth Error:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal access token');
  }
};

// Route pour calculer les frais de livraison Printful
app.post('/api/shipping-rates', async (req, res) => {
  try {
    const { recipient, items } = req.body;
    
    const shippingData = {
      recipient,
      items: items.map(item => ({
        variant_id: item.variants?.[0]?.id || item.id, // ID de la variante Printful
        quantity: item.quantity
      }))
    };

    const response = await axios.post(`${PRINTFUL_API_URL}/shipping/rates`, shippingData, { headers });
    res.json(response.data.result);
  } catch (error) {
    console.error('Shipping Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to calculate shipping' });
  }
});

// Route PayPal: Créer une commande
app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const accessToken = await getPayPalAccessToken();

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2)
        }
      }]
    };

    const response = await axios.post(`${PAYPAL_API_URL}/v2/checkout/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('PayPal Create Order Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// Route PayPal: Capturer le paiement et créer l'ordre Printful
app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderID, shippingInfo, items } = req.body;
    const accessToken = await getPayPalAccessToken();

    // 1. Capturer le paiement sur PayPal
    const captureResponse = await axios.post(`${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (captureResponse.data.status !== 'COMPLETED') {
      throw new Error('PayPal payment not completed');
    }

    // 2. Si le paiement est réussi, créer la commande sur Printful
    const sync_items = items.map(item => ({
      sync_variant_id: item.id,
      quantity: item.quantity
    }));

    const printfulOrderData = {
      recipient: shippingInfo,
      items: sync_items,
      confirm: true // On confirme l'ordre car le paiement est déjà reçu
    };

    const printfulResponse = await axios.post(`${PRINTFUL_API_URL}/orders`, printfulOrderData, { headers });

    res.json({
      success: true,
      paypal: captureResponse.data,
      printful: printfulResponse.data.result
    });
  } catch (error) {
    console.error('Payment Capture / Printful Order Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Payment captured but failed to create Printful order',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Pour le déploiement sur Vercel, on exporte l'app
export default app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}
