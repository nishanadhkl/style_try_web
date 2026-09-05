import { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { getTotalItems } = useContext(CartContext);
  const { user, logout, isLoggedIn } = useContext(AuthContext);

  const cartCount = getTotalItems();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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
            placeholder="Search for jackets, shirts, jeans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="navbar__search-input"
          />
          <button type="submit" className="navbar__search-button">
            Search
          </button>
        </form>

        <div className="navbar__actions">
          {isLoggedIn ? (
            <div className="navbar__user-menu">
              <span className="navbar__user-greeting">
                Hi, {user?.fullName?.split(' ')[0] || 'User'}
              </span>
              <NavLink to="/orders" className="navbar__action-link">
                My Orders
              </NavLink>
              <button onClick={handleLogout} className="navbar__logout-btn">
                Sign out
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="navbar__action-link">
              Hello, Sign in
            </NavLink>
          )}

          <NavLink to="/cart" className="navbar__cart">
            <span className="navbar__cart-icon">🛒</span>
            <span className="navbar__cart-label">Cart</span>
            {cartCount > 0 && (
              <span className="navbar__cart-count">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </NavLink>

          <button
            className="navbar__hamburger"
            onClick={() => setIsMenuOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            <span className={`navbar__hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`navbar__hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`navbar__hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
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
