import { useState, useEffect } from 'react';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'Summer Collection',
      subtitle: 'Fresh styles for warm days',
      image: '👕',
      color: '#FFA500',
    },
    {
      id: 2,
      title: 'Denim Essentials',
      subtitle: 'Classic and timeless pieces',
      image: '👖',
      color: '#4169E1',
    },
    {
      id: 3,
      title: 'Casual Comfort',
      subtitle: 'Relaxed fit for everyday wear',
      image: '👟',
      color: '#FF69B4',
    },
    {
      id: 4,
      title: 'Formal Wear',
      subtitle: 'Elegant styles for special occasions',
      image: '🎩',
      color: '#2F4F4F',
    },
    {
      id: 5,
      title: 'Accessories',
      subtitle: 'Complete your look',
      image: '👜',
      color: '#D4AF37',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="home-page">
      {/* Hero Carousel */}
      <section className="hero-carousel">
        <div className="carousel-slides">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`carousel-slide ${
                index === currentSlide ? 'carousel-slide--active' : ''
              }`}
              style={{ backgroundColor: slide.color }}
            >
              <div className="slide-content">
                <div className="slide-image">{slide.image}</div>
                <h2 className="slide-title">{slide.title}</h2>
                <p className="slide-subtitle">{slide.subtitle}</p>
                <button className="slide-button">Shop Now</button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="carousel-control carousel-control--prev"
          aria-label="Previous slide"
        >
          ❮
        </button>
        <button
          onClick={nextSlide}
          className="carousel-control carousel-control--next"
          aria-label="Next slide"
        >
          ❯
        </button>

        {/* Dot Indicators */}
        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`carousel-dot ${
                index === currentSlide ? 'carousel-dot--active' : ''
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="featured-categories">
        <h2 className="section-title">Featured Categories</h2>
        <div className="categories-grid">
          <div className="category-card">
            <div className="category-icon">👔</div>
            <h3>Men's Fashion</h3>
            <p>Discover our latest collection</p>
            <a href="/shop/men" className="category-link">Explore</a>
          </div>
          <div className="category-card">
            <div className="category-icon">👗</div>
            <h3>Women's Fashion</h3>
            <p>Trending styles and designs</p>
            <a href="/shop/women" className="category-link">Explore</a>
          </div>
          <div className="category-card">
            <div className="category-icon">👜</div>
            <h3>Accessories</h3>
            <p>Complete your outfit</p>
            <a href="/shop/accessories" className="category-link">Explore</a>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>New Season Sale</h2>
          <p>Get up to 50% off on selected items</p>
          <a href="/shop/sale" className="cta-button">View Sale</a>
        </div>
      </section>
    </div>
  );
}
