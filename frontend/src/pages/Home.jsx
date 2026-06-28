import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    { id: 1, title: 'Summer Collection', subtitle: 'Fresh styles for warm days', image: '👕', color: 'linear-gradient(135deg, #f97316, #fb923c)', category: 'women' },
    { id: 2, title: 'Denim Essentials', subtitle: 'Classic and timeless pieces', image: '👖', color: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', category: 'men' },
    { id: 3, title: 'Casual Comfort', subtitle: 'Relaxed fit for everyday wear', image: '👟', color: 'linear-gradient(135deg, #db2777, #ec4899)', category: 'men' },
    { id: 4, title: 'Formal Wear', subtitle: 'Elegant styles for special occasions', image: '🎩', color: 'linear-gradient(135deg, #1e293b, #334155)', category: 'men' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    { icon: '👔', label: "Men's Fashion", desc: 'Discover our latest collection', path: '/shop/men' },
    { icon: '👗', label: "Women's Fashion", desc: 'Trending styles and designs', path: '/shop/women' },
  ];

  const features = [
    { icon: '🎭', title: 'Virtual Try-On', desc: 'See how clothes look on you before buying' },
    { icon: '🚚', title: 'Free Shipping', desc: 'Free delivery on all orders' },
    { icon: '↩️', title: 'Easy Returns', desc: '30-day hassle-free returns' },
    { icon: '🔒', title: 'Secure Payment', desc: '100% secure transactions' },
  ];

  return (
    <div className="home-page">
      {/* Hero Carousel */}
      <section className="hero-carousel">
        <div className="carousel-slides">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`carousel-slide ${index === currentSlide ? 'carousel-slide--active' : ''}`}
              style={{ background: slide.color }}
            >
              <div className="slide-content">
                <div className="slide-image">{slide.image}</div>
                <h2 className="slide-title">{slide.title}</h2>
                <p className="slide-subtitle">{slide.subtitle}</p>
                <button
                  className="slide-button"
                  onClick={() => navigate(`/shop/${slide.category}`)}
                >
                  Shop Now →
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length)} className="carousel-control carousel-control--prev" aria-label="Previous slide">❮</button>
        <button onClick={() => setCurrentSlide((p) => (p + 1) % slides.length)} className="carousel-control carousel-control--next" aria-label="Next slide">❯</button>

        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`carousel-dot ${index === currentSlide ? 'carousel-dot--active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar */}
      <section className="features-bar">
        {features.map((f) => (
          <div key={f.title} className="feature-item">
            <span className="feature-icon">{f.icon}</span>
            <div>
              <strong>{f.title}</strong>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Featured Categories */}
      <section className="featured-categories">
        <h2 className="section-title">Shop by Category</h2>
        <div className="categories-grid">
          {categories.map((cat) => (
            <Link key={cat.path} to={cat.path} className="category-card">
              <div className="category-icon">{cat.icon}</div>
              <h3>{cat.label}</h3>
              <p>{cat.desc}</p>
              <span className="category-link">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Virtual Try-On Banner */}
      <section className="tryon-banner">
        <div className="tryon-content">
          <div className="tryon-badge">NEW FEATURE</div>
          <h2>Virtual Try-On</h2>
          <p>Upload your photo and see how any outfit looks on you before you buy. No more guessing — shop with confidence.</p>
          <button className="cta-button" onClick={() => navigate('/shop')}>
            Try It Now →
          </button>
        </div>
        <div className="tryon-visual">
          <div className="tryon-preview">
            <span>👤</span>
            <div className="tryon-arrow">→</div>
            <span>🧥</span>
            <div className="tryon-arrow">→</div>
            <span>✨</span>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>New Season Sale</h2>
          <p>Get up to 50% off on selected items</p>
          <Link to="/shop/sale" className="cta-button">View Sale →</Link>
        </div>
      </section>
    </div>
  );
}
