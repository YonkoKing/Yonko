const axios = require('axios');
require('dotenv').config({ path: './.env' });

const PRINTFUL_API_URL = 'https://api.printful.com';
const headers = {
  'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
  'Content-Type': 'application/json'
};

async function check() {
  try {
    const storesRes = await axios.get(`${PRINTFUL_API_URL}/stores`, { headers });
    const stores = storesRes.data.result;
    console.log('Stores:', stores.map(s => s.name));
    
    for (const store of stores) {
      console.log(`Checking store: ${store.name} (ID: ${store.id})`);
      const productsRes = await axios.get(`${PRINTFUL_API_URL}/store/products?store_id=${store.id}`, { headers });
      const products = productsRes.data.result;
      console.log(`  Found ${products?.length || 0} products`);
      if (products && products.length > 0) {
        products.forEach(p => console.log(`    - ${p.name}`));
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}

check();
