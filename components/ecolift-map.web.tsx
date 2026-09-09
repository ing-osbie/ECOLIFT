/** Web OpenStreetMap component for EcoLift. */

import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { MapPin } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  type?: "user" | "collector" | "destination";
  draggable?: boolean;
  isHighlighted?: boolean;
}

export interface EcoliftMapProps {
  markers?: MapMarker[];
  routeCoordinates?: { latitude: number; longitude: number }[];
  style?: any;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerDragEnd?: (
    markerId: string,
    coords: { latitude: number; longitude: number },
  ) => void;
  showUserLocation?: boolean;
}

export const EcoliftMap: React.FC<EcoliftMapProps> = ({
  markers = [],
  routeCoordinates = [],
  style,
  onMapPress,
  onMarkerDragEnd,
  showUserLocation = true,
}) => {
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const primaryMarker = markers[0] || { latitude: 5.5593, longitude: -0.1974 };
  const delta = 0.025;
  const bbox = `${primaryMarker.longitude - delta},${primaryMarker.latitude - delta},${primaryMarker.longitude + delta},${primaryMarker.latitude + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${primaryMarker.latitude},${primaryMarker.longitude}`;

  return (
    <View
      style={[
        styles.container,
        style,
        { backgroundColor: isDarkMode ? "#1C1C1E" : "#E8F3EE" },
      ]}
    >
      {/* OpenStreetMap embed on web */}
      <iframe
        title="OpenStreetMap"
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: 16 }}
        loading="lazy"
        allowFullScreen
        src={embedUrl}
      />

      {/* Interactive Pin Legend Overlay */}
      {markers.length > 0 && (
        <View style={styles.pinsOverlay}>
          {markers.map((m) => (
            <View
              key={m.id}
              style={[
                styles.webPin,
                {
                  backgroundColor:
                    m.type === "collector"
                      ? C.primary
                      : m.type === "destination"
                        ? Colors.danger
                        : "#3B82F6",
                },
              ]}
            >
              <MapPin size={12} color="#FFFFFF" />
              <Text style={styles.webPinText} numberOfLines={1}>
                {m.title || "Marker"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 16,
    position: "relative",
  },
  pinsOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "column",
    gap: 6,
    maxWidth: "60%",
  },
  webPin: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  webPinText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
    fontSize: 10,
  },
});
