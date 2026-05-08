import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, X, Plus, Minus, Loader, ChevronLeft, ChevronRight, Info, ShieldCheck, Globe, Truck, CreditCard, CheckCircle2, Star } from 'lucide-react';
import { PayPalButtons } from '@paypal/react-paypal-js';

import { products as mockProducts } from './data/products';
import { policies } from './data/policies';

const mockReviews = [
  { id: 1, author: 'Alex M.', rating: 5, date: '2 days ago', content: 'The print quality is absolutely stunning. The colors are even more vibrant than they appeared in the photos!', category: 'T-Shirts' },
  { id: 2, author: 'Sarah J.', rating: 5, date: '1 week ago', content: 'Perfect fit! The material is so soft and comfortable. I will definitely be ordering more from here.', category: 'T-Shirts' },
  { id: 3, author: 'Michael R.', rating: 4, date: '3 days ago', content: 'Great design, really unique. The delivery was faster than expected too.', category: 'All' },
  { id: 4, author: 'Elena D.', rating: 5, date: '2 weeks ago', content: 'This poster looks amazing in my office. The paper quality is heavy and feels very premium.', category: 'Posters' },
  { id: 5, author: 'David K.', rating: 5, date: '5 days ago', content: 'The detail on the print is incredible. You can tell they use high-end equipment.', category: 'All' },
  { id: 6, author: 'Jessica W.', rating: 4, date: '1 month ago', content: 'Love the style! The size runs a bit small so maybe order one size up if you like it baggy.', category: 'T-Shirts' },
];

