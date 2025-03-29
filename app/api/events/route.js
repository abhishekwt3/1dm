// Note: Events are not in the database schema, this would need to be added
// For now, we'll mock the data

export default async function handler(req, res) {
    try {
      if (req.method === 'GET') {
        // Mock data for demo purposes
        const events = [
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
        ]
        
        return res.status(200).json(events)
      }
      
      return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }