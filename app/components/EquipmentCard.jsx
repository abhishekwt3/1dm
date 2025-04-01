// components/EquipmentCard.jsx
export default function EquipmentCard({ equipment, onSelect }) {
  return (
    <div className="bg-gray-200 rounded-md overflow-hidden pb-3">
      <div className="h-32 bg-white border border-gray-200">
        {equipment.image ? (
          <img 
            src={equipment.image} 
            alt={equipment.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-2 flex justify-between items-center">
        <p className="font-medium text-black truncate">{equipment.name}</p>
        <p className="text-right text-black">Rs {equipment.weekly_price}</p>
      </div>
      <div className="px-2">
        <button 
          onClick={() => onSelect(equipment)}
          className="w-full bg-amber-600 text-white py-1 rounded text-sm font-medium"
        >
          SUBSCRIBE
        </button>
      </div>
    </div>
  );
}