import { StyleSheet, Text, View } from "react-native";

import { PlacePin } from "./PlacePin";
import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";
import { placeHasMappablePosition } from "../services/placesService";
import type { GeoPoint, NearbyPlace } from "../types/location";

/**
 * Web variant of the nearby map. react-native-maps is a native-only component
 * that throws (`codegenNativeComponent is not a function`) when evaluated under
 * react-native-web, so on web we deliberately never import it. The interactive
 * list below already offers call + directions actions; the native variant
 * (NearbyMapView.native.tsx) renders the real map on Android/iOS.
 */
type NearbyMapViewProps = {
  places: NearbyPlace[];
  userPosition: GeoPoint;
  selectedId?: string;
  onSelect?: (place: NearbyPlace) => void;
};

export function NearbyMapView({ places }: NearbyMapViewProps) {
  const colors = useThemeColors();
  const mappable = places.filter(placeHasMappablePosition);
  const hasMappable = mappable.length > 0;

  return (
    <View style={[styles.fallback, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <Text style={[styles.fallbackTitle, { color: colors.ink }]}>
        {hasMappable ? "Map view is mobile-only" : "No mappable places yet"}
      </Text>
      <Text style={[styles.fallbackText, { color: colors.muted }]}>
        {hasMappable
          ? "Open the list below to see nearby hospitals and blood banks with call and directions actions. The live map is available in the mobile app."
          : "Nearby places will appear on the map once they have coordinates."}
      </Text>
    </View>
  );
}

/**
 * Legend surface shared with the native variant, kept here so the web fallback
 * presents the same category key as the mobile map.
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
  fallback: { alignItems: "center", borderRadius: 16, borderWidth: 1, gap: spacing.sm, justifyContent: "center", minHeight: 200, padding: spacing.lg },
  fallbackTitle: { fontSize: 16, fontWeight: "800" },
  fallbackText: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  legend: { alignItems: "center", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  legendText: { fontSize: 12, fontWeight: "700" },
  legendSpacer: { width: spacing.md },
  legendHospital: { backgroundColor: "#2563EB", borderRadius: 5, height: 16, width: 16 },
});
