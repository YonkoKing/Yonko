import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, X, Plus, Minus, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { PayPalButtons } from '@paypal/react-paypal-js';

import { products as mockProducts } from './data/products';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch products');
        }
        const data = await response.json();
        
        // Use mock products if API returns empty
        if (!data || data.length === 0) {
          console.log('No products from API, using mock data.');
          setProducts(mockProducts);
        } else {
            const mappedData = data.map(product => {
              const productName = (product.name || '').toLowerCase();
              
              let images = [product.image];
              let imageMap = {};

              const isTshirt = productName.includes('t-shirt') || productName.includes('tee');
              const isPoster = productName.includes('poster');

              if (productName.includes('che guevara')) {
                console.log('Found Che Guevara! Applying custom mapping.');
                if (isTshirt) {
                  images = [
                    '/images/che_guevara_mockup.png',
                    '/images/che_guevara_black.jpg',
                    '/images/che_guevara_maroon.jpg',
                    '/images/che_guevara_grey.jpg'
                  ];
                  imageMap = {
                    'Black': '/images/che_guevara_black.jpg',
                    'Maroon': '/images/che_guevara_maroon.jpg',
                    'Sport Grey': '/images/che_guevara_grey.jpg',
                    'Charcoal': '/images/che_guevara_grey.jpg',
                    'Dark Heather': '/images/che_guevara_grey.jpg',
                    'Navy': '/images/che_guevara_black.jpg'
                  };
                } else if (isPoster) {
                  images = ['/images/che_guevara_poster.jpg'];
                }
              } else if (productName.includes('stay humble')) {
                if (isTshirt) {
                  images = [
                    '/images/stay_humble_mockup.png', 
                    '/images/stay_humble_black.jpg',
                    '/images/stay_humble_maroon.jpg',
                    '/images/stay_humble_grey.jpg'
                  ];
                  imageMap = {
                    'Black': '/images/stay_humble_black.jpg',
                    'Maroon': '/images/stay_humble_maroon.jpg',
                    'Sport Grey': '/images/stay_humble_grey.jpg',
                    'Charcoal': '/images/stay_humble_grey.jpg',
                    'Dark Heather': '/images/stay_humble_grey.jpg',
                    'Navy': '/images/stay_humble_black.jpg'
                  };
                } else if (isPoster) {
                  images = ['/images/stay_humble_poster_new.jpg', '/images/stay_humble_poster_2.jpg', '/images/stay_humble_poster_1.png'];
                }
              } else if (productName.includes('hasta la victoria siempre') && productName.includes('street skull art print')) {
                images = [
                  '/images/street_skull_art_main.png',
                  '/images/street_skull_art.png'
                ];
              } else if (productName.includes('hasta la victoria siempre') && productName.includes('trucker cap')) {
                images = [
                  '/images/trucker_cap_tan.jpg',
                  '/images/trucker_cap_grey_2.jpg',
                  '/images/trucker_cap_1.png',
                  '/images/trucker_cap_2.png',
                  '/images/trucker_cap_3.png',
                  '/images/trucker_cap_4.png',
                  '/images/trucker_cap_5.jpg',
                  '/images/trucker_cap_6.jpg'
                ];
                imageMap = {
                  'Caramel/ Black': '/images/trucker_cap_tan.jpg',
                  'Khaki': '/images/trucker_cap_tan.jpg',
                  'Tan': '/images/trucker_cap_tan.jpg',
                  'Grey': '/images/trucker_cap_grey_2.jpg',
                  'Silver': '/images/trucker_cap_grey_2.jpg',
                  'Black': '/images/trucker_cap_1.png'
                };
              }

              return {
                ...product,
                images: images,
                imageMap: imageMap
              };
            });

            // Sort: T-shirts first
            const sortedData = [...mappedData].sort((a, b) => {
              const aName = (a.name || '').toLowerCase();
              const bName = (b.name || '').toLowerCase();
              const aIsTshirt = aName.includes('t-shirt') || aName.includes('tee');
              const bIsTshirt = bName.includes('t-shirt') || bName.includes('tee');
              
              if (aIsTshirt && !bIsTshirt) return -1;
              if (!aIsTshirt && bIsTshirt) return 1;
              return 0;
            });

            setProducts(sortedData);
        }
      } catch (err) {
        console.error('Fetch error, falling back to mock data:', err.message);
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
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15, 17, 21, 0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            <ShoppingBag className="text-accent" />
            <span className="text-gradient">YONKO</span>
          </Link>
          <button className="btn-icon" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--accent-primary)', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setIsCartOpen(false)}></div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--glass-border)', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Your Cart</h2>
              <button className="btn-icon" onClick={() => setIsCartOpen(false)}><X /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Your cart is empty.</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                      <p style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>${item.price.toFixed(2)}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className="btn-icon" style={{ padding: '0.2rem' }} onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button className="btn-icon" style={{ padding: '0.2rem' }} onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <Link to="/checkout" onClick={() => setIsCartOpen(false)} style={{ display: 'block' }}>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={cart.length === 0}>
                  Checkout
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ padding: '2rem 0', minHeight: 'calc(100vh - 160px)' }}>
        <Routes>
          <Route path="/" element={<Home products={products} loading={loading} error={error} addToCart={addToCart} />} />
          <Route path="/checkout" element={<Checkout cart={cart} cartTotal={cartTotal} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
        <p>&copy; 2026 MERCH Store. Built for demonstration.</p>
      </footer>
    </div>
  );
}

function ProductCard({ product, addToCart, index }) {
  const variants = product.variants || [];
  
  // Extract unique colors globally
  const availableColors = [...new Set(variants.map(v => v.color))].filter(Boolean);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  
  // Calculate sizes strictly available for the selected color
  const availableSizesForColor = [...new Set(variants.filter(v => !selectedColor || v.color === selectedColor).map(v => v.size))].filter(Boolean);
  const [selectedSize, setSelectedSize] = useState(null);
  
  // Dynamically derive the valid size without using an effect
  const activeSize = availableSizesForColor.includes(selectedSize) ? selectedSize : null;

  // Color name to Hex mapping
  const colorToHex = (colorName) => {
    const map = {
      'Black': '#1a1a1a',
      'White': '#ffffff',
      'Charcoal': '#36454f',
      'Navy': '#000080',
      'Red': '#cc0000',
      'Royal Blue': '#002366',
      'Sport Grey': '#9ea2a2',
      'Maroon': '#5e1914',
      'Dark Heather': '#353b3c',
      'Irish Green': '#009e60',
      'Orange': '#ffa500',
      'Purple': '#800080',
      'Light Blue': '#add8e6',
      'Light Pink': '#ffb6c1',
      'Gold': '#ffd700',
      'Sand': '#c2b280',
      'Military Green': '#4b5320',
      'Forest Green': '#1b402e',
      'Tan': '#d2b48c',
      'Grey': '#808080'
    };
    return map[colorName] || '#808080';
  };

  // Find the strictly exact variant based on selection
  const selectedVariant = variants.find(v => 
    (selectedColor ? v.color === selectedColor : true) && 
    (activeSize ? v.size === activeSize : true)
  );

  const displayPrice = selectedVariant?.price || variants[0]?.price || product.price;

  const images = product.images || [product.image];

  return (
    <div 
      className="glass-panel animate-fade-in" 
      style={{ padding: '1rem', display: 'flex', flexDirection: 'column', animationDelay: `${index * 100}ms` }}
    >
      <div className="product-image-container">
        <img 
          src={images[currentImageIndex]} 
          alt={product.name} 
          className="product-image"
          style={{ opacity: 1 }}
        />
        
        {images.length > 1 && (
          <>
            <button 
              className="image-nav-arrow prev"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className="image-nav-arrow next"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
              }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="image-nav-dots">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`nav-dot ${currentImageIndex === idx ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentImageIndex(idx);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', lineHeight: '1.4', fontWeight: '600' }}>{product.name}</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="color-swatches" style={{ marginBottom: 0 }}>
                {availableColors.map((colorName, idx) => (
                  <div 
                    key={idx}
                    className={`color-swatch ${selectedColor === colorName ? 'active' : ''}`}
                    style={{ backgroundColor: colorToHex(colorName) }}
                    data-name={colorName}
                    title={colorName}
                    onClick={() => {
                      setSelectedColor(colorName);
                      // Exact mapping from imageMap
                      if (product.imageMap && product.imageMap[colorName]) {
                        const targetImg = product.imageMap[colorName];
                        const imgIdx = images.indexOf(targetImg);
                        if (imgIdx !== -1) {
                          setCurrentImageIndex(imgIdx);
                        }
                      } else if (idx < images.length) {
                        // Fallback index
                        setCurrentImageIndex(idx); 
                      }
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {selectedColor}
              </span>
            </div>
          )}

          {/* Size Selection */}
          {availableSizesForColor.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {availableSizesForColor.map((size, idx) => (
                <button
                  key={idx}
                  className={`btn-size ${activeSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.description}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            ${displayPrice.toFixed(2)}
          </span>
          <button 
            className="btn btn-outline" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} 
            onClick={() => {
              if (availableColors.length > 0 && !selectedColor) {
                alert("Please select a color first.");
                return;
              }
              if (availableSizesForColor.length > 0 && !activeSize) {
                alert("Please select a size first.");
                return;
              }
              addToCart({
                ...product, 
                id: selectedVariant?.id || product.id,
                name: `${product.name} ${selectedColor ? `(${selectedColor})` : ''} ${activeSize ? `[${activeSize}]` : ''}`,
                image: images[currentImageIndex], 
                color: selectedColor,
                size: activeSize,
                price: displayPrice
              });
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Home({ products, loading, error, addToCart }) {
  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Error Loading Products</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <p style={{ marginTop: '2rem' }}>Please make sure your Printful API Key is correctly configured in the <code>.env</code> file.</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      {/* Hero Section */}
      <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', background: 'var(--accent-glow)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', position: 'relative' }}>
          Wear the <span className="text-gradient-accent">Future.</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem', position: 'relative' }}>
          Exclusive, high-quality print-on-demand merchandise delivered right to your door.
        </p>
        <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
          Shop Collection
        </button>
      </div>

      {/* Products Grid */}
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Featured Products</h2>
      {products.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No products found in your Printful store.</p>
      ) : (
        <div className="grid-cols-4">
          {products.map((product, idx) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              index={idx} 
              addToCart={addToCart} 
            />
          ))}
        </div>
      )}
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
    zip: ''
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
              <h2 style={{ marginBottom: '1.5rem' }}>Pay with PayPal</h2>
              <PayPalButtons
                style={{ layout: "vertical" }}
                createOrder={async (data, actions) => {
                  const response = await fetch("/api/paypal/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: totalAmount }),
                  });
                  const order = await response.json();
                  return order.id;
                }}
                onApprove={async (data, actions) => {
                  setLoading(true);
                  try {
                    const response = await fetch("/api/paypal/capture-order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        orderID: data.orderID,
                        shippingInfo: recipient,
                        items: cart
                      }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert('Order successfully placed! Printful is now processing it.');
                      navigate('/');
                      window.location.reload();
                    } else {
                      throw new Error(result.details || 'Failed to capture order');
                    }
                  } catch (err) {
                    alert(`Order Error: ${err.message}`);
                  } finally {
                    setLoading(false);
                  }
                }}
              />
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

export default App;
