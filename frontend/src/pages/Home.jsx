import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      id: 1,
      title: "Men's Collection",
      subtitle: "Discover the latest in men's fashion",
      buttonText: "Shop Men",
      buttonLink: "/shop/men",
      image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1200&auto=format&fit=crop",
      overlay: "rgba(15, 23, 42, 0.5)",
    },
    {
      id: 2,
      title: "Women's Fashion",
      subtitle: "Elegant styles for every occasion",
      buttonText: "Shop Women",
      buttonLink: "/shop/women",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&auto=format&fit=crop",
      overlay: "rgba(79, 70, 229, 0.45)",
    },
    {
      id: 3,
      title: "Summer Collection",
      subtitle: "Fresh and vibrant styles for warm days",
      buttonText: "Explore Now",
      buttonLink: "/shop",
      image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop",
      overlay: "rgba(15, 23, 42, 0.45)",
    },
    {
      id: 4,
      title: "New Arrivals",
      subtitle: "Be the first to wear what's trending",
      buttonText: "Shop New",
      buttonLink: "/shop/new",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop",
      overlay: "rgba(15, 23, 42, 0.5)",
    },
    {
      id: 5,
      title: "Season Sale",
      subtitle: "Get up to 50% off on selected items",
      buttonText: "Shop Sale",
      buttonLink: "/shop/sale",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop",
      overlay: "rgba(220, 38, 38, 0.45)",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="home-page">
      {/* Hero Carousel */}
      <section className="hero-carousel" style={{ position: 'relative', width: '100%', height: '520px', overflow: 'hidden' }}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: slide.overlay,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                <h2 style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: '800',
                  margin: '0 0 1rem 0',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}>
                  {slide.title}
                </h2>
                <p style={{
                  fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                  margin: '0 0 2rem 0',
                  opacity: 0.95,
                  textShadow: '0 1px 5px rgba(0,0,0,0.3)',
                }}>
                  {slide.subtitle}
                </p>
                <button
                  onClick={() => navigate(slide.buttonLink)}
                  style={{
                    padding: '0.9rem 2.5rem',
                    background: 'white',
                    color: '#111827',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 25px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'; }}
                >
                  {slide.buttonText}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          style={{
            position: 'absolute', left: '1.5rem', top: '50%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '48px', height: '48px',
            background: 'rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '50%', color: 'white',
            fontSize: '1.2rem', cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s',
          }}
        >❮</button>
        <button
          onClick={nextSlide}
          style={{
            position: 'absolute', right: '1.5rem', top: '50%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '48px', height: '48px',
            background: 'rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '50%', color: 'white',
            fontSize: '1.2rem', cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s',
          }}
        >❯</button>

        {/* Dot Indicators */}
        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '50%',
          transform: 'translateX(-50%)', display: 'flex', gap: '0.6rem', zIndex: 10
        }}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: index === currentSlide ? '32px' : '10px',
                height: '10px',
                borderRadius: '999px',
                border: 'none',
                background: index === currentSlide ? 'white' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="featured-categories">
        <h2 className="section-title">Shop by Category</h2>
        <div className="categories-grid">
          <div
            className="category-card"
            onClick={() => navigate('/shop/men')}
            style={{ cursor: 'pointer', backgroundImage: 'url(https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', minHeight: '200px' }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Men's Fashion</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.9rem' }}>Discover our latest collection</p>
              <span style={{ padding: '0.5rem 1.25rem', background: 'white', color: '#111827', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Explore</span>
            </div>
          </div>

          <div
            className="category-card"
            onClick={() => navigate('/shop/women')}
            style={{ cursor: 'pointer', backgroundImage: 'url(https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', minHeight: '200px' }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(79,70,229,0.55)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Women's Fashion</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.9rem' }}>Trending styles and designs</p>
              <span style={{ padding: '0.5rem 1.25rem', background: 'white', color: '#111827', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Explore</span>
            </div>
          </div>

          <div
            className="category-card"
            onClick={() => navigate('/shop')}
            style={{ cursor: 'pointer', backgroundImage: 'url(https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', minHeight: '200px' }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>New Arrivals</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.9rem' }}>Latest trends just dropped</p>
              <span style={{ padding: '0.5rem 1.25rem', background: 'white', color: '#111827', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Explore</span>
            </div>
          </div>
        </div>
      </section>

      {/* Virtual Try-On Banner */}
      <section style={{
        margin: '0 2rem 2rem',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        backgroundImage: 'url(https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&auto=format&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        minHeight: '220px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(79,70,229,0.85) 0%, rgba(67,56,202,0.75) 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '3rem', color: 'white' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: '800', margin: '0 0 0.75rem 0' }}>
            Try Before You Buy
          </h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.95, margin: '0 0 1.5rem 0', maxWidth: '500px' }}>
            Use virtual try-on to preview clothes before adding them to your cart.
          </p>
          <button
            onClick={() => navigate('/shop')}
            style={{
              padding: '0.9rem 2rem',
              background: 'white',
              color: '#4f46e5',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Try It Now
          </button>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>Season Sale — Up to 50% Off</h2>
          <p>Limited time offer on selected items. Don't miss out!</p>
          <button
            onClick={() => navigate('/shop/sale')}
            className="cta-button"
          >
            View Sale
          </button>
        </div>
      </section>
    </div>
  );
}
