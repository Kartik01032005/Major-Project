import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";

import { PlacePin } from "./PlacePin";
import { env } from "../config/env";
import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";
import { placeHasMappablePosition } from "../services/placesService";
import type { GeoPoint, NearbyPlace } from "../types/location";

type NearbyMapViewProps = {
  places: NearbyPlace[];
  userPosition: GeoPoint;
  selectedId?: string;
  onSelect?: (place: NearbyPlace) => void;
};

const FALLBACK_LOCATION: GeoPoint = { latitude: 12.9716, longitude: 77.5946 };

/** True only on native platforms where react-native-maps renders tiles. */
const isMapSupported = Platform.OS !== "web";
/** Whether a Google Maps Android API key was configured for standalone builds. */
const hasAndroidApiKey = env.googleMapsAndroidApiKey.length > 0;

export function NearbyMapView({ places, userPosition, selectedId, onSelect }: NearbyMapViewProps) {
  const colors = useThemeColors();
  const mappable = places.filter(placeHasMappablePosition);

  if (!isMapSupported || mappable.length === 0) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Text style={[styles.fallbackTitle, { color: colors.ink }]}>
          {isMapSupported ? "No mappable places yet" : "Map unavailable on this platform"}
        </Text>
        <Text style={[styles.fallbackText, { color: colors.muted }]}>
          {isMapSupported
            ? "Nearby places will appear on the map once they have coordinates."
            : "Open the list below to see nearby hospitals and blood banks with call and directions actions."}
        </Text>
      </View>
    );
  }

  const center = userPosition ?? FALLBACK_LOCATION;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation
      provider={hasAndroidApiKey ? "google" : undefined}
    >
      {mappable.map((place) => (
        <Marker
          key={place._id}
          coordinate={{ latitude: place.position.latitude, longitude: place.position.longitude }}
          pinColor={place.category === "bloodBank" ? colors.accent : "#2563EB"}
        >
          <Callout
            onPress={() => {
              onSelect?.(place);
            }}
          >
            <View style={[styles.callout, { backgroundColor: colors.surface }]}>
              <Text style={[styles.calloutName, { color: colors.ink }]}>{place.name}</Text>
              <Text style={[styles.calloutAddress, { color: colors.muted }]} numberOfLines={2}>
                {place.address} · {place.district}
              </Text>
              {selectedId === place._id ? (
                <Text style={[styles.calloutSelected, { color: colors.accent }]}>Selected</Text>
              ) : null}
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

/**
 * Small legend chip surface rendered above the map to flag sample data, kept
 * separate so the map stays focused on rendering.
 */
export function MapLegend() {
  const colors = useThemeColors();
  return (
    <View style={[styles.legend, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <PlacePin category="bloodBank" />
      <Text style={[styles.legendText, { color: colors.muted }]}>Blood bank</Text>
      <View style={styles.legendSpacer} />
      <View style={styles.legendHospital} />
      <Text style={[styles.legendText, { color: colors.muted }]}>Hospital</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: 16, minHeight: 260, overflow: "hidden", width: "100%" },
  fallback: { alignItems: "center", borderRadius: 16, borderWidth: 1, gap: spacing.sm, justifyContent: "center", minHeight: 200, padding: spacing.lg },
  fallbackTitle: { fontSize: 16, fontWeight: "800" },
  fallbackText: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  callout: { maxWidth: 220, padding: spacing.sm },
  calloutName: { fontSize: 14, fontWeight: "800" },
  calloutAddress: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  calloutSelected: { fontSize: 11, fontWeight: "800", marginTop: 4, textTransform: "uppercase" },
  legend: { alignItems: "center", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  legendText: { fontSize: 12, fontWeight: "700" },
  legendSpacer: { width: spacing.md },
  legendHospital: { backgroundColor: "#2563EB", borderRadius: 5, height: 16, width: 16 },
});
