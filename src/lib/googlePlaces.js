const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// Category → Google Places type mapping with strict descriptions
const CATEGORY_MAP = {
  'Food & Drink': {
    types: ['restaurant', 'bar', 'cafe', 'bakery'],
    description: 'restaurants, bars, cafes, and bakeries only',
  },
  'Art & Culture': {
    types: ['art_gallery', 'museum'],
    description: 'art galleries and museums only',
  },
  'Fitness & Wellness': {
    types: ['gym', 'spa'],
    description: 'gyms, yoga studios, and spas only',
  },
  'Event Spaces': {
    types: ['event_venue', 'community_center'],
    description: 'dedicated event venues and community centers',
  },
  'Retail & Shopping': {
    types: ['store', 'book_store', 'clothing_store'],
    description: 'retail shops, bookstores, and boutiques',
  },
  'All': {
    types: ['restaurant', 'bar', 'cafe', 'art_gallery', 'gym', 'spa', 'store', 'book_store'],
    description: 'any local business',
  },
};

/**
 * Search Google Places API for businesses near a location.
 * Uses the Text Search (New) endpoint.
 */
export async function searchGooglePlaces({ query, location, radius = 5000, category = 'All' }) {
  if (!API_KEY) {
    console.warn('Google Places API key not configured.');
    return [];
  }

  const cat = CATEGORY_MAP[category] || CATEGORY_MAP['All'];
  const searchQuery = query || cat.description;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=${encodeURIComponent(searchQuery)}` +
      `&location=${location.lat},${location.lng}` +
      `&radius=${radius}` +
      `&type=${cat.types[0]}` +
      `&key=${API_KEY}`
    );

    if (!response.ok) throw new Error('Places API request failed');

    const data = await response.json();

    return (data.results || []).map(place => ({
      place_id:    place.place_id,
      name:        place.name,
      address:     place.formatted_address,
      rating:      place.rating,
      user_ratings_total: place.user_ratings_total,
      types:       place.types,
      location:    place.geometry?.location,
      photos:      place.photos?.map(p =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${API_KEY}`
      ) || [],
      is_google_business: true,
    }));
  } catch (err) {
    console.error('Google Places search error:', err);
    return [];
  }
}

/**
 * Client-side neighborhood post-filter:
 * Ensures results are actually in the searched neighborhood, not just
 * matching the neighborhood name as part of a business name.
 */
export function filterByNeighborhood(results, neighborhood) {
  if (!neighborhood) return results;
  const lower = neighborhood.toLowerCase();
  return results.filter(r => {
    const addr = (r.address || '').toLowerCase();
    return addr.includes(lower);
  });
}

export { CATEGORY_MAP };
