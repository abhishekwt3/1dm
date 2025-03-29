'use client';

export default function EquipmentCard({ equipment, onSelect, currencySymbol = '₹' }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {equipment.image && (
        <div className="h-40 bg-gray-200 overflow-hidden">
          <img 
            src={equipment.image} 
            alt={equipment.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{equipment.name}</h3>
        <p className="text-gray-500 text-sm mt-1">{equipment.description}</p>
        <div className="mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Weekly:</span>
            <span className="font-semibold">{currencySymbol}{equipment.weekly_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Monthly:</span>
            <span className="font-semibold">{currencySymbol}{equipment.monthly_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Deposit:</span>
            <span className="font-semibold">{currencySymbol}{equipment.deposit_amount.toFixed(2)}</span>
          </div>
        </div>
        <button 
          onClick={() => onSelect(equipment)}
          className="w-full bg-amber-600 text-white py-2 rounded-md mt-3 font-medium"
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}