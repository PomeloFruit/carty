import type { Product } from '../types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div style={{
      width: 160, flexShrink: 0,
      border: '1px solid #e5e7eb', borderRadius: 12,
      overflow: 'hidden', background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <img
        src={product.image_url}
        alt={product.name}
        style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
        loading="lazy"
      />
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>
          {product.name}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          {product.category}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
          ${product.price.toFixed(2)}
        </div>
      </div>
    </div>
  )
}
