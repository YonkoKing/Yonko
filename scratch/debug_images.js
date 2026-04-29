// Debug: simulate the App.jsx mapping logic on live API data
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const PRINTFUL_API_URL = 'https://api.printful.com';
const headers = {
  'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
  'Content-Type': 'application/json'
};

async function debug() {
  const storesRes = await axios.get(`${PRINTFUL_API_URL}/stores`, { headers });
  const store = storesRes.data.result.find(s => s.name === 'Yonko Store') || storesRes.data.result[0];
  
  const productsRes = await axios.get(`${PRINTFUL_API_URL}/store/products?store_id=${store.id}`, { headers });
  const products = productsRes.data.result;

  for (const p of products) {
    const productName = (p.name || '').toLowerCase();
    let images = [p.thumbnail_url];
    let colors = [];

    if (productName.includes('che guevara')) {
      images = [
        p.thumbnail_url || '/images/che_guevara_mockup.png',
        '/images/che_guevara_maroon.jpg',
        '/images/che_guevara_black.jpg',
        '/images/che_guevara_grey.jpg'
      ];
      colors = [
        { name: 'Original', hex: '#000000' },
        { name: 'Maroon', hex: '#800000' },
        { name: 'Black', hex: '#000000' },
        { name: 'Grey', hex: '#808080' }
      ];
    } else if (productName.includes('stay humble')) {
      images = [p.thumbnail_url || '/images/stay_humble_mockup.png', '/images/stay_humble_back.png'];
      colors = [{ name: 'Black', hex: '#000000' }, { name: 'Royal Blue', hex: '#002366' }];
    }

    console.log(`\n=== ${p.name} ===`);
    console.log(`  images count: ${images.length}`);
    images.forEach((img, i) => console.log(`  [${i}] ${img}`));
    console.log(`  colors: ${colors.map(c => c.name).join(', ')}`);
    console.log(`  Will cycle? ${images.length > 1 ? 'YES ✅' : 'NO ❌'}`);
  }
}

debug().catch(console.error);
