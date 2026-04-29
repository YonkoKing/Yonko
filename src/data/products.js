export const products = [
  {
    id: 'prod_1',
    name: 'Neon Sunset Premium T-Shirt',
    price: 35.00,
    description: 'High quality premium black t-shirt featuring a glowing neon retrowave sunset design on the front. Made from 100% organic cotton for ultimate comfort.',
    images: [
      '/images/premium_tshirt.png',
      '/images/premium_tshirt_back.png',
      '/images/premium_tshirt_detail.png'
    ],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Dark Gray', hex: '#333333' }
    ],
    category: 'T-Shirts',
    features: ['100% Organic Cotton', 'Vibrant Neon Print', 'Unisex Fit']
  },
  {
    id: 'prod_2',
    name: 'Cyberpunk Circuit Hoodie',
    price: 65.00,
    description: 'A heavy-weight premium black hoodie featuring a futuristic cyberpunk glowing blue circuit design. Perfect for cold nights and late coding sessions.',
    images: [
      '/images/premium_hoodie.png',
      '/images/premium_hoodie_back.png',
      '/images/premium_hoodie_side.png'
    ],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Royal Blue', hex: '#002366' }
    ],
    category: 'Hoodies',
    features: ['Heavy-weight 400gsm', 'Glow-in-the-dark back print', 'Front pouch pocket']
  },
  {
    id: 'prod_3',
    name: 'Minimalist Geo Coffee Mug',
    price: 18.00,
    description: 'Start your day right with this sleek white ceramic coffee mug featuring a minimalist geometric logo. Microwave and dishwasher safe.',
    images: [
      '/images/premium_mug.png',
      '/images/premium_mug_angle.png'
    ],
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' }
    ],
    category: 'Accessories',
    features: ['11oz White Ceramic', 'Microwave Safe', 'Dishwasher Safe']
  }
];
