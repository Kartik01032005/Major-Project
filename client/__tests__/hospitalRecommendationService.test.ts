import {
  calculateDistanceKm,
  formatDistanceString,
  fetchNearbyHospitalsOverpass,
  searchHospitalsNominatim,
} from "@/services/hospitalRecommendationService";

describe("hospitalRecommendationService", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("calculateDistanceKm", () => {
    it("calculates accurate Haversine distance between two coordinates", () => {
      // Mangaluru (12.9141, 74.8560) to KMC Hospital Dr B R Ambedkar Circle (~12.871, 74.845) is ~5 km
      const dist = calculateDistanceKm(12.9141, 74.8560, 12.871, 74.845);
      expect(dist).toBeGreaterThan(4);
      expect(dist).toBeLessThan(6);
    });

    it("returns 0 for identical coordinates", () => {
      const dist = calculateDistanceKm(12.9141, 74.8560, 12.9141, 74.8560);
      expect(dist).toBe(0);
    });
  });

  describe("formatDistanceString", () => {
    it("formats small distances under 100 meters", () => {
      expect(formatDistanceString(0.05)).toBe("< 100 m");
    });

    it("formats distances between 100m and 1000m in meters", () => {
      expect(formatDistanceString(0.65)).toBe("650 m");
    });

    it("formats distances >= 1km in kilometers with one decimal", () => {
      expect(formatDistanceString(3.24)).toBe("3.2 km");
      expect(formatDistanceString(10.0)).toBe("10.0 km");
    });
  });

  describe("fetchNearbyHospitalsOverpass", () => {
    it("fetches, parses, and sorts nearby hospitals from Overpass response by distance", async () => {
      // Mock Overpass response
      const mockOverpassData = {
        elements: [
          {
            type: "way",
            id: 201,
            center: { lat: 12.868, lon: 74.858 }, // ~5.1 km away
            tags: {
              name: "Father Muller Medical College Hospital",
              "addr:street": "Father Muller Road",
              "addr:suburb": "Kankanady",
              "addr:city": "Mangaluru",
              "addr:state": "Karnataka",
            },
          },
          {
            type: "node",
            id: 101,
            lat: 12.890, // ~2.8 km away (closer)
            lon: 74.845,
            tags: {
              name: "City Hospital Mangalore",
              "addr:street": "Kadri",
              "addr:city": "Mangaluru",
            },
          },
          {
            type: "node",
            id: 301,
            lat: 12.850,
            lon: 74.840,
            tags: {}, // Missing name, should be filtered out
          },
        ],
      };

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes("overpass")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockOverpassData),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      }) as unknown as typeof fetch;

      // User in Mangaluru (12.9141, 74.8560)
      const hospitals = await fetchNearbyHospitalsOverpass(12.9141, 74.8560, 10000);

      expect(hospitals.length).toBe(2);
      // Nearest hospital should appear first
      expect(hospitals[0].name).toBe("City Hospital Mangalore");
      expect(hospitals[0].distanceKm).toBeLessThan(hospitals[1].distanceKm);
      expect(hospitals[1].name).toBe("Father Muller Medical College Hospital");
      expect(hospitals[1].address).toContain("Kankanady");
      expect(hospitals[1].cityOrArea).toBe("Mangaluru");
    });

    it("falls back to Nominatim live OSM query if Overpass fails", async () => {
      const mockNominatimData = [
        {
          place_id: 888,
          osm_id: 999,
          osm_type: "way",
          name: "Sirsi General Hospital",
          display_name: "Sirsi General Hospital, Sirsi, Uttara Kannada, Karnataka",
          lat: "14.6200",
          lon: "74.8360",
          address: {
            town: "Sirsi",
            county: "Uttara Kannada",
            state: "Karnataka",
          },
        },
      ];

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes("overpass")) {
          return Promise.resolve({
            ok: false,
            status: 504,
          });
        }
        if (url.includes("nominatim")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockNominatimData),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      }) as unknown as typeof fetch;

      // User in Sirsi
      const hospitals = await fetchNearbyHospitalsOverpass(14.6195, 74.8354, 10000);

      expect(hospitals.length).toBe(1);
      expect(hospitals[0].name).toBe("Sirsi General Hospital");
      expect(hospitals[0].cityOrArea).toBe("Sirsi");
      expect(hospitals[0].source).toBe("nominatim");
    });
  });

  describe("searchHospitalsNominatim", () => {
    it("searches broader hospital locations across OSM when typed", async () => {
      const mockResults = [
        {
          place_id: 111,
          osm_id: 222,
          osm_type: "way",
          name: "KMC Hospital Mangaluru",
          display_name: "KMC Hospital, Ambedkar Circle, Mangaluru, Karnataka",
          lat: "12.8710",
          lon: "74.8450",
          address: { city: "Mangaluru", state: "Karnataka" },
        },
      ];

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes("nominatim")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResults),
          });
        }
        return Promise.reject(new Error("Unknown URL"));
      }) as unknown as typeof fetch;

      const userGps = { latitude: 12.9141, longitude: 74.8560, accuracy: 15 };
      const results = await searchHospitalsNominatim("KMC", userGps);

      expect(results.length).toBe(1);
      expect(results[0].name).toBe("KMC Hospital Mangaluru");
      expect(results[0].distanceKm).toBeGreaterThan(0);
      expect(results[0].formattedDistance).toBeTruthy();
    });
  });
});
