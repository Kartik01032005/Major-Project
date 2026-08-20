import { Alert, Linking, Platform } from "react-native";

import type { NearbyPlace } from "../types/location";

const buildNameQuery = (place: NearbyPlace): string =>
  encodeURIComponent(`${place.name}, ${place.address}, ${place.district}, ${place.state}`);

const buildDestinationUrl = (place: NearbyPlace): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${buildNameQuery(place)}`;

const buildCoordinatesUrl = (place: NearbyPlace): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${place.position.latitude},${place.position.longitude}`;

/**
 * Opens turn-by-turn navigation to the given place. Prefers coordinates when the
 * place has mappable ones, falling back to a name/address query. Delegates to the
 * device's maps app via the OS; never embeds or requires an API key.
 */
export async function openDirections(place: NearbyPlace): Promise<void> {
  const hasCoords = place.position.latitude !== 0 && place.position.longitude !== 0;
  const url = hasCoords ? buildCoordinatesUrl(place) : buildDestinationUrl(place);
  await openExternalUrl(url, "Could not open maps for directions.");
}

/** Opens the device dialer pre-filled with the place's contact number. */
export async function callPlace(phone: string): Promise<void> {
  const trimmed = phone.trim();
  if (!trimmed) {
    Alert.alert("No contact number", "This place does not list a phone number.");
    return;
  }
  await openExternalUrl(`tel:${trimmed}`, "Could not open the dialer.");
}

async function openExternalUrl(url: string, fallbackMessage: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Not supported", Platform.OS === "android" ? "No app available to handle this link." : fallbackMessage);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert("Something went wrong", fallbackMessage);
  }
}
