'use client';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-100">
      <div>
        <div className="font-medium">{item.product_name}</div>
        <div className="text-gray-500 text-sm">₹{item.price.toFixed(2)}</div>
      </div>
      
      <div className="flex items-center">
        <button 
          onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
          className="text-amber-600 w-6 h-6 flex items-center justify-center"
        >
          -
        </button>
        <span className="px-2">{item.quantity}</span>
        <button 
          onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
          className="text-amber-600 w-6 h-6 flex items-center justify-center"
        >
          +
        </button>
        
        <button 
          onClick={() => onRemove(item.product_id)}
          className="ml-2 text-red-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}