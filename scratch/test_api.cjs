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
    
    for (const store of stores) {
      const productsRes = await axios.get(`${PRINTFUL_API_URL}/store/products?store_id=${store.id}`, { headers });
      const products = productsRes.data.result;
      if (products && products.length > 0) {
        console.log(`\n=== Store: ${store.name} ===`);
        for (const p of products) {
          console.log(`Product: ${p.name}`);
          const detailsRes = await axios.get(`${PRINTFUL_API_URL}/store/products/${p.id}?store_id=${store.id}`, { headers });
          const variants = detailsRes.data.result.sync_variants;
          const colors = [...new Set(variants.map(v => v.color))].filter(Boolean);
          const sizes = [...new Set(variants.map(v => v.size))].filter(Boolean);
          console.log(`  Colors: ${colors.join(', ')}`);
          console.log(`  Sizes: ${sizes.join(', ')}`);
        }
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}

check();
