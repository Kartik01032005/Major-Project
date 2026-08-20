import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppScreen, SectionTitle, Surface } from "../../src/components/AppScreen";
import { NearbyMapView, MapLegend } from "../../src/components/NearbyMapView";
import { NearbyPlaceCard } from "../../src/components/NearbyPlaceCard";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useGeolocation } from "../../src/hooks/useGeolocation";
import { annotateAndSortByDistance, placeHasMappablePosition, placesService } from "../../src/services/placesService";
import { spacing } from "../../src/theme/spacing";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { getApiErrorMessage } from "../../src/utils/apiError";
import type { NearbyCategory, NearbyPlace } from "../../src/types/location";

type PlaceFilter = "all" | NearbyCategory;

const FILTERS: { key: PlaceFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "hospital", label: "Hospitals" },
  { key: "bloodBank", label: "Blood banks" },
];

export default function NearbyScreen() {
  const colors = useThemeColors();
  const geo = useGeolocation();
  const [hospitals, setHospitals] = useState<NearbyPlace[]>([]);
  const [hospitalsError, setHospitalsError] = useState<string | null>(null);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [filter, setFilter] = useState<PlaceFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  // Stays true while mounted so async callbacks can avoid setState-after-unmount.
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadHospitals = useCallback(async () => {
    setHospitalsLoading(true);
    try {
      const items = await placesService.listHospitals();
      if (isMounted.current) setHospitals(items);
    } catch (requestError: unknown) {
      if (isMounted.current) setHospitalsError(getApiErrorMessage(requestError));
    } finally {
      if (isMounted.current) setHospitalsLoading(false);
    }
  }, []);

  // Fetch live hospitals on mount. `hospitalsLoading` already starts true, so the
  // effect body needs no synchronous state write; setState happens only inside the
  // async fetch callbacks (guarded by `isMounted`).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHospitals();
  }, [loadHospitals]);

  const sampleBloodBanks = useMemo(() => placesService.listSampleBloodBanks(), []);

  // Combine real hospitals + clearly-separate sample blood banks, then annotate distance.
  const allPlaces = useMemo(() => {
    const combined = [...hospitals, ...sampleBloodBanks];
    return annotateAndSortByDistance(combined, geo.position);
  }, [hospitals, sampleBloodBanks, geo.position]);

  const visiblePlaces = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    return allPlaces.filter((place) => {
      if (filter !== "all" && place.category !== filter) return false;
      if (!loweredQuery) return true;
      return (
        place.name.toLowerCase().includes(loweredQuery) ||
        place.district.toLowerCase().includes(loweredQuery) ||
        place.address.toLowerCase().includes(loweredQuery)
      );
    });
  }, [allPlaces, filter, query]);

  const permissionDenied = geo.status === "denied";
  const networkFailed = hospitalsError !== null && hospitals.length === 0;
  const stillLoading = hospitalsLoading && hospitals.length === 0;

  const renderBody = () => {
    if (stillLoading) {
      return <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />;
    }
    if (networkFailed) {
      return (
        <Surface>
          <Text style={[styles.message, { color: colors.warning }]}>{hospitalsError}</Text>
          <PrimaryButton
            label="Retry"
            onPress={() => {
              setHospitalsError(null);
              setHospitalsLoading(true);
              void loadHospitals();
            }}
          />
        </Surface>
      );
    }
    if (visiblePlaces.length === 0) {
      return (
        <Surface>
          <Text style={[styles.message, { color: colors.muted }]}>
            No places match your search. Try a different filter or keyword.
          </Text>
        </Surface>
      );
    }
    return visiblePlaces.map((place) => (
      <NearbyPlaceCard
        key={place._id}
        place={place}
        selected={selectedId === place._id}
        onSelect={(selected) => setSelectedId(selected._id)}
      />
    ));
  };

  return (
    <AppScreen title="Nearby" subtitle="Hospitals and blood banks around your current location.">
      {/* Location status banner */}
      {permissionDenied || geo.status === "error" || geo.status === "unavailable" ? (
        <Surface style={styles.banner}>
          <Text style={[styles.bannerText, { color: colors.warning }]}>
            {geo.error ?? "Unable to determine your location."}
          </Text>
          <Pressable onPress={() => void geo.refetch()}>
            <Text style={[styles.bannerAction, { color: colors.accent }]}>Retry location</Text>
          </Pressable>
        </Surface>
      ) : null}

      {geo.status === "loading" ? (
        <View style={styles.geoRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[styles.geoText, { color: colors.muted }]}>Finding your location…</Text>
        </View>
      ) : null}

      {!permissionDenied && visiblePlaces.some(placeHasMappablePosition) ? (
        <View style={styles.mapBlock}>
          <NearbyMapView
            places={visiblePlaces}
            userPosition={geo.position}
            selectedId={selectedId}
            onSelect={(selected) => setSelectedId(selected._id)}
          />
          <View style={styles.legend}>
            <MapLegend />
          </View>
        </View>
      ) : null}

      {/* Search + category filter */}
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Search nearby places"
          placeholder="Search by name, district or address"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
        />
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map((option) => (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === option.key }}
            onPress={() => setFilter(option.key)}
            style={[
              styles.chip,
              {
                backgroundColor: filter === option.key ? colors.accent : colors.surface,
                borderColor: filter === option.key ? colors.accent : colors.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: filter === option.key ? colors.surface : colors.ink }]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Results</SectionTitle>
      {renderBody()}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  message: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  banner: { gap: spacing.sm },
  bannerText: { fontSize: 13, lineHeight: 19 },
  bannerAction: { fontSize: 13, fontWeight: "800" },
  geoRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  geoText: { fontSize: 13 },
  mapBlock: { marginTop: spacing.lg },
  legend: { alignItems: "center", marginTop: spacing.sm },
  searchRow: { marginTop: spacing.lg },
  search: { borderRadius: 12, borderWidth: 1, fontSize: 15, minHeight: 48, paddingHorizontal: spacing.md },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipText: { fontSize: 13, fontWeight: "800" },
});
