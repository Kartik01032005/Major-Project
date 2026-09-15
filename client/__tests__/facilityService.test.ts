import { calculateClientDistanceKm, facilityService } from "@/services/facilityService";
import { api } from "@/services/api";

jest.mock("@/services/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

describe("facilityService & distance calculations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global.fetch for OSM fallback tests
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("nominatim")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                osm_id: 101,
                name: "Apollo Hospital",
                display_name: "Apollo Hospital, Bannerghatta Road, Bengaluru, Karnataka",
                lat: "12.9016",
                lon: "77.5945",
                address: { city: "Bengaluru", state: "Karnataka", phone: "+91 80 2630 4050" },
              },
              {
                osm_id: 102,
                name: "Manipal Hospital",
                display_name: "Manipal Hospital, Old Airport Road, Bengaluru, Karnataka",
                lat: "12.9592",
                lon: "77.6493",
                address: { city: "Bengaluru", state: "Karnataka" },
              },
            ]),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calculates accurate Haversine distance between two coordinates", () => {
    // Distance between Bengaluru (12.9716, 77.5946) and Mysuru (12.2958, 76.6394) is ~128 km
    const dist = calculateClientDistanceKm(12.9716, 77.5946, 12.2958, 76.6394);
    expect(dist).toBeGreaterThan(120);
    expect(dist).toBeLessThan(140);
  });

  it("returns 0 distance for identical coordinates", () => {
    const dist = calculateClientDistanceKm(12.9716, 77.5946, 12.9716, 77.5946);
    expect(dist).toBe(0);
  });

  it("retrieves facilities from API when backend returns success", async () => {
    const mockApiResponse = {
      userPosition: { lat: 12.9716, lng: 77.5946 },
      radiusKm: 30,
      totalVisible: 2,
      counts: { hospitals: 1, bloodBanks: 1 },
      hospitals: [
        {
          id: "h-1",
          name: "Apollo Hospital",
          address: "Bannerghatta Road",
          district: "Bengaluru",
          state: "Karnataka",
          phone: "9999900001",
          position: { lat: 12.9016, lng: 77.5945 },
          distance: "2.4 km",
          distanceKm: 2.4,
          open: true,
        },
      ],
      bloodBanks: [
        {
          id: "bb-1",
          name: "Apollo Blood Bank",
          address: "Bannerghatta Road",
          district: "Bengaluru",
          state: "Karnataka",
          phone: "9999900002",
          position: { lat: 12.9016, lng: 77.5945 },
          distance: "2.4 km",
          distanceKm: 2.4,
          available: ["A+", "O+"],
          open: true,
        },
      ],
    };

    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: mockApiResponse },
    });

    const data = await facilityService.getNearbyFacilities({
      lat: 12.9716,
      lng: 77.5946,
      radiusKm: 30,
      type: "all",
    });

    expect(data.hospitals).toHaveLength(1);
    expect(data.bloodBanks).toHaveLength(1);
    expect(data.counts.hospitals).toBe(1);
    expect(data.counts.bloodBanks).toBe(1);
  });

  it("gracefully falls back to live OSM geo-calculations if API call fails", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error("Network connection failed"));

    const data = await facilityService.getNearbyFacilities({
      lat: 12.9716,
      lng: 77.5946,
      radiusKm: 30,
      type: "all",
    });

    expect(data).toBeDefined();
    expect(data.hospitals.length).toBeGreaterThan(0);

    for (const h of data.hospitals) {
      expect(h.distanceKm).toBeLessThanOrEqual(30);
    }
  });

  it("filters facilities by type in fallback mode", async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error("Network connection failed"));

    const hospitalsOnly = await facilityService.getNearbyFacilities({
      lat: 12.9716,
      lng: 77.5946,
      radiusKm: 30,
      type: "hospitals",
    });
    expect(hospitalsOnly.hospitals.length).toBeGreaterThan(0);
    expect(hospitalsOnly.bloodBanks).toHaveLength(0);
  });

  it("filters facilities by search term in fallback mode", async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error("Network connection failed"));

    const searchRes = await facilityService.getNearbyFacilities({
      lat: 12.9716,
      lng: 77.5946,
      radiusKm: 30,
      search: "Apollo",
    });
    expect(searchRes.hospitals.length).toBeGreaterThan(0);
    for (const item of searchRes.hospitals) {
      expect(item.name.toLowerCase()).toContain("apollo");
    }
  });
});
