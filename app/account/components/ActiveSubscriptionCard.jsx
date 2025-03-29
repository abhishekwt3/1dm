export default function ActiveSubscriptionCard({ subscription }) {
    return (
      <div className="border-b pb-4 last:border-0 last:pb-0">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-medium text-base">
              {subscription.equipment?.name || 'Coffee Equipment'}
            </span>
            <div className="mt-1 text-sm text-gray-500">
              {subscription.subscription_type === 'WEEKLY' ? 'Weekly' : 'Monthly'} Subscription
            </div>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Active
          </span>
        </div>
        
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Start Date:</span>
            <div className="font-medium">
              {new Date(subscription.start_date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <span className="text-gray-500">End Date:</span>
            <div className="font-medium">
              {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'Ongoing'}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Pickup:</span>
            <div className="font-medium">{subscription.pickup_location}</div>
          </div>
          <div>
            <span className="text-gray-500">Price:</span>
            <div className="font-medium">₹{subscription.price.toFixed(2)}</div>
          </div>
        </div>
        
        <div className="mt-3 flex justify-end">
          <button className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            View Details
          </button>
        </div>
      </div>
    );
  }