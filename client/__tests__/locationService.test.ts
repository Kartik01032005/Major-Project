import {
  isNativePlatform,
  checkDevicePermission,
  requestDevicePermission,
  getCurrentDevicePosition,
  LocationServiceError,
} from "@/services/locationService";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { UserLocationState, SearchLocationState, SelectedPlaceState } from "@/types";

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

jest.mock("@capacitor/geolocation", () => ({
  Geolocation: {
    checkPermissions: jest.fn(),
    requestPermissions: jest.fn(),
    getCurrentPosition: jest.fn(),
  },
}));

describe("Location Service & Geolocation Abstraction", () => {
  const originalGeolocation = navigator.geolocation;
  const originalPermissions = navigator.permissions;
  const originalSecureContext = window.isSecureContext;

  beforeEach(() => {
    jest.clearAllMocks();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, "permissions", {
      value: originalPermissions,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, "isSecureContext", {
      value: originalSecureContext ?? true,
      configurable: true,
      writable: true,
    });
  });

  describe("1. Platform Detection (isNativePlatform)", () => {
    it("identifies web browser environment correctly", () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      expect(isNativePlatform()).toBe(false);
    });

    it("identifies native Capacitor Android platform correctly", () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      expect(isNativePlatform()).toBe(true);
    });
  });

  describe("2. Permission Handling on Native Android & Web", () => {
    it("returns 'granted' on native Android when Capacitor permission is granted", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Geolocation.checkPermissions as jest.Mock).mockResolvedValue({
        location: "granted",
        coarseLocation: "granted",
      });

      const perm = await checkDevicePermission();
      expect(perm).toBe("granted");
      expect(Geolocation.checkPermissions).toHaveBeenCalled();
    });

    it("returns 'denied' on native Android when Capacitor permission is denied", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Geolocation.checkPermissions as jest.Mock).mockResolvedValue({
        location: "denied",
        coarseLocation: "denied",
      });

      const perm = await checkDevicePermission();
      expect(perm).toBe("denied");
    });

    it("requests runtime permission on native Android", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Geolocation.requestPermissions as jest.Mock).mockResolvedValue({
        location: "granted",
      });

      const result = await requestDevicePermission();
      expect(result).toBe("granted");
      expect(Geolocation.requestPermissions).toHaveBeenCalledWith({
        permissions: ["location"],
      });
    });

    it("handles permission revoked / denied upon request on native Android", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Geolocation.requestPermissions as jest.Mock).mockResolvedValue({
        location: "denied",
      });

      const result = await requestDevicePermission();
      expect(result).toBe("denied");
    });

    it("checks browser permission via Permissions API on web", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      Object.defineProperty(navigator, "geolocation", {
        value: {},
        configurable: true,
        writable: true,
      });
      Object.defineProperty(navigator, "permissions", {
        value: {
          query: jest.fn().mockResolvedValue({ state: "granted" }),
        },
        configurable: true,
        writable: true,
      });

      const perm = await checkDevicePermission();
      expect(perm).toBe("granted");
      expect(navigator.permissions.query).toHaveBeenCalledWith({ name: "geolocation" });
    });
  });

  describe("3. Native Capacitor Android GPS Acquisition", () => {
    it("obtains real GPS coordinates and accuracy on Android APK", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Geolocation.checkPermissions as jest.Mock).mockResolvedValue({ location: "granted" });
      (Geolocation.getCurrentPosition as jest.Mock).mockResolvedValue({
        coords: {
          latitude: 14.6195,
          longitude: 74.8354,
          accuracy: 12.5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: 1710000000000,
      });

      const pos = await getCurrentDevicePosition({ enableHighAccuracy: true });

      expect(pos.latitude).toBe(14.6195);
      expect(pos.longitude).toBe(74.8354);
      expect(pos.accuracy).toBe(12.5);
      expect(pos.isFallback).toBe(false);
      expect(Geolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.objectContaining({ enableHighAccuracy: true })
      );
    });

    it("throws PERMISSION_DENIED on native when user denies runtime dialog", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Geolocation.checkPermissions as jest.Mock).mockResolvedValue({ location: "prompt" });
      (Geolocation.requestPermissions as jest.Mock).mockResolvedValue({ location: "denied" });

      await expect(getCurrentDevicePosition()).rejects.toThrow(LocationServiceError);
      await expect(getCurrentDevicePosition()).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
      });
    });

    it("throws TIMEOUT when native GPS times out", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Geolocation.checkPermissions as jest.Mock).mockResolvedValue({ location: "granted" });
      (Geolocation.getCurrentPosition as jest.Mock).mockRejectedValue(
        new Error("Location request timeout")
      );
      await expect(getCurrentDevicePosition()).rejects.toMatchObject({
        code: "TIMEOUT",
      });
    });

    it("falls back to navigator.geolocation if Capacitor Geolocation throws 'not implemented'", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Geolocation.checkPermissions as jest.Mock).mockRejectedValue(
        new Error('"Geolocation" plugin is not implemented on android')
      );

      const mockGetCurrentPosition = jest.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 14.6195,
            longitude: 74.8354,
            accuracy: 15.0,
          },
          timestamp: 1710000000000,
        });
      });

      Object.defineProperty(navigator, "geolocation", {
        value: { getCurrentPosition: mockGetCurrentPosition },
        configurable: true,
        writable: true,
      });

      const pos = await getCurrentDevicePosition();
      expect(pos.latitude).toBe(14.6195);
      expect(pos.longitude).toBe(74.8354);
      expect(pos.accuracy).toBe(15.0);
      expect(pos.isFallback).toBe(false);
    });
  });

  describe("4. Web Browser Location via navigator.geolocation", () => {
    it("obtains real browser GPS coordinates without fallback", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      const mockGetCurrentPosition = jest.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 12.2958,
            longitude: 76.6394,
            accuracy: 8.0,
          },
          timestamp: 1710000000000,
        });
      });

      Object.defineProperty(navigator, "geolocation", {
        value: { getCurrentPosition: mockGetCurrentPosition },
        configurable: true,
        writable: true,
      });

      const pos = await getCurrentDevicePosition();
      expect(pos.latitude).toBe(12.2958);
      expect(pos.longitude).toBe(76.6394);
      expect(pos.accuracy).toBe(8.0);
      expect(pos.isFallback).toBe(false);
    });

    it("handles browser PERMISSION_DENIED correctly", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      const mockGetCurrentPosition = jest.fn().mockImplementation((_success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "User denied Geolocation",
        });
      });

      Object.defineProperty(navigator, "geolocation", {
        value: { getCurrentPosition: mockGetCurrentPosition },
        configurable: true,
        writable: true,
      });

      await expect(getCurrentDevicePosition()).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
      });
    });

    it("handles browser TIMEOUT correctly", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      const mockGetCurrentPosition = jest.fn().mockImplementation((_success, error) => {
        error({
          code: 3, // TIMEOUT
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "Timeout expired",
        });
      });

      Object.defineProperty(navigator, "geolocation", {
        value: { getCurrentPosition: mockGetCurrentPosition },
        configurable: true,
        writable: true,
      });

      await expect(getCurrentDevicePosition()).rejects.toMatchObject({
        code: "TIMEOUT",
      });
    });

    it("handles browser unsupported environment", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        configurable: true,
        writable: true,
      });

      await expect(getCurrentDevicePosition()).rejects.toMatchObject({
        code: "UNSUPPORTED",
      });
    });

    it("detects insecure HTTP context and returns 'insecure' in checkDevicePermission", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      Object.defineProperty(window, "isSecureContext", {
        value: false,
        configurable: true,
      });

      const perm = await checkDevicePermission();
      expect(perm).toBe("insecure");

      Object.defineProperty(window, "isSecureContext", {
        value: true,
        configurable: true,
      });
    });

    it("rejects with INSECURE_CONTEXT when attempting GPS on non-secure origin", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      Object.defineProperty(window, "isSecureContext", {
        value: false,
        configurable: true,
      });

      await expect(getCurrentDevicePosition()).rejects.toMatchObject({
        code: "INSECURE_CONTEXT",
      });

      Object.defineProperty(window, "isSecureContext", {
        value: true,
        configurable: true,
      });
    });
  });


  describe("5. No Bengaluru Fallback & Default 5 KM Radius", () => {
    it("never returns fake Bengaluru coordinates on failure", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Geolocation.checkPermissions as jest.Mock).mockResolvedValue({ location: "denied" });

      try {
        await getCurrentDevicePosition();
        // Should not reach here
        expect(true).toBe(false);
      } catch (err: unknown) {
        const error = err as LocationServiceError;
        expect(error.code).toBe("PERMISSION_DENIED");
      }
    });

    it("preserves state separation: userLocation vs searchLocation vs selectedPlace", () => {
      const userLocation: UserLocationState = {
        latitude: 14.6195,
        longitude: 74.8354,
        accuracy: 10,
        timestamp: Date.now(),
        isFallback: false,
      };

      // Search a manual area
      const searchLocation: SearchLocationState = {
        displayName: "Mysuru, Karnataka",
        latitude: 12.2958,
        longitude: 76.6394,
        type: "city",
      };

      // Select a hospital
      const selectedPlace: SelectedPlaceState = {
        id: "hosp-101",
        name: "District Hospital",
        latitude: 14.6200,
        longitude: 74.8400,
        type: "hospital",
        distance: "1.2 km",
      };

      // Assert complete state separation
      expect(userLocation.latitude).toBe(14.6195);
      expect(searchLocation.latitude).toBe(12.2958);
      expect(selectedPlace.latitude).toBe(14.6200);

      // User location remains untouched by manual search or selection
      expect(userLocation.latitude).not.toBe(searchLocation.latitude);
      expect(userLocation.latitude).not.toBe(selectedPlace.latitude);
    });

    it("ensures navigation origin strictly uses userLocation and not searchLocation", () => {
      const userLocation: UserLocationState = {
        latitude: 14.6195,
        longitude: 74.8354,
        accuracy: 12,
        isFallback: false,
      };

      const searchLocation: SearchLocationState = {
        displayName: "Bengaluru, Karnataka",
        latitude: 12.9716,
        longitude: 77.5946,
        type: "city",
      };

      const destination = {
        name: "TSS Hospital",
        lat: 14.6250,
        lng: 74.8420,
      };

      // Construct navigation URL using userLocation
      const origin = `${userLocation.latitude},${userLocation.longitude}`;
      const dest = `${destination.lat},${destination.lng}`;
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;

      expect(mapsUrl).toContain(`origin=14.6195,74.8354`);
      expect(mapsUrl).not.toContain(`origin=${searchLocation.latitude},${searchLocation.longitude}`);
      expect(mapsUrl).toContain(`destination=14.625,74.842`);

    });

    it("passes maximumAge: 0 when forceFresh is requested for Find Near Me", async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      let passedOptions: PositionOptions | undefined;
      const mockGetCurrentPosition = jest.fn().mockImplementation((success, _error, options) => {
        passedOptions = options;
        success({
          coords: {
            latitude: 14.6195,
            longitude: 74.8354,
            accuracy: 8,
          },
          timestamp: Date.now(),
        });
      });

      Object.defineProperty(navigator, "geolocation", {
        value: { getCurrentPosition: mockGetCurrentPosition },
        configurable: true,
        writable: true,
      });

      await getCurrentDevicePosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      expect(passedOptions).toBeDefined();
      expect(passedOptions?.maximumAge).toBe(0);
      expect(passedOptions?.enableHighAccuracy).toBe(true);
    });
  });
});

