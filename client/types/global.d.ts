// Global type declarations for window augmentations
declare global {
  interface Window {
    __gmapsLoaded?: () => void;
  }
}

export {};
