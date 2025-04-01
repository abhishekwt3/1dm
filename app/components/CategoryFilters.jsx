// components/CategoryFilters.jsx
export default function CategoryFilters({ categories, activeCategory, onSelectCategory }) {
    return (
      <div className="mb-4 overflow-x-auto">
        <div className="flex space-x-4">
          <p className="text-base font-bold text-black">Categories</p>
        </div>
        
        <div className="flex space-x-4 mt-2 pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`px-4 py-1 rounded-md whitespace-nowrap ${
                activeCategory === category 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-gray-200 text-black'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
    );
  }