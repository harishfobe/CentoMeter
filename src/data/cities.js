/** Demo cities for CentoMeter — single catalog for map, search, and finder. */
export const DEFAULT_CITY = "Coimbatore";

export const cities = [
  {
    name: "Coimbatore",
    center: [11.0168, 76.9558],
    localities: [
      "RS Puram",
      "Peelamedu",
      "Saibaba Colony",
      "Race Course",
      "Gandhipuram",
      "Singanallur",
    ],
    landmarks: [
      ["Brookefields Mall", "RS Puram"],
      ["Codissia Trade Fair", "Peelamedu"],
      ["VOC Park", "Race Course"],
    ],
    builders: [
      "Nilgiri Estates",
      "Kovai Living",
      "Anamalai Homes",
      "Siruvani Spaces",
    ],
  },
  {
    name: "Chennai",
    center: [13.0827, 80.2707],
    localities: [
      "Adyar",
      "T Nagar",
      "Anna Nagar",
      "Velachery",
      "OMR",
      "Porur",
    ],
    landmarks: [
      ["Phoenix Marketcity", "Velachery"],
      ["Express Avenue", "T Nagar"],
      ["Besant Nagar Beach", "Adyar"],
    ],
    builders: [
      "Marina Homes",
      "Coromandel Living",
      "Bayfront Estates",
      "Pallava Spaces",
    ],
  },
  {
    name: "Madurai",
    center: [9.9252, 78.1198],
    localities: [
      "KK Nagar",
      "Anna Nagar",
      "Tallakulam",
      "Goripalayam",
      "Sellur",
      "Thirunagar",
    ],
    landmarks: [
      ["Meenakshi Temple", "Tallakulam"],
      ["Vilakkuthoon", "Goripalayam"],
      ["Race Course", "KK Nagar"],
    ],
    builders: [
      "Temple City Homes",
      "Vaigai Living",
      "Pandyan Estates",
      "Madura Spaces",
    ],
  },
  {
    name: "Trichy",
    center: [10.7905, 78.7047],
    localities: [
      "Cantonment",
      "Thillai Nagar",
      "Srirangam",
      "Woraiyur",
      "KK Nagar",
      "K.K. Nagar East",
    ],
    landmarks: [
      ["Rockfort Temple", "Woraiyur"],
      ["Srirangam Temple", "Srirangam"],
      ["Central Bus Stand", "Cantonment"],
    ],
    builders: [
      "Cauvery Homes",
      "Rockfort Living",
      "Kaveri Estates",
      "Trichy Spaces",
    ],
  },
  {
    name: "Hosur",
    center: [12.7409, 77.8253],
    localities: [
      "SIPCOT",
      "Bagalur Road",
      "Mathigiri",
      "Zuzuvadi",
      "Thorapalli",
      "Avalapalli",
    ],
    landmarks: [
      ["SIPCOT Industrial Park", "SIPCOT"],
      ["Bus Stand", "Bagalur Road"],
      ["Electronic City Road", "Zuzuvadi"],
    ],
    builders: [
      "Borderline Homes",
      "Hosur Living",
      "Sipcot Estates",
      "Hillgate Spaces",
    ],
  },
];

export const cityNames = cities.map((c) => c.name);

export const centers = Object.fromEntries(
  cities.map((c) => [c.name, c.center]),
);

export const featuredAreas = Object.fromEntries(
  cities.map((c) => [c.name, c.localities.slice(0, 5)]),
);

export const landmarkSuggestions = Object.fromEntries(
  cities.map((c) => [c.name, c.landmarks]),
);

export const sampleBuilders = Object.fromEntries(
  cities.map((c) => [c.name, c.builders]),
);

export const cityListLabel = cityNames.join(", ");
