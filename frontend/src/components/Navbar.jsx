import { useState } from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="navbar">
      <div className="navbar__top">
        <div className="navbar__brand-group">
          <NavLink to="/" className="navbar__logo">
            StyleTry
          </NavLink>
          <span className="navbar__tagline">Fashion for every look</span>
        </div>

        <form onSubmit={handleSearch} className="navbar__search-form">
          <button type="button" className="navbar__category-button">
            All
          </button>
          <input
            type="text"
            placeholder="Search for jackets, shoes, accessories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="navbar__search-input"
          />
          <button type="submit" className="navbar__search-button">
            Search
          </button>
        </form>

        <div className="navbar__actions">
          <NavLink to="/login" className="navbar__action-link">
            Hello, Sign in
          </NavLink>
          <NavLink to="/cart" className="navbar__cart">
            <span className="navbar__cart-icon">🛒</span>
            <span className="navbar__cart-label">Cart</span>
            <span className="navbar__cart-count">0</span>
          </NavLink>
          <button
            className="navbar__hamburger"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="navbar__hamburger-line"></span>
            <span className="navbar__hamburger-line"></span>
            <span className="navbar__hamburger-line"></span>
          </button>
        </div>
      </div>

      <nav className={`navbar__bottom ${isMenuOpen ? 'navbar__bottom--open' : ''}`}>
        <NavLink to="/" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={() => setIsMenuOpen(false)}>
          Home
        </NavLink>
        <NavLink to="/shop/men" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={() => setIsMenuOpen(false)}>
          Men
        </NavLink>
        <NavLink to="/shop/women" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={() => setIsMenuOpen(false)}>
          Women
        </NavLink>
        <NavLink to="/shop/accessories" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={() => setIsMenuOpen(false)}>
          Accessories
        </NavLink>
        <NavLink to="/shop/sale" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={() => setIsMenuOpen(false)}>
          Sale
        </NavLink>
        <NavLink to="/shop/new" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`} onClick={() => setIsMenuOpen(false)}>
          New Arrivals
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
 