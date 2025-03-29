export default function DebugPanel({ data }) {
    if (!data) return null;
    
    return (
      <div className="mb-4 p-3 bg-gray-100 rounded-md text-sm">
        <h3 className="font-bold">Database Diagnostics:</h3>
        <p>Connection: {data.connection ? '✅ Connected' : '❌ Failed'}</p>
        <p>Accounts: {data.accountCount}</p>
        <p>Orders: {data.orderCount}</p>
        <p>Subscriptions: {data.subscriptionCount}</p>
        {data.error && (
          <p className="text-red-500">{data.error}</p>
        )}
        {data.sampleAccount && (
          <p>Sample User: {data.sampleAccount.user_name}</p>
        )}
      </div>
    );
  }