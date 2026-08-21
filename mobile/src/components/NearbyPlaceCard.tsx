import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "./ActionButton";
import { spacing } from "../theme/spacing";
import { useThemeColors } from "../theme/useThemeColors";
import { formatDistance } from "../utils/distance";
import { callPlace, openDirections } from "../utils/mapLinking";
import type { NearbyPlace } from "../types/location";

type NearbyPlaceCardProps = {
  place: NearbyPlace;
  /** Highlight the row when its marker is selected on the map. */
  selected?: boolean;
  onSelect?: (place: NearbyPlace) => void;
};

const CATEGORY_LABEL: Record<NearbyPlace["category"], string> = {
  bloodBank: "Blood bank",
  hospital: "Hospital",
};

export function NearbyPlaceCard({ place, selected, onSelect }: NearbyPlaceCardProps) {
  const colors = useThemeColors();
  const isBank = place.category === "bloodBank";

  const handleCall = () => void callPlace(place.phone);
  const handleNavigate = () => void openDirections(place);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: selected ? colors.accent : colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: isBank ? colors.accent : "#2563EB" }]}>
          <Text style={styles.badgeText}>{CATEGORY_LABEL[place.category]}</Text>
        </View>
        {place.source === "sample" ? (
          <View style={[styles.sampleTag, { borderColor: colors.border }]}>
            <Text style={[styles.sampleText, { color: colors.muted }]}>Sample</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.name, { color: colors.ink }]}>{place.name}</Text>
      <Text style={[styles.address, { color: colors.muted }]} numberOfLines={2}>
        {place.address} · {place.district}, {place.state}
      </Text>

      {place.distanceKm !== undefined ? (
        <Text style={[styles.distance, { color: colors.accent }]}>{formatDistance(place.distanceKm)} away</Text>
      ) : (
        <Text style={[styles.distance, { color: colors.muted }]}>Distance unavailable</Text>
      )}

      <View style={styles.actions}>
        <ActionButton label="Navigate" variant="primary" onPress={handleNavigate} accessibilityLabel={`Navigate to ${place.name}`} />
        <ActionButton label="Call" variant="outline" onPress={handleCall} accessibilityLabel={`Call ${place.name}`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    elevation: 1,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  sampleTag: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  sampleText: { fontSize: 10, fontWeight: "700" },
  name: { fontSize: 16, fontWeight: "800" },
  address: { fontSize: 13, lineHeight: 19 },
  distance: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
});
