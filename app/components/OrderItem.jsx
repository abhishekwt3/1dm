'use client';

export default function OrderItem({ order, subscription, currencySymbol = '₹' }) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    ACTIVE: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  // If this is a subscription item
  if (subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-500">Subscription</div>
            <div className="font-medium mt-1">
              {subscription.equipment?.name || 'Coffee Equipment'}
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[subscription.status] || 'bg-gray-100 text-gray-800'
          }`}>
            {subscription.status}
          </span>
        </div>

        <div className="border-t border-gray-100 mt-3 pt-3">
          <div className="text-sm">
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-medium">{subscription.subscription_type}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Pickup:</span>
              <span className="font-medium">{subscription.pickup_location}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Start Date:</span>
              <span className="font-medium">
                {new Date(subscription.start_date).toLocaleDateString()}
              </span>
            </div>
            {subscription.end_date && (
              <div className="flex justify-between mt-1">
                <span>End Date:</span>
                <span className="font-medium">
                  {new Date(subscription.end_date).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between mt-1">
              <span>Price:</span>
              <span className="font-medium">{currencySymbol}{subscription.price?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For regular orders
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-500">Order #{order.id.slice(-6)}</div>
          <div className="font-medium mt-1">{new Date(order.order_date).toLocaleDateString()}</div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="border-t border-gray-100 mt-3 pt-3">
        <div className="text-sm">
          <div className="flex justify-between">
            <span>Location:</span>
            <span className="font-medium">{order.location}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Items:</span>
            <span className="font-medium">{order.order_items.length} items</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Payment Method:</span>
            <span className="font-medium">
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 
               order.payment_method === 'online' ? 'Online Payment' : 
               order.payment_method === 'wallet' ? '1dm Wallet' : 'Standard Payment'}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Total:</span>
            <span className="font-medium">{currencySymbol}{order.price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}