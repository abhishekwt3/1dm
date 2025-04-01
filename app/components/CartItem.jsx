// components/CartItem.jsx
export default function CartItem({ item, onRemove }) {
    return (
      <div className="py-2 flex justify-between items-center">
        <div>
          <p className="font-medium text-black">{item.product_name}</p>
          <p className="text-sm text-black">Rs {item.price} x {item.quantity}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium text-black">Rs {(item.price * item.quantity).toFixed(0)}</span>
          <button 
            onClick={() => onRemove(item.id)}
            className="text-red-500 p-1"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }