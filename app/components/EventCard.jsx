'use client';

export default function EventCard({ event }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      {event.image && (
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg">{event.title}</h3>
        <div className="flex items-center mt-2 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">{new Date(event.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center mt-1 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{event.time}</span>
        </div>
        <p className="text-gray-600 text-sm mt-2">{event.description}</p>
      </div>
    </div>
  );
}