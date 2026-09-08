import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import * as Location from "expo-location";
import { MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  type?: "user" | "collector" | "destination";
  draggable?: boolean;
}

export interface EcoliftMapProps {
  markers?: MapMarker[];
  routeCoordinates?: { latitude: number; longitude: number }[];
  style?: any;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerDragEnd?: (markerId: string, coords: { latitude: number; longitude: number }) => void;
  showUserLocation?: boolean;
}

// Native OpenStreetMap tile implementation using react-native-maps.
// Bundled only on Android/iOS via the `.native.tsx` platform extension.
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
  const mapRef = React.useRef<MapView>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(loc);
        } else {
          await Location.requestForegroundPermissionsAsync();
        }
      } catch {
        // Suppress errors to ensure map always renders
      }
    })();
  }, []);

  // Whenever markers change, smoothly animate camera to focus on new global coordinates
  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;

    if (markers.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: markers[0].latitude,
          longitude: markers[0].longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        700,
      );
    } else if (markers.length > 1) {
      mapRef.current.fitToCoordinates(
        markers.map((m) => ({
          latitude: m.latitude,
          longitude: m.longitude,
        })),
        {
          edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
          animated: true,
        },
      );
    }
  }, [markers]);

  const fallbackLatitude = markers[0]?.latitude || 5.5593;
  const fallbackLongitude = markers[0]?.longitude || -0.1974;

  const initialRegion = {
    latitude: markers[0]?.latitude || (location ? location.coords.latitude : fallbackLatitude),
    longitude: markers[0]?.longitude || (location ? location.coords.longitude : fallbackLongitude),
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="none"
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        onPress={(e) => {
          if (onMapPress) {
            onMapPress(e.nativeEvent.coordinate);
          }
        }}
        onLongPress={(e) => {
          if (onMapPress) {
            onMapPress(e.nativeEvent.coordinate);
          }
        }}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            draggable={marker.draggable ?? false}
            onDragEnd={(e) => {
              if (onMarkerDragEnd) {
                onMarkerDragEnd(marker.id, e.nativeEvent.coordinate);
              }
            }}
          >
            <View
              style={[
                styles.markerContainer,
                marker.type === "collector"
                  ? { backgroundColor: C.primary }
                  : marker.type === "destination"
                    ? { backgroundColor: Colors.danger }
                    : { backgroundColor: "#3B82F6" },
              ]}
            >
              <MapPin size={16} color="#FFFFFF" />
            </View>
          </Marker>
        ))}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor={C.primary}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  markerContainer: {
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

