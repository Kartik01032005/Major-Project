// Global type declarations for external scripts loaded via <script> tags.
// Google Maps JS API is loaded dynamically — this provides minimal TypeScript
// coverage without requiring the @types/google.maps npm package.

declare global {
  interface Window {
    google: {
      maps: {
        Map: new (el: HTMLElement, opts?: object) => GoogleMapInstance;
        Marker: new (opts?: object) => GoogleMarkerInstance;
        InfoWindow: new (opts?: object) => GoogleInfoWindowInstance;
        LatLng: new (lat: number, lng: number) => object;
        LatLngBounds: new () => GoogleBoundsInstance;
        Size: new (w: number, h: number) => object;
        Point: new (x: number, y: number) => object;
        Animation: { DROP: number; BOUNCE: number };
        event: {
          addListener: (instance: object, event: string, handler: () => void) => object;
          removeListener: (listener: object) => void;
          clearInstanceListeners: (instance: object) => void;
        };
      };
    };
    __gmapsLoaded?: () => void;
  }

  interface GoogleMapInstance {
    setCenter: (latlng: object) => void;
    setZoom: (zoom: number) => void;
    panTo: (latlng: object) => void;
    fitBounds: (bounds: object) => void;
    addListener: (event: string, handler: () => void) => object;
  }

  interface GoogleMarkerInstance {
    setMap: (map: GoogleMapInstance | null) => void;
    setPosition: (latlng: object) => void;
    addListener: (event: string, handler: () => void) => object;
    getPosition: () => { lat: () => number; lng: () => number };
  }

  interface GoogleInfoWindowInstance {
    open: (map: GoogleMapInstance, marker?: GoogleMarkerInstance) => void;
    close: () => void;
    setContent: (content: string | HTMLElement) => void;
  }

  interface GoogleBoundsInstance {
    extend: (latlng: object) => void;
    isEmpty: () => boolean;
  }
}

export {};
