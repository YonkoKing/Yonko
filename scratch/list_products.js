import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const PRINTFUL_API_URL = 'https://api.printful.com';
const headers = {
  'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
  'Content-Type': 'application/json'
};

async function listProducts() {
  try {
    const storesRes = await axios.get(`${PRINTFUL_API_URL}/stores`, { headers });
    const stores = storesRes.data.result;
    for (const store of stores) {
      console.log(`Store: ${store.name} (ID: ${store.id})`);
      const productsRes = await axios.get(`${PRINTFUL_API_URL}/store/products?store_id=${store.id}`, { headers });
      const products = productsRes.data.result;
      if (products) {
        products.forEach(p => console.log(` - Product: ${p.name} (ID: ${p.id})`));
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}

listProducts();
