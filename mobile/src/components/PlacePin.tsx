import { StyleSheet, View, type ViewStyle } from "react-native";

import { useThemeColors } from "../theme/useThemeColors";
import type { NearbyCategory } from "../types/location";

const PIN_HEIGHT = 36;
const PIN_WIDTH = 30;
const DOT_SIZE = 8;

/** Teardrop map/list pin coloured by category (red = blood bank, blue = hospital). */
export function PlacePin({ category }: { category: NearbyCategory }) {
  const colors = useThemeColors();
  const fill = category === "bloodBank" ? colors.accent : "#2563EB";

  return (
    <View style={styles.container}>
      <View style={[styles.teardrop, { backgroundColor: fill }]} />
      <View style={styles.dot} />
    </View>
  );
}

/** Concentric "you are here" dot for the user's location. */
export function UserLocationDot() {
  const colors = useThemeColors();
  return <View style={[styles.userDot, { borderColor: colors.surface }]} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: PIN_HEIGHT,
    justifyContent: "center",
    width: PIN_WIDTH,
  } as ViewStyle,
  teardrop: {
    borderBottomLeftRadius: PIN_WIDTH / 2,
    borderBottomRightRadius: PIN_WIDTH / 2,
    borderTopLeftRadius: PIN_WIDTH / 2,
    borderTopRightRadius: PIN_WIDTH / 2,
    height: PIN_HEIGHT,
    position: "absolute",
    top: 0,
    transform: [{ rotate: "45deg" }],
    width: PIN_WIDTH,
  } as ViewStyle,
  dot: {
    backgroundColor: "#FFFFFF",
    borderRadius: DOT_SIZE / 2,
    height: DOT_SIZE,
    width: DOT_SIZE,
    zIndex: 1,
  } as ViewStyle,
  userDot: {
    backgroundColor: "#3B82F6",
    borderColor: "#FFFFFF",
    borderRadius: 9,
    borderWidth: 3,
    height: 18,
    width: 18,
  } as ViewStyle,
});
