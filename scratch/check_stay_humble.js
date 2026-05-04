import http from 'http';

http.get('http://localhost:3001/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      const stayHumble = products.find(p => p.name.toLowerCase().includes('stay humble') && (p.name.toLowerCase().includes('t-shirt') || p.name.toLowerCase().includes('tee')));
      if (stayHumble) {
        console.log('Found Stay Humble T-Shirt:');
        console.log(stayHumble.name);
        const colors = [...new Set(stayHumble.variants.map(v => v.color))].filter(Boolean);
        console.log('Available Colors from API:', colors);
      } else {
        console.log('Stay Humble T-shirt not found in API response.');
      }
    } catch(e) {
      console.log('Error parsing JSON', e.message);
    }
  });
}).on('error', err => {
  console.log('Error fetching:', err.message);
});