function StarRating({ rating, size = 16, count = 5 }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[...Array(count)].map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? 'var(--warning)' : 'none'}
          color={i < rating ? 'var(--warning)' : 'var(--text-secondary)'}
          style={{ opacity: i < rating ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
}

function ReviewSection({ product }) {
  const isTshirt = product.name?.toLowerCase().includes('t-shirt') || product.name?.toLowerCase().includes('tee');
  const isPoster = product.name?.toLowerCase().includes('poster') || product.name?.toLowerCase().includes('print');

  const relevantReviews = mockReviews.filter(r =>
    r.category === 'All' ||
    (isTshirt && r.category === 'T-Shirts') ||
    (isPoster && r.category === 'Posters')
  );

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Community Feedback</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>4.8</span>
          <div>
            <StarRating rating={5} size={16} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Verified by {relevantReviews.length} shoppers</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {relevantReviews.map(review => (
          <div key={review.id} style={{ paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {review.author[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{review.author}</div>
                  <StarRating rating={review.rating} size={10} />
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{review.date}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', paddingLeft: '2.75rem' }}>
              "{review.content}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function colorToHex(colorName) {
  const map = {
    'Black': '#111111',
    'White': '#ffffff',
    'Charcoal': '#36454f',
    'Navy': '#1c2e4a',
    'Red': '#cc0000',
    'Royal Blue': '#002366',
    'Sport Grey': '#9ea2a2',
    'Maroon': '#6a1b1a',
    'Dark Heather': '#3a3a3a',
    'Irish Green': '#009e60',
    'Orange': '#ffa500',
    'Purple': '#800080',
    'Cardinal': '#9d2235',
    'Light Blue': '#add8e6',
    'Light Pink': '#ffb6c1',
    'Gold': '#ffd700',
    'Sand': '#c2b280',
    'Military Green': '#4b5320',
    'Forest Green': '#1b402e',
    'Tan': '#d2b48c',
    'Grey': '#808080',
    'Heather Grey/White': '#d3d3d3',
    'Silver': '#c0c0c0',
    'Khaki': '#c3b091'
  };
  return map[colorName] || '#808080';
}

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch products');
        }
        const data = await response.json();

        if (!data || data.length === 0) {
          setProducts(mockProducts);
        } else {
          const mappedData = data.map(product => {
            const productName = (product.name || '').toLowerCase();
            let images = [product.image];
            let imageMap = {};
            const isTshirt = productName.includes('t-shirt') || productName.includes('tee');
            const isPoster = productName.includes('poster') || productName.includes('print');
            if (productName.includes('che guevara')) {
              if (isTshirt) {
                images = ['/images/che_guevara_tshirt/che_guevara_mockup.png', '/images/che_guevara_tshirt/che_guevara_black.jpg', '/images/che_guevara_tshirt/che_guevara_maroon.jpg', '/images/che_guevara_tshirt/che_guevara_navy.jpg', '/images/che_guevara_tshirt/che_guevara_cardinal.png', '/images/che_guevara_tshirt/che_guevara_charcoal.png', '/images/che_guevara_tshirt/che_guevara_purple.png', '/images/che_guevara_tshirt/che_guevara_grey.jpg', '/images/che_guevara_tshirt/details/unisex-classic-tee-black-front-69f2146f45532.png', '/images/che_guevara_tshirt/details/unisex-classic-tee-black-back-69f2146f45698.png'];
                imageMap = { 'Black': '/images/che_guevara_tshirt/che_guevara_black.jpg', 'Maroon': '/images/che_guevara_tshirt/che_guevara_maroon.jpg', 'Navy': '/images/che_guevara_tshirt/che_guevara_navy.jpg', 'Cardinal': '/images/che_guevara_tshirt/che_guevara_cardinal.png', 'Charcoal': '/images/che_guevara_tshirt/che_guevara_charcoal.png', 'Purple': '/images/che_guevara_tshirt/che_guevara_purple.png', 'Dark Heather': '/images/che_guevara_tshirt/che_guevara_grey.jpg', 'Grey': '/images/che_guevara_tshirt/che_guevara_grey.jpg' };
              } else if (isPoster) {
                images = ['/images/che_guevara_poster/che_guevara_poster.jpg', '/images/che_guevara_poster/details/enhanced-matte-paper-framed-poster-(in)-black-12x16-lifestyle-1-69f214a1a3857.png', '/images/che_guevara_poster/details/enhanced-matte-paper-framed-poster-(in)-black-12x16-lifestyle-2-69f214a1a3987.png'];
              }
            } else if (productName.includes('stay humble')) {
              if (isTshirt) {
                images = ['/images/stay_humble_tshirt/stay_humble_mockup.png', '/images/stay_humble_tshirt/stay_humble_black.jpg', '/images/stay_humble_tshirt/stay_humble_maroon.jpg', '/images/stay_humble_tshirt/stay_humble_navy.png', '/images/stay_humble_tshirt/details/unisex-classic-tee-black-front-and-back-69decc396a8c3.png', '/images/stay_humble_tshirt/details/unisex-classic-tee-maroon-front-and-back-69decc392d1b9.png', '/images/stay_humble_tshirt/details/unisex-classic-tee-navy-front-and-back-69decc39d0fc6.png'];
                imageMap = { 'Black': '/images/stay_humble_tshirt/stay_humble_black.jpg', 'Maroon': '/images/stay_humble_tshirt/stay_humble_maroon.jpg', 'Navy': '/images/stay_humble_tshirt/stay_humble_navy.png' };
              } else if (isPoster) {
                images = ['/images/stay_humble_poster/stay_humble_poster_new.jpg', '/images/stay_humble_poster/1777897789856.png', '/images/stay_humble_poster/stay_humble_poster_1.png', '/images/stay_humble_poster/stay_humble_poster_2.jpg', '/images/stay_humble_poster/details/enhanced-matte-paper-framed-poster-(in)-white-12x16-front-69f5569bba79a.png', '/images/stay_humble_poster/details/enhanced-matte-paper-framed-poster-(in)-white-18x18-front-69f8b4e30a7f9.png'];
                imageMap = { 'Black': '/images/stay_humble_poster/stay_humble_poster_new.jpg', 'White': '/images/stay_humble_poster/1777897789856.png' };
              }
            } else if (productName.includes('hasta la victoria siempre') && productName.includes('skull')) {
              images = ['/images/skull_art_print/street_skull_art_main.png', '/images/skull_art_print/street_skull_art.png', '/images/skull_art_print/details/enhanced-matte-paper-framed-poster-(in)-black-18x24-front-69f5569bba2ac.png', '/images/skull_art_print/details/enhanced-matte-paper-framed-poster-(in)-white-18x24-front-69f5569bba301.png'];
              imageMap = { 'Black': '/images/skull_art_print/details/enhanced-matte-paper-framed-poster-(in)-black-18x24-front-69f5569bba2ac.png', 'White': '/images/skull_art_print/details/enhanced-matte-paper-framed-poster-(in)-white-18x24-front-69f5569bba301.png' };
            } else if (productName.includes('hasta la victoria siempre') && productName.includes('trucker cap')) {
              images = ['/images/trucker_cap/trucker_cap_1.png', '/images/trucker_cap/trucker_cap_tan.jpg', '/images/trucker_cap/trucker_cap_grey_2.jpg', '/images/trucker_cap/trucker_cap_2.png', '/images/trucker_cap/trucker_cap_3.png', '/images/trucker_cap/trucker_cap_4.png', '/images/trucker_cap/trucker_cap_5.jpg', '/images/trucker_cap/trucker_cap_6.jpg'];
              imageMap = { 'Heather Grey/White': '/images/trucker_cap/trucker_cap_grey_2.jpg', 'Silver': '/images/trucker_cap/trucker_cap_grey_2.jpg', 'Khaki': '/images/trucker_cap/trucker_cap_tan.jpg', 'White': '/images/trucker_cap/trucker_cap_1.png' };
            }
            let badge = null;
            if (productName.includes('che guevara')) badge = 'Best Seller';
            if (productName.includes('stay humble')) badge = 'Trending';
            if (productName.includes('skull')) badge = 'New Drop';
            let features = ['Premium Quality Material', 'Ethically Sourced', 'High-Definition Print'];
            if (isTshirt) features.push('100% Ring-spun cotton', 'Durable double-stitching');
            if (isPoster) features.push('Museum-quality paper', 'Gicl\u00e9e printing quality');
            return { ...product, images, imageMap, badge, features };
          });
          const sortedData = [...mappedData].sort((a, b) => {
            const aIsTshirt = (a.name || '').toLowerCase().includes('t-shirt') || (a.name || '').toLowerCase().includes('tee');
            const bIsTshirt = (b.name || '').toLowerCase().includes('t-shirt') || (b.name || '').toLowerCase().includes('tee');
            return aIsTshirt && !bIsTshirt ? -1 : !aIsTshirt && bIsTshirt ? 1 : 0;
          });
          setProducts(sortedData);
        }
      } catch (err) {
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-container" style={{ zoom: '0.8' }}>
      <nav style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            <ShoppingBag className="text-accent" />
            <span className="text-gradient">YONKO</span>
          </Link>
          <button className="btn-icon" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
            <ShoppingCart size={24} />
            {cartCount > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--accent-primary)', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
          </button>
        </div>
      </nav>

      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setIsCartOpen(false)}></div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--glass-border)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Your Cart</h2>
              <button className="btn-icon" onClick={() => setIsCartOpen(false)}><X /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.length === 0 ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Your cart is empty.</p> : cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem' }}>{item.name}</h4>
                    <p style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>${item.price.toFixed(2)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button className="btn-icon" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                      <span>{item.quantity}</span>
                      <button className="btn-icon" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <Link to="/checkout" onClick={() => setIsCartOpen(false)}><button className="btn btn-primary" style={{ width: '100%' }} disabled={cart.length === 0}>Checkout</button></Link>
            </div>
          </div>
        </div>
      )}

      <main style={{ padding: '2rem 0', minHeight: 'calc(100vh - 160px)' }}>
        <Routes>
          <Route path="/" element={<Home products={products} loading={loading} error={error} addToCart={addToCart} windowWidth={windowWidth} setSelectedProductForModal={setSelectedProductForModal} />} />
          <Route path="/checkout" element={<Checkout cart={cart} cartTotal={cartTotal} />} />
        </Routes>
      </main>

      {selectedProductForModal && (
        <SharedProductModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          addToCart={addToCart}
          windowWidth={windowWidth}
        />
      )}

      <footer style={{ padding: '4rem 2rem', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <p>&copy; 2026 YONKO Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function VariantSelector({ availableColors, selectedColor, setSelectedColor, availableSizesForColor, activeSize, setSelectedSize, variants, product, images, setCurrentImageIndex }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {availableColors.length > 0 && (
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Color: {selectedColor}</span>
          <div className="color-swatches" style={{ gap: '0.75rem', display: 'flex', marginTop: '0.5rem' }}>
            {availableColors.map((colorName) => (
              <div
                key={colorName}
                onClick={() => {
                  setSelectedColor(colorName);
                  const newSizes = [...new Set(variants.filter(v => v.color === colorName).map(v => v.size))].filter(Boolean);
                  if (newSizes.length > 0 && !newSizes.includes(activeSize)) setSelectedSize(newSizes[0]);
                  if (product.imageMap && product.imageMap[colorName]) {
                    const idx = images.indexOf(product.imageMap[colorName]);
                    if (idx !== -1) setCurrentImageIndex(idx);
                  }
                }}
                style={{ backgroundColor: colorToHex(colorName), width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', border: selectedColor === colorName ? '2px solid white' : '1px solid rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
        </div>
      )}
      {availableSizesForColor.length > 0 && (
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Size: {activeSize}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.5rem' }}>
            {availableSizesForColor.map((size) => (
              <button key={size} onClick={() => setSelectedSize(size)} className={`btn-size ${activeSize === size ? 'active' : ''}`} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>{size}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, addToCart, windowWidth, openModal }) {
  const variants = product.variants || [];
  const availableColors = [...new Set(variants.map(v => v.color))].filter(Boolean);
  const images = product.images || [product.image];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(availableColors.length > 0 ? availableColors[0] : null);
  const availableSizesForColor = variants.filter(v => v.color === selectedColor).map(v => v.size).filter(Boolean);
  const [activeSize, setSelectedSize] = useState(availableSizesForColor.length > 0 ? availableSizesForColor[0] : null);
  const selectedVariant = variants.find(v => (selectedColor ? v.color === selectedColor : true) && (activeSize ? v.size === activeSize : true));
  const displayPrice = selectedVariant?.price || variants[0]?.price || product.price;

  return (
    <div className="product-card-professional glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="product-image-container" onClick={() => openModal(product)} style={{ cursor: 'pointer', aspectRatio: '1/1', overflow: 'hidden' }}>
        <img src={images[currentImageIndex]} alt={product.name} className="product-image" />
      </div>
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{product.name}</h3>
        <p style={{ fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '1rem' }}>${displayPrice.toFixed(2)}</p>
        <VariantSelector
          availableColors={availableColors} selectedColor={selectedColor} setSelectedColor={setSelectedColor}
          availableSizesForColor={availableSizesForColor} activeSize={activeSize} setSelectedSize={setSelectedSize}
          variants={variants} product={product} images={images} setCurrentImageIndex={setCurrentImageIndex}
        />
        <button className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }} onClick={() => addToCart({ ...product, id: selectedVariant?.id || product.id, name: `${product.name} (${selectedColor}) [${activeSize}]`, image: images[currentImageIndex], price: displayPrice })}>Add to Cart</button>
      </div>
    </div>
  );
}

function SharedProductModal({ product, onClose, addToCart, windowWidth }) {
  const variants = product.variants || [];
  const availableColors = [...new Set(variants.map(v => v.color))].filter(Boolean);
  const images = product.images || [product.image];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(availableColors.length > 0 ? availableColors[0] : null);

  const availableSizesForColor = variants
    .filter(v => v.color === selectedColor)
    .map(v => v.size)
    .filter(Boolean);

  const [activeSize, setSelectedSize] = useState(availableSizesForColor.length > 0 ? availableSizesForColor[0] : null);

  const selectedVariant = variants.find(v =>
    (selectedColor ? v.color === selectedColor : true) &&
    (activeSize ? v.size === activeSize : true)
  );

  const displayPrice = selectedVariant?.price || variants[0]?.price || product.price;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10, 12, 16, 0.98)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <style>{`body { overflow: hidden !important; }`}</style>
      <div
        className="animate-fade-in"
        style={{
          background: 'var(--bg-secondary)',
          width: '95vw',
          height: '96vh',
          maxWidth: '2400px',
          maxHeight: '1600px',
          borderRadius: '40px',
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          top: '50%',
          left: '45%',
          transform: 'translate(-50%, -50%)',
          overflow: 'hidden',
          zIndex: 1100,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 60px 100px rgba(0,0,0,0.8), 0 0 100px rgba(147, 51, 234, 0.15)',
          animation: 'modalSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Decorative Background Glows */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: -1 }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(147, 51, 234, 0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: -1 }}></div>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2.5rem', borderBottom: '1px solid var(--glass-border)', flexShrink: 0, background: 'rgba(22, 26, 34, 0.8)', backdropFilter: 'blur(20px)', zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={onClose} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
              <ChevronLeft size={20} /> Back to Collection
            </button>
            <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }}></div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {product.name}
              <span style={{ color: 'var(--accent-primary)', fontSize: '1.4rem', fontWeight: '900' }}>${displayPrice.toFixed(2)}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <X size={26} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth > 1100 ? '1.4fr 1fr 0.8fr' : (windowWidth > 800 ? '1.2fr 1fr' : '1fr'),
          flex: 1,
          overflowY: windowWidth > 1100 ? 'hidden' : 'auto',
          overflowX: 'hidden'
        }}>

          {/* Column 1: Image Gallery */}
          <div style={{
            padding: windowWidth > 1100 ? '3rem' : '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem',
            borderRight: windowWidth > 1100 ? '1px solid var(--glass-border)' : 'none',
            borderBottom: windowWidth <= 1100 ? '1px solid var(--glass-border)' : 'none',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.2))',
            overflowY: windowWidth > 1100 ? 'auto' : 'visible'
          }}>
            <div style={{
              aspectRatio: '1/1',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.05)',
              position: 'relative',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)'
            }}>
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />

              {images.length > 1 && (
                <>
                  <button
                    className="image-nav-arrow prev"
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    style={{ opacity: 1, left: '1.5rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    className="image-nav-arrow next"
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                    style={{ opacity: 1, right: '1.5rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails moved to configuration column */}
          </div>

          {/* Column 2: Configuration & Details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: 'none',
            background: 'var(--bg-primary)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: windowWidth > 1100 ? '3rem' : '2rem',
              overflowY: windowWidth > 1100 ? 'auto' : 'visible',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '2.5rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.75rem' }}>
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      style={{
                        aspectRatio: '1/1',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: currentImageIndex === idx ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                        opacity: currentImageIndex === idx ? 1 : 0.4,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
                <VariantSelector
                  availableColors={availableColors}
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                  availableSizesForColor={availableSizesForColor}
                  activeSize={activeSize}
                  setSelectedSize={setSelectedSize}
                  variants={variants}
                  product={product}
                  images={images}
                  setCurrentImageIndex={setCurrentImageIndex}
                />
              </div>

              <div>
                {/* Product details moved to badges on the right for cleaner UI */}
              </div>

              {windowWidth <= 1100 && (
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '3rem', marginTop: '1rem' }}>
                  <ReviewSection product={product} />
                </div>
              )}
            </div>

            <div style={{
              padding: windowWidth > 1100 ? '2rem 3rem' : '1.5rem',
              borderTop: '1px solid var(--glass-border)',
              background: 'var(--bg-secondary)',
              position: windowWidth > 1100 ? 'relative' : 'sticky',
              bottom: 0,
              zIndex: 30,
              boxShadow: '0 -20px 40px rgba(0,0,0,0.3)'
            }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1.5rem', fontSize: '1.25rem', fontWeight: '900', borderRadius: '18px', display: 'flex', justifyContent: 'center', gap: '1.25rem', letterSpacing: '-0.01em' }}
                onClick={() => {
                  if (availableColors.length > 0 && !selectedColor) { alert('Please select a color.'); return; }
                  if (availableSizesForColor.length > 0 && !activeSize) { alert('Please select a size.'); return; }
                  const cartName = product.name + (selectedColor ? ' (' + selectedColor + ')' : '') + (activeSize ? ' [' + activeSize + ']' : '');
                  addToCart({ ...product, id: selectedVariant?.id || product.id, name: cartName, image: images[currentImageIndex], color: selectedColor, size: activeSize, price: displayPrice });
                }}
              >
                <ShoppingCart size={28} /> Add to Cart — ${displayPrice.toFixed(2)}
              </button>
            </div>
          </div>

          {/* Column 3: Reviews (Desktop only) */}
          {windowWidth > 1100 && (
            <div style={{ padding: '2.5rem', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', borderLeft: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <span style={{ background: 'rgba(147, 51, 234, 0.25)', color: '#c084fc', fontSize: '0.65rem', fontWeight: '800', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {product.category || 'Premium Collection'}
                </span>
                {product.badge && (
                  <span style={{ background: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', fontSize: '0.65rem', fontWeight: '800', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {product.badge}
                  </span>
                )}
              </div>
              <ReviewSection product={product} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Side Sidebar (Highlights outside the modal) */}
      {windowWidth > 1100 && (
        <div style={{
          position: 'fixed',
          right: '2.5vw',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1500,
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          padding: '2.5rem',
          width: '240px',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>Features</h4>
            {(product.features || []).map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ lineHeight: '1.4' }}>{feature}</span>
              </div>
            ))}
          </div>

          <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>Shopping Confidence</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              <Truck size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Fast Worldwide Tracked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Secure PayPal Encryption</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              <Globe size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Eco-Friendly Production</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Home({ products, loading, error, addToCart, windowWidth, setSelectedProductForModal }) {
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader className="animate-spin text-accent" size={48} /></div>;
  if (error) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--danger)' }}>Error: {error}</div>;

  return (
    <div className="container animate-fade-in">
      {/* Featured Products Section */}
      <section style={{ marginBottom: '6rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2.5rem', letterSpacing: '-0.02em' }}>Featured Products</h2>
        <div className="grid-cols-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              addToCart={addToCart}
              colorToHex={colorToHex}
              windowWidth={windowWidth}
              openModal={(p) => setSelectedProductForModal(p)}
            />
          ))}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section style={{ marginBottom: '6rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Why Choose Us?</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
            We combine artistic expression with premium quality to bring you the best urban essentials.
          </p>
        </div>

        <div className="feature-grid">
          <div className="glass-panel feature-card">
            <div className="feature-icon-wrapper">
              <CreditCard size={32} />
            </div>
            <h3 className="feature-title">Secure Payment</h3>
            <p className="feature-desc">
              Your transactions are protected by industry-leading PayPal security. Shop with 100% confidence.
            </p>
          </div>

          <div className="glass-panel feature-card">
            <div className="feature-icon-wrapper">
              <Globe size={32} />
            </div>
            <h3 className="feature-title">Global Shipping</h3>
            <p className="feature-desc">
              We deliver our premium streetwear to every corner of the world, tracked and insured.
            </p>
          </div>

          <div className="glass-panel feature-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={32} />
            </div>
            <h3 className="feature-title">Premium Quality</h3>
            <p className="feature-desc">
              Each piece is crafted from the finest materials and printed with high-definition technology.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Checkout({ cart, cartTotal }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [isShippingCalculated, setIsShippingCalculated] = useState(false);
  const [recipient, setRecipient] = useState({
    name: '',
    address1: '',
    city: '',
    state_code: '',
    country_code: 'US',
    zip: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecipient(prev => ({ ...prev, [name]: value }));
    setIsShippingCalculated(false); // Recalculate if address changes
  };

  const calculateShipping = async () => {
    if (!recipient.address1 || !recipient.city || !recipient.zip) {
      alert('Please fill in your address details first.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/shipping-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, items: cart })
      });
      const data = await response.json();
      if (data && data.length > 0) {
        setShippingCost(parseFloat(data[0].rate));
        setIsShippingCalculated(true);
      } else {
        throw new Error('No shipping rates found for this address.');
      }
    } catch (err) {
      alert(`Shipping Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cartTotal + shippingCost;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '1000px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Secure Checkout</h1>
      <div className="grid-cols-2">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Shipping Details</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
              <input type="text" name="name" required value={recipient.name} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white' }} placeholder="John Doe" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Address</label>
              <input type="text" name="address1" required value={recipient.address1} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white' }} placeholder="123 Street Name" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>City</label>
                <input type="text" name="city" required value={recipient.city} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white' }} placeholder="City" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>ZIP / Postal Code</label>
                <input type="text" name="zip" required value={recipient.zip} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white' }} placeholder="12345" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>State Code</label>
                <input type="text" name="state_code" required value={recipient.state_code} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white' }} placeholder="CA" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Country Code</label>
                <input type="text" name="country_code" required value={recipient.country_code} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white' }} placeholder="US" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" name="email" required value={recipient.email} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white' }} placeholder="alex@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                <input type="tel" name="phone" required value={recipient.phone} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white' }} placeholder="22 123 456" />
              </div>
            </div>
          </div>

          <button
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={calculateShipping}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Shipping'}
          </button>

          {isShippingCalculated && (
            <div style={{ marginTop: '2rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '1.5rem', 
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', 
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  fontWeight: '900',
                  fontSize: '1.2rem',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(147, 51, 234, 0.3)'
                }}
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await fetch("/api/konnect/init-payment", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        amount: totalAmount,
                        firstName: recipient.name.split(' ')[0] || 'Client',
                        lastName: recipient.name.split(' ').slice(1).join(' ') || 'Yonko',
                        email: recipient.email || 'client@yonko.com',
                        phoneNumber: recipient.phone || '22000000',
                        orderId: Date.now().toString()
                      }),
                    });
                    const data = await response.json();
                    if (data.payUrl) {
                      window.location.href = data.payUrl;
                    } else {
                      throw new Error(data.error || 'Failed to initialize Konnect payment');
                    }
                  } catch (err) {
                    alert(`Konnect Error: ${err.message}`);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <img src="https://konnect.network/assets/images/logo-konnect.svg" alt="" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
                Pay & Secure Order
              </button>
              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Secure payment powered by Konnect Network (Visa, Mastercard, e-DINAR)
              </p>
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Order Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{item.name} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Shipping</span>
              <span>{isShippingCalculated ? `$${shippingCost.toFixed(2)}` : 'Calculated at next step'}</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold' }}>
              <span>Total</span>
              <span className="text-accent">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyView({ policy }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [policy]);

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px', padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>{policy.title}</h1>
      <div className="glass-panel" style={{ padding: '2.5rem', lineHeight: '1.8', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
        {policy.content}
      </div>
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <Link to="/">
          <button className="btn btn-outline">Back to Home</button>
        </Link>
      </div>
    </div>
  );
}

export default App;
