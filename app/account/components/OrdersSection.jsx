import OrderItem from '../../components/OrderItem';

export default function OrdersSection({ orders }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>You don't have any orders yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <OrderItem key={order.id} order={order} />
      ))}
    </div>
  );
}