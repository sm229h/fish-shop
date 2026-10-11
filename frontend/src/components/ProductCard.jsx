import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/status';

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`}>
        <div className="product-card-img">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <span className="placeholder">🐟</span>
          )}
          {product.is_featured && <span className="badge badge-featured" style={{ position: 'absolute', top: '8px', right: '8px' }}>ویژه</span>}
          {!product.in_stock && <span className="badge badge-out" style={{ position: 'absolute', top: '8px', right: '8px' }}>ناموجود</span>}
        </div>
      </Link>
      <div className="product-card-body">
        <Link to={`/products/${product.id}`}>
          <h3 className="product-card-name">{product.name}</h3>
        </Link>
        <p className="product-card-desc">{product.short_description}</p>
        <div className="product-card-footer">
          <div className="product-card-price">
            {formatPrice(product.price)}
            <small> / {product.unit}</small>
          </div>
          <Link to={`/products/${product.id}`} className="btn btn-primary btn-sm">
            مشاهده
          </Link>
        </div>
      </div>
    </div>
  );
}
