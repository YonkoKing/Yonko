import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

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

// --- ROUTES ---

// 1. Get Products
app.get('/api/products', async (req, res) => {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Printful API Key is missing.' 
      });
    }

    const storesRes = await axios.get(`${PRINTFUL_API_URL}/stores`, { headers });
    const stores = storesRes.data.result;
    
    if (!stores || stores.length === 0) {
      return res.status(404).json({ error: 'No stores found.' });
    }

    let storeId = null;
    let basicProducts = [];

    for (const store of stores) {
      const productsRes = await axios.get(`${PRINTFUL_API_URL}/store/products?store_id=${store.id}`, { headers, timeout: 10000 });
      if (productsRes.data.result && productsRes.data.result.length > 0) {
        storeId = store.id;
        basicProducts = productsRes.data.result;
        break;
      }
    }

    if (!storeId) return res.json([]);

    const detailedProducts = await Promise.all(basicProducts.map(async (p) => {
      try {
        const detailsRes = await axios.get(`${PRINTFUL_API_URL}/store/products/${p.id}?store_id=${storeId}`, { headers, timeout: 10000 });
        const details = detailsRes.data.result;
        const retailPrice = details.sync_variants[0]?.retail_price || 25.00;
        
        return {
          id: p.id,
          external_id: p.external_id,
          name: p.name,
          price: parseFloat(retailPrice),
          description: p.name.includes('Cap') ? 'A stylish and comfortable cap for any casual occasion.' : 
                       p.name.includes('T-Shirt') || p.name.includes('Tee') ? 'Premium quality t-shirt with an exclusive design. Comfortable and durable.' :
                       p.name.includes('Print') || p.name.includes('Poster') ? 'High-quality art print to decorate your space with unique designs.' :
                       `Premium quality ${p.name.toLowerCase()} featuring an exclusive design.`,
          image: p.thumbnail_url,
          category: 'Printful',
          variants: details.sync_variants.map(v => ({
            id: v.id,
            external_id: v.external_id,
            name: v.name,
            price: parseFloat(v.retail_price),
            size: v.size,
            color: v.color
          }))
        };
      } catch (err) {
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
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 2. Shipping Rates
app.post('/api/shipping-rates', async (req, res) => {
  try {
    const { recipient, items } = req.body;
    const shippingData = {
      recipient,
      items: items.map(item => ({
        variant_id: item.variants?.[0]?.id || item.id,
        quantity: item.quantity
      }))
    };
    const response = await axios.post(`${PRINTFUL_API_URL}/shipping/rates`, shippingData, { headers });
    res.json(response.data.result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate shipping' });
  }
});

// 3. Konnect: Init Payment
app.post('/api/konnect/init-payment', async (req, res) => {
  try {
    const { amount, firstName, lastName, email, phoneNumber, orderId } = req.body;
    
    if (!process.env.KONNECT_API_KEY || !process.env.KONNECT_WALLET_ID) {
      return res.status(500).json({ error: 'Konnect configuration missing' });
    }

    const konnectData = {
      receiverWalletId: process.env.KONNECT_WALLET_ID,
      token: 'TND',
      amount: Math.round(amount * 1000), 
      type: 'immediate',
      description: `Commande ${orderId} - Yonko Store`,
      acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
      firstName,
      lastName,
      email,
      phoneNumber,
      orderId,
      webhook: `${process.env.BACKEND_URL}/api/konnect/webhook`,
      theme: 'dark'
    };

    const response = await axios.post('https://api.konnect.network/api/v2/payments/init-payment', konnectData, {
      headers: {
        'x-api-key': process.env.KONNECT_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Échec de l\'initialisation du paiement Konnect' });
  }
});

// 4. PayPal Configuration & Routes
const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

const getPayPalAccessToken = async () => {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(`${PAYPAL_API_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data.access_token;
};

app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const accessToken = await getPayPalAccessToken();
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'USD', value: amount.toFixed(2) } }]
    };
    const response = await axios.post(`${PAYPAL_API_URL}/v2/checkout/orders`, orderData, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderID, shippingInfo, items } = req.body;
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await axios.post(`${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`, {}, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });

    if (captureResponse.data.status !== 'COMPLETED') throw new Error('PayPal payment not completed');

    const printfulOrderData = {
      recipient: shippingInfo,
      items: items.map(item => ({ sync_variant_id: item.id, quantity: item.quantity })),
      confirm: true
    };

    const printfulResponse = await axios.post(`${PRINTFUL_API_URL}/orders`, printfulOrderData, { headers });

    res.json({ success: true, paypal: captureResponse.data, printful: printfulResponse.data.result });
  } catch (error) {
    res.status(500).json({ error: 'Payment captured but failed to create Printful order' });
  }
});

// Default root route for API
app.get('/api', (req, res) => {
  res.json({ status: 'API is running', version: '1.0.0' });
});

export default app;
