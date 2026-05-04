import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const PRINTFUL_API_URL = 'https://api.printful.com';

const headers = {
  'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
  'Content-Type': 'application/json'
};

async function checkProduct(id) {
  try {
    console.log(`Checking product ID: ${id}`);
    
    // Try as a product ID
    try {
      const res = await axios.get(`${PRINTFUL_API_URL}/store/products/${id}`, { headers });
      console.log('Found as Product ID:', JSON.stringify(res.data.result, null, 2));
      return;
    } catch {
      console.log('Not a direct Product ID.');
    }

    // Try listing products and searching for external_id or in name
    const storesRes = await axios.get(`${PRINTFUL_API_URL}/stores`, { headers });
    const stores = storesRes.data.result;
    
    for (const store of stores) {
      console.log(`Searching in store: ${store.name} (${store.id})`);
      const productsRes = await axios.get(`${PRINTFUL_API_URL}/store/products?store_id=${store.id}`, { headers });
      const products = productsRes.data.result;
      
      const found = products.find(p => p.external_id === id || p.id == id || p.name.includes(id));
      if (found) {
        console.log('Found product in list:', JSON.stringify(found, null, 2));
        // Get details
        const detailsRes = await axios.get(`${PRINTFUL_API_URL}/store/products/${found.id}?store_id=${store.id}`, { headers });
        console.log('Product Details:', JSON.stringify(detailsRes.data.result, null, 2));
        return;
      }
    }

    console.log('Product not found in store products.');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

const productId = process.argv[2].replace('#', '');
checkProduct(productId);
