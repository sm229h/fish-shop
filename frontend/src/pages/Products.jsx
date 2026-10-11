import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') || '';
  const inStockOnly = searchParams.get('in_stock_only') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    api.get('/categories').then(d => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('category_id', categoryId);
    if (inStockOnly) params.set('in_stock_only', inStockOnly);
    if (sort) params.set('sort', sort);
    params.set('page', page);
    api.get(`/products?${params.toString()}`)
      .then(d => {
        setProducts(d.products || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [search, categoryId, inStockOnly, sort, page]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value); else newParams.delete(key);
    setPage(1);
    setSearchParams(newParams);
  };

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ marginBottom: '24px', color: 'var(--ocean-deep)' }}>فهرست محصولات</h1>

        <div className="filters-bar">
          <input
            className="form-input"
            placeholder="🔍 جستجوی محصول..."
            value={search}
            onChange={e => updateParam('search', e.target.value)}
          />
          <select className="form-select" value={categoryId} onChange={e => updateParam('category_id', e.target.value)}>
            <option value="">همه دسته‌ها</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-select" value={inStockOnly} onChange={e => updateParam('in_stock_only', e.target.value)}>
            <option value="">همه محصولات</option>
            <option value="true">فقط موجودها</option>
          </select>
          <select className="form-select" value={sort} onChange={e => updateParam('sort', e.target.value)}>
            <option value="newest">جدیدترین</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
          </select>
        </div>

        <p style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {total} محصول یافت شد
        </p>

        {loading ? (
          <Loading text="در حال بارگذاری محصولات..." />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>محصولی یافت نشد</h3>
            <p>فیلترها را تغییر دهید یا جستجوی دیگری امتحان کنید</p>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>قبلی</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) < 3 || p === 1 || p === totalPages)
                  .map((p, i, arr) => (
                    <span key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: '0 4px' }}>...</span>}
                      <button className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                    </span>
                  ))}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>بعدی</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
