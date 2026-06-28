import { useState, useLocation, useNavigate } from 'react';

export default function TryOn() {
  const location = useLocation();
  const navigate = useNavigate();
  const { product, variant } = location.state || {};

  const [uploadedImage, setUploadedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!product || !variant) {
    return (
      <div className="try-on-error">
        <h2>Invalid Try-On Request</h2>
        <p>Please select a product first</p>
        <button onClick={() => navigate('/shop')} className="btn-primary">Back to Shop</button>
      </div>
    );
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!uploadedImage) return;

    setLoading(true);
    // Simulate AI processing (currently just placeholder)
    setTimeout(() => {
      setLoading(false);
      setResult({
        originalImage: preview,
        resultImage: preview, // Placeholder - in future will show AI result
        confidence: 95,
        message: 'Virtual try-on result ready! (AI processing coming soon)'
      });
    }, 2000);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="try-on-container">
      <div className="try-on-header">
        <h1>Virtual Try-On</h1>
        <p>See how this product looks on you</p>
      </div>

      <div className="try-on-wrapper">
        {/* Product Info */}
        <div className="try-on-product-info">
          <div className="try-on-product-image">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="try-on-product-placeholder">👗</div>
            )}
          </div>
          <div className="try-on-product-details">
            <h2>{product.name}</h2>
            {variant.size && <p>Size: {variant.size}</p>}
            {variant.color && <p>Color: {variant.color}</p>}
            <p className="try-on-price">
              Rs {parseFloat(variant.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Upload Section */}
        {!result ? (
          <div className="try-on-upload">
            <h3>Upload Your Photo</h3>
            <p className="try-on-instructions">
              Upload a photo of yourself to see how the {product.name} would look on you
            </p>

            <div className="try-on-upload-area">
              {preview ? (
                <div className="try-on-upload-preview">
                  <img src={preview} alt="Your photo" />
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-remove"
                    title="Remove image"
                  >✕</button>
                </div>
              ) : (
                <label className="try-on-upload-label">
                  <div className="upload-icon">📸</div>
                  <span className="upload-text">Click to upload or drag and drop</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <div className="try-on-actions">
              <button
                onClick={handleTryOn}
                disabled={!uploadedImage || loading}
                className="btn-try-on-submit"
              >
                {loading ? 'Processing...' : 'Try On'}
              </button>
              <button
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>

            <div className="try-on-note">
              <span className="note-icon">ℹ️</span>
              <p className="note-text">
                AI-powered virtual try-on coming soon! For now, you can upload a photo to see it alongside the product.
              </p>
            </div>
          </div>
        ) : (
          /* Result Section */
          <div className="try-on-result">
            <h3>Try-On Result</h3>
            <p className="try-on-result-message">{result.message}</p>

            <div className="try-on-result-comparison">
              <div className="try-on-result-item">
                <h4>Your Photo</h4>
                <img src={result.originalImage} alt="Your photo" />
              </div>
              <div className="try-on-result-item">
                <h4>With Product (Preview)</h4>
                <div className="try-on-result-preview">
                  <img src={result.resultImage} alt="Try-on result" style={{ opacity: 0.7 }} />
                  <div className="result-overlay">
                    <span>🎨 AI Processing</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="try-on-result-actions">
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                Try Another Photo
              </button>
              <button
                onClick={() => navigate(-1)}
                className="btn-primary"
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
