'use client';

import { useState, useEffect } from 'react';
import EventCard from './../components/EventCard';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch events
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => {
        // For demo purposes, we'll use mock data
        setEvents([
          {
            id: '1',
            title: 'Coffee Tasting Workshop',
            date: '2025-04-15',
            time: '3:00 PM - 5:00 PM',
            description: 'Join our expert baristas for a guided tasting of our premium coffee selection. Learn about flavor profiles and brewing techniques.',
            image: '/api/placeholder/400/200'
          },
          {
            id: '2',
            title: 'Latte Art Competition',
            date: '2025-04-22',
            time: '6:00 PM - 8:00 PM',
            description: 'Watch our baristas compete or join in yourself! Prizes for the most creative and technically impressive latte art.',
            image: '/api/placeholder/400/200'
          },
          {
            id: '3',
            title: 'Jazz Night',
            date: '2025-04-29',
            time: '7:00 PM - 10:00 PM',
            description: 'Enjoy live jazz music while sipping on your favorite coffee or wine. Special menu items available.',
            image: '/api/placeholder/400/200'
          }
        ]);
        setLoading(false);
      });
  }, []);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Upcoming Events</h1>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <p className="text-center py-8 text-gray-500">No upcoming events at the moment.</p>
          )}
        </div>
      )}
    </div>
  );
}