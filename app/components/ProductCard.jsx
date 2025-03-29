'use client';

export default function ProductCard({ product, onAddToCart, currencySymbol = '₹' }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {product.image && (
        <div className="h-40 bg-gray-200 overflow-hidden">
          <img 
            src={product.image} 
            alt={product.product_name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.product_name}</h3>
        <p className="text-gray-500 text-sm mt-1">{product.description}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="font-bold">{currencySymbol}{product.price.toFixed(2)}</span>
          <button 
            onClick={() => onAddToCart(product)}
            className="bg-amber-600 text-white px-3 py-1 rounded-full text-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}