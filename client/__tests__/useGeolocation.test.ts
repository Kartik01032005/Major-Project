import { renderHook, act } from "@testing-library/react";
import { useGeolocation } from "@/hooks/useGeolocation";

describe("useGeolocation Hook", () => {
  const originalGeolocation = navigator.geolocation;

  afterEach(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
      writable: true,
    });
    jest.clearAllMocks();
  });

  it("starts with null position and does NOT use default Bengaluru coordinates", () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.position).toBeNull();
    expect(result.current.isUsingDefault).toBe(false);
    expect(result.current.accuracy).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe("function");
  });

  it("updates position and accuracy upon successful GPS acquisition", () => {
    const mockGetCurrentPosition = jest.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 14.6195,
          longitude: 74.8354,
          accuracy: 15.2,
        },
        timestamp: 1700000000000,
      });
    });

    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.refetch();
    });

    expect(mockGetCurrentPosition).toHaveBeenCalled();
    expect(result.current.position).toEqual({ lat: 14.6195, lng: 74.8354 });
    expect(result.current.accuracy).toBe(15.2);
    expect(result.current.isUsingDefault).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.permissionState).toBe("granted");
  });

  it("handles PERMISSION_DENIED error correctly without fallback", () => {
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
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.refetch();
    });

    expect(result.current.position).toBeNull();
    expect(result.current.isUsingDefault).toBe(false);
    expect(result.current.accuracy).toBeNull();
    expect(result.current.permissionState).toBe("denied");
    expect(result.current.error).toMatch(/denied/i);
  });

  it("handles TIMEOUT and POSITION_UNAVAILABLE errors without fallback", () => {
    const mockGetCurrentPosition = jest.fn().mockImplementation((_success, error) => {
      error({
        code: 3, // TIMEOUT
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: "Timeout",
      });
    });

    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.refetch();
    });

    expect(result.current.position).toBeNull();
    expect(result.current.isUsingDefault).toBe(false);
    expect(result.current.error).toMatch(/timed out/i);
  });

  it("detects when browser does not support geolocation", () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.refetch();
    });

    expect(result.current.position).toBeNull();
    expect(result.current.error).toMatch(/not supported/i);
    expect(result.current.permissionState).toBe("unsupported");
    expect(result.current.isUsingDefault).toBe(false);
  });
});
