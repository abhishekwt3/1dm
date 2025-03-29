import OrderItem from '../../components/OrderItem';

export default function SubscriptionsSection({ subscriptions }) {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>You don't have any active subscriptions.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {subscriptions.map(subscription => (
        <OrderItem 
          key={subscription.id} 
          subscription={subscription} 
        />
      ))}
    </div>
  );
}