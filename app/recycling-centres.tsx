import { EcoliftMap } from "@/components/ecolift-map";
import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Recycle,
} from "lucide-react-native";
import { useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Centre {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  hours: string;
  types: string[];
  distance: string;
  lat: number;
  lng: number;
  isOpen: boolean;
}

const CENTRES: Centre[] = [
  {
    id: "c1",
    name: "Agbogbloshie Eco-Station #4",
    area: "Agbogbloshie, Accra",
    address: "Agbogbloshie Market Road, Accra",
    phone: "+233 30 222 4567",
    hours: "Mon–Sat: 7 AM – 6 PM",
    types: ["Metal", "E-Waste", "Plastic"],
    distance: "1.2 km",
    lat: 5.5448,
    lng: -0.2228,
    isOpen: true,
  },
  {
    id: "c2",
    name: "Tema Recycling Hub",
    area: "Tema, Greater Accra",
    address: "Community 1, Tema Industrial Area",
    phone: "+233 30 320 1122",
    hours: "Mon–Fri: 8 AM – 5 PM",
    types: ["Plastic", "Paper", "Glass"],
    distance: "18.4 km",
    lat: 5.6698,
    lng: -0.0166,
    isOpen: true,
  },
  {
    id: "c3",
    name: "Accra Compost & Recycling Plant",
    area: "Adjen Kotoku, Accra",
    address: "Adjen Kotoku, Ga West Municipal",
    phone: "+233 30 290 3344",
    hours: "Mon–Sat: 6 AM – 4 PM",
    types: ["Organic", "Paper", "Plastic"],
    distance: "22.1 km",
    lat: 5.6167,
    lng: -0.3167,
    isOpen: false,
  },
  {
    id: "c4",
    name: "Kpone Landfill Eco-Zone",
    area: "Kpone, Tema",
    address: "Kpone Barrier Road, Tema East",
    phone: "+233 30 330 5566",
    hours: "Daily: 6 AM – 6 PM",
    types: ["General", "Bulk", "Construction"],
    distance: "24.7 km",
    lat: 5.6833,
    lng: 0.0333,
    isOpen: true,
  },
  {
    id: "c5",
    name: "Mallam Atta Eco-Station",
    area: "Mallam, Accra",
    address: "Mallam Junction, Accra",
    phone: "+233 30 250 7788",
    hours: "Mon–Sat: 7 AM – 5 PM",
    types: ["Plastic", "Glass", "Metal"],
    distance: "8.3 km",
    lat: 5.5667,
    lng: -0.2667,
    isOpen: true,
  },
];

const TYPE_COLORS: Record<string, string> = {
  Metal: "#F59E0B",
  "E-Waste": "#EF4444",
  Plastic: "#3B82F6",
  Paper: "#10B981",
  Glass: "#8B5CF6",
  Organic: "#84CC16",
  General: "#6B7280",
  Bulk: "#F97316",
  Construction: "#78716C",
};

export default function RecyclingCentresScreen() {
  const router = useRouter();
  const { isDarkMode } = useApp();
  const C = getColors(isDarkMode);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const selected = CENTRES.find((c) => c.id === selectedId) ?? null;

  const mapMarkers = CENTRES.map((c) => ({
    id: c.id,
    latitude: c.lat,
    longitude: c.lng,
    title: c.name,
    type: "destination" as const,
  }));

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              {
                backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF",
                borderColor: C.border,
              },
            ]}
          >
            <ArrowLeft size={20} color={C.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: C.text }]}>
              Recycling Centres
            </Text>
            <Text style={[styles.subtitle, { color: C.greyText }]}>
              {CENTRES.filter((c) => c.isOpen).length} open near Accra
            </Text>
          </View>
          {/* Map / List Toggle */}
          <View
            style={[
              styles.togglePill,
              { backgroundColor: isDarkMode ? "#1E2321" : "#F0F4F2" },
            ]}
          >
            {(["list", "map"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.toggleBtn,
                  viewMode === mode && {
                    backgroundColor: isDarkMode
                      ? Colors.accent
                      : Colors.primary,
                  },
                ]}
                onPress={() => setViewMode(mode)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color:
                        viewMode === mode
                          ? isDarkMode
                            ? "#000000"
                            : "#FFFFFF"
                          : C.greyText,
                    },
                    viewMode === mode && { fontFamily: "Poppins-Bold" },
                  ]}
                >
                  {mode === "list" ? "List" : "Map"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {viewMode === "map" ? (
          <View style={styles.mapContainer}>
            <EcoliftMap markers={mapMarkers} style={styles.fullMap} />
            {/* Centre name overlay on tap */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mapCardRow}
              style={styles.mapCardScroll}
            >
              {CENTRES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.mapCard,
                    {
                      backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF",
                      borderColor:
                        selectedId === c.id
                          ? isDarkMode
                            ? Colors.accent
                            : Colors.primary
                          : C.border,
                      borderWidth: selectedId === c.id ? 2 : 1,
                    },
                  ]}
                  onPress={() =>
                    setSelectedId(selectedId === c.id ? null : c.id)
                  }
                >
                  <Text style={[styles.mapCardName, { color: C.text }]}>
                    {c.name}
                  </Text>
                  <Text style={[styles.mapCardDist, { color: C.greyText }]}>
                    {c.distance} away
                  </Text>
                  <View
                    style={[
                      styles.openBadge,
                      {
                        backgroundColor: c.isOpen
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(239,68,68,0.12)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.openBadgeText,
                        { color: c.isOpen ? "#10B981" : "#EF4444" },
                      ]}
                    >
                      {c.isOpen ? "Open" : "Closed"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {CENTRES.map((centre) => (
              <GlassCard key={centre.id} style={styles.centreCard}>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedId(selectedId === centre.id ? null : centre.id)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.centreTopRow}>
                    <View
                      style={[
                        styles.centreIconBox,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(182,255,60,0.1)"
                            : "rgba(11,61,46,0.07)",
                        },
                      ]}
                    >
                      <Recycle
                        size={20}
                        color={isDarkMode ? Colors.accent : Colors.primary}
                      />
                    </View>
                    <View style={styles.centreMeta}>
                      <Text style={[styles.centreName, { color: C.text }]}>
                        {centre.name}
                      </Text>
                      <View style={styles.centreSubRow}>
                        <MapPin size={11} color={C.greyText} />
                        <Text
                          style={[styles.centreArea, { color: C.greyText }]}
                        >
                          {centre.area} · {centre.distance}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.openBadge,
                        {
                          backgroundColor: centre.isOpen
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(239,68,68,0.12)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.openBadgeText,
                          { color: centre.isOpen ? "#10B981" : "#EF4444" },
                        ]}
                      >
                        {centre.isOpen ? "Open" : "Closed"}
                      </Text>
                    </View>
                  </View>

                  {/* Waste type chips */}
                  <View style={styles.typeChipsRow}>
                    {centre.types.map((t) => (
                      <View
                        key={t}
                        style={[
                          styles.typeChip,
                          {
                            backgroundColor:
                              (TYPE_COLORS[t] ?? "#6B7280") + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            { color: TYPE_COLORS[t] ?? "#6B7280" },
                          ]}
                        >
                          {t}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Expanded details */}
                  {selectedId === centre.id && (
                    <View
                      style={[
                        styles.expandedDetails,
                        { borderTopColor: C.border },
                      ]}
                    >
                      <View style={styles.detailRow}>
                        <MapPin size={13} color={C.greyText} />
                        <Text
                          style={[styles.detailText, { color: C.greyText }]}
                        >
                          {centre.address}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={13} color={C.greyText} />
                        <Text
                          style={[styles.detailText, { color: C.greyText }]}
                        >
                          {centre.hours}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Phone size={13} color={C.greyText} />
                        <Text
                          style={[styles.detailText, { color: C.greyText }]}
                        >
                          {centre.phone}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.directionsBtn,
                          {
                            backgroundColor: isDarkMode
                              ? Colors.accent
                              : Colors.primary,
                          },
                        ]}
                        activeOpacity={0.9}
                        onPress={() => {
                          const lat = centre.lat;
                          const lng = centre.lng;
                          const label = encodeURIComponent(centre.name);
                          const url = Platform.select({
                            ios: `maps:0,0?q=${label}@${lat},${lng}`,
                            android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
                            default: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
                          });
                          if (url) Linking.openURL(url);
                        }}
                      >
                        <Navigation
                          size={14}
                          color={isDarkMode ? "#000000" : "#FFFFFF"}
                        />
                        <Text
                          style={[
                            styles.directionsBtnText,
                            { color: isDarkMode ? "#000000" : "#FFFFFF" },
                          ]}
                        >
                          Get Directions
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              </GlassCard>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 24,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontFamily: "Poppins-Bold" },
  subtitle: { fontSize: 11, fontFamily: "Poppins-Medium" },
  togglePill: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleText: { fontSize: 12, fontFamily: "Poppins-Medium" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  centreCard: { marginBottom: 12, padding: 14 },
  centreTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  centreIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  centreMeta: { flex: 1 },
  centreName: { fontSize: 13, fontFamily: "Poppins-Bold", marginBottom: 2 },
  centreSubRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  centreArea: { fontSize: 11, fontFamily: "Poppins-Medium" },
  openBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  openBadgeText: { fontSize: 10, fontFamily: "Poppins-Bold" },
  typeChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeChipText: { fontSize: 10, fontFamily: "Poppins-Bold" },
  expandedDetails: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
    gap: 8,
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 12, fontFamily: "Poppins-Medium", flex: 1 },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 12,
    marginTop: 4,
  },
  directionsBtnText: { fontSize: 13, fontFamily: "Poppins-Bold" },
  mapContainer: { flex: 1 },
  fullMap: { flex: 1 },
  mapCardScroll: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
  },
  mapCardRow: { paddingHorizontal: 16, gap: 10 },
  mapCard: {
    width: 160,
    padding: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  mapCardName: { fontSize: 12, fontFamily: "Poppins-Bold", marginBottom: 2 },
  mapCardDist: { fontSize: 10, fontFamily: "Poppins-Medium", marginBottom: 6 },
});
