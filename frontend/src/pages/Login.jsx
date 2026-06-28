import { useState, useContext, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const passwordInputRef = useRef(null);

  const { login } = useContext(AuthContext);
  const { loadCart } = useContext(CartContext);

  const [formData, setFormData] = useState({ email: location.state?.email || '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to where user came from, or home
  const from = location.state?.from?.pathname || '/';
  const isFromRegistration = location.state?.email ? true : false;

  // Auto-focus password field if email is pre-filled
  useEffect(() => {
    if (isFromRegistration && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [isFromRegistration]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        await loadCart(); // Reload cart for the logged-in user
        navigate(from, { replace: true });
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">ST</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your StyleTry account</p>

          {isFromRegistration && (
            <div className="auth-success-banner">
              ✅ Account created successfully! Enter your password to sign in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.submit && (
              <div className="auth-error-container">
                <div className="auth-error-message">{errors.submit}</div>
                {errors.submit === 'Invalid email or password' && (
                  <div className="auth-help-text">
                    <p>Don't have an account yet?</p>
                    <button
                      type="button"
                      onClick={handleRegisterRedirect}
                      className="auth-help-button"
                    >
                      Create an account
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                autoComplete="email"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                ref={passwordInputRef}
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                autoComplete="current-password"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button type="submit" disabled={isLoading} className="auth-button">
              {isLoading ? (
                <span className="auth-button-loading">
                  <span className="auth-spinner"></span>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{' '}
            <NavLink to="/register" className="auth-link">Create one</NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
