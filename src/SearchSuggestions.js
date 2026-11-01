import properties from './properties.json';

// These featured areas are only shown when the city has matching sample listings.
const featuredAreas = {
  Bengaluru: ['Whitefield', 'Indiranagar', 'Koramangala', 'Hebbal', 'JP Nagar'],
  Hyderabad: ['Gachibowli', 'Kondapur', 'Madhapur', 'Jubilee Hills', 'Kokapet'],
  Pune: ['Baner', 'Balewadi', 'Wakad', 'Kothrud', 'Aundh'],
};

// Sample builder labels give each demo city a useful developer directory.
const sampleBuilders = {
  Bengaluru: ['Northline Estates', 'Suncrest Living', 'Meridian Spaces', 'Grove Developments'],
  Hyderabad: ['Lakefront Spaces', 'Deccan Living', 'Cedar Developments', 'Avenue Estates'],
  Pune: ['Westline Homes', 'Pinecrest Living', 'Terrace Developments', 'Urban Grove'],
};

const buildersById = new Map();
for (const city of new Set(properties.map(property => property.city))) {
  const names = sampleBuilders[city] || ['Square Homes'];
  properties.filter(property => property.city === city && property.seller === 'Builder')
    .forEach((property, index) => buildersById.set(property.id, names[index % names.length]));
}

export const developerFor = property => property.developer || buildersById.get(property.id) || null;

export function orderedLocalities(city, localities) {
  const order = featuredAreas[city] || [];
  return [...localities].sort((a, b) => {
    const aRank = order.indexOf(a.name);
    const bRank = order.indexOf(b.name);
    if (aRank !== bRank) return (aRank < 0 ? Infinity : aRank) - (bRank < 0 ? Infinity : bRank);
    return b.count - a.count || a.name.localeCompare(b.name);
  });
}

export function localityPrice(propertyList, locality) {
  const rates = propertyList
    .filter(property => property.locality === locality && property.mode === 'BUY' && property.area > 0 && !['Land', 'Commercial'].includes(property.type))
    .map(property => property.price / property.area)
    .sort((a, b) => a - b);
  if (!rates.length) return null;
  return Math.round(rates[Math.floor(rates.length / 2)] / 10) * 10;
}
