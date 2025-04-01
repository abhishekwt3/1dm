// components/CartSection.jsx
import CartItem from './CartItem';
import RazorpayButton from './RazorpayButton';

export default function CartSection({ 
  cart, 
  isLoggedIn, 
  user,
  paymentMethod, 
  setPaymentMethod, 
  onRemoveItem, 
  onPlaceOrder, 
  isLoading, 
  paymentSuccess, 
  paymentError,
  onPaymentSuccess,
  onPaymentError,
  redirectToLogin,
  totalPrice 
}) {
  if (cart.length === 0) {
    return null;
  }

  return (
    <div id="cart-section" className="mt-8 bg-white rounded-lg shadow p-4">
      <h3 className="font-bold text-lg mb-3 text-black">Your Order</h3>
      
      {paymentSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Payment Successful!</p>
          <p>Your order has been placed.</p>
        </div>
      )}
      
      {paymentError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Payment Error</p>
          <p>{paymentError}</p>
        </div>
      )}
      
      <div className="divide-y">
        {cart.map((item) => (
          <CartItem 
            key={item.id} 
            item={item} 
            onRemove={onRemoveItem} 
          />
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t">
        <div className="flex justify-between font-bold text-black">
          <span>Total</span>
          <span>Rs {totalPrice}</span>
        </div>
        
        {isLoggedIn ? (
          <div className="mt-4">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2 text-black">
                Payment Method
              </label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="payment-cod"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mr-2"
                  />
                  <label htmlFor="payment-cod" className="text-black">Cash on Delivery</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="payment-online"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="mr-2"
                  />
                  <label htmlFor="payment-online" className="text-black">Razorpay</label>
                </div>
              </div>
            </div>
            
            {paymentMethod === 'cod' ? (
              <button 
                onClick={onPlaceOrder}
                disabled={isLoading}
                className="w-full bg-amber-600 text-white py-2 rounded font-medium"
              >
                {isLoading ? 'Processing...' : 'Place Order'}
              </button>
            ) : (
              <RazorpayButton 
                amount={parseFloat(totalPrice)}
                description="Coffee Order"
                buttonText="Pay & Place Order"
                buttonClassName="w-full bg-amber-600 text-white py-2 rounded font-medium"
                onSuccess={onPaymentSuccess}
                onError={onPaymentError}
                metadata={{
                  payment_for: 'ORDER',
                  user_name: user?.user_name,
                  items: cart.map(item => ({ 
                    id: item.id, 
                    name: item.product_name, 
                    price: item.price,
                    quantity: item.quantity
                  }))
                }}
              />
            )}
          </div>
        ) : (
          <button 
            onClick={redirectToLogin}
            className="w-full bg-amber-600 text-white py-2 rounded font-medium mt-4"
          >
            Login to Order
          </button>
        )}
      </div>
    </div>
  );
}