import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { EcoliftMap } from "@/components/ecolift-map";
import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    Bell,
    Calendar as CalendarIcon,
    CalendarPlus,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Leaf,
    Lightbulb,
    MapPin,
    MessageSquare,
    Package,
    PhoneCall,
    Recycle,
    Search,
    Truck,
    X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { useAuth } from "@/src/context/AuthContext";
import {
    geocodeAddress,
    getPlaceDetails,
    reverseGeocode,
} from "@/src/services/googleMaps";
import { getNotifications } from "@/src/services/notifications";
import { subscribeToOrderById } from "@/src/services/orders";
import { Order as DbOrder } from "@/src/types/order";

interface LocationResult {
  id: string;
  name: string;
  area: string;
  coords: { latitude: number; longitude: number };
}

type Coordinates = { latitude: number; longitude: number };

const DEFAULT_LOCATIONS: LocationResult[] = [
  {
    id: "1",
    name: "12 Ring Road Central",
    area: "Osu, Accra, Ghana",
    coords: { latitude: 5.5593, longitude: -0.1974 },
  },
  {
    id: "2",
    name: "45 Cantonments Road",
    area: "Cantonments, Accra, Ghana",
    coords: { latitude: 5.572, longitude: -0.178 },
  },
  {
    id: "3",
    name: "Boundary Road #14",
    area: "East Legon, Accra, Ghana",
    coords: { latitude: 5.635, longitude: -0.16 },
  },
  {
    id: "4",
    name: "Times Square Hub",
    area: "Manhattan, New York, NY, USA",
    coords: { latitude: 40.758, longitude: -73.9855 },
  },
  {
    id: "5",
    name: "Oxford Street Eco-Station",
    area: "Westminster, London, UK",
    coords: { latitude: 51.515, longitude: -0.1419 },
  },
  {
    id: "6",
    name: "Victoria Island Central",
    area: "Lagos, Nigeria",
    coords: { latitude: 6.4281, longitude: 3.4219 },
  },
  {
    id: "7",
    name: "Shibuya Crossing Point",
    area: "Tokyo, Japan",
    coords: { latitude: 35.6595, longitude: 139.7005 },
  },
  {
    id: "8",
    name: "Downtown Dubai Plaza",
    area: "Dubai, United Arab Emirates",
    coords: { latitude: 25.1972, longitude: 55.2744 },
  },
];

const DEFAULT_DISPOSAL_STATIONS: LocationResult[] = [
  {
    id: "d1",
    name: "Agbogbloshie Eco-Station #4",
    area: "Agbogbloshie, Accra, Ghana",
    coords: { latitude: 5.57, longitude: -0.185 },
  },
  {
    id: "d2",
    name: "Tema Recycling & Material Hub",
    area: "Tema Heavy Industrial Area, Greater Accra",
    coords: { latitude: 5.68, longitude: -0.01 },
  },
  {
    id: "d3",
    name: "Brooklyn Material Recovery Facility",
    area: "Sunset Park, Brooklyn, NY, USA",
    coords: { latitude: 40.655, longitude: -74.015 },
  },
  {
    id: "d4",
    name: "London Riverside Resource Recovery",
    area: "Belvedere, London, UK",
    coords: { latitude: 51.498, longitude: 0.165 },
  },
  {
    id: "d5",
    name: "Lagos LAWMA Central Recycling Hub",
    area: "Ijora, Lagos, Nigeria",
    coords: { latitude: 6.471, longitude: 3.364 },
  },
  {
    id: "d6",
    name: "Tokyo Super Eco Town Facility",
    area: "Ota City, Tokyo, Japan",
    coords: { latitude: 35.58, longitude: 139.79 },
  },
];

export default function UserHome() {
  const router = useRouter();
  const {
    isDarkMode,
    selectedWasteType,
    pickupAddress,
    setPickupAddress,
    bagsCount,
    selectedPaymentMethod,
    createPickupOrder,
  } = useApp();
  const { user } = useAuth();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!user?.id) return;
    getNotifications(user.id).then((notifs) => {
      setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
    });
  }, [user?.id]);

  // Screen View States: 'home' | 'choose_vehicle' | 'confirm_pickup' | 'tracking'
  const [viewState, setViewState] = useState<
    | "home"
    | "choose_vehicle"
    | "confirm_pickup"
    | "editing_location"
    | "tracking"
  >("home");
  const [activeOrder, setActiveOrder] = useState<DbOrder | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<
    "tricycle" | "truck" | "heavy"
  >("truck");

  // Address search floating state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = React.useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] =
    useState<LocationResult[]>(DEFAULT_LOCATIONS);
  const [pickupLocation, setPickupLocation] = useState<Coordinates>({
    latitude: 5.5593,
    longitude: -0.1974,
  });

  // Disposal station state
  const [disposalAddress, setDisposalAddress] = useState(
    DEFAULT_DISPOSAL_STATIONS[0].name,
  );
  const [disposalLocation, setDisposalLocation] = useState<Coordinates>({
    latitude: 5.57,
    longitude: -0.185,
  });

  const [editingLocation, setEditingLocation] = useState<
    "pickup" | "disposal" | null
  >(null);
  const [editingPickupLocation, setEditingPickupLocation] =
    useState<Coordinates | null>(null);
  const [editingPickupAddress, setEditingPickupAddress] = useState("");
  const [editingDisposalLocation, setEditingDisposalLocation] =
    useState<Coordinates | null>(null);
  const [editingDisposalAddress, setEditingDisposalAddress] = useState("");

  // Map Picking Active mode: "pickup" | "destination" | null
  const [isMapPickingActive, setIsMapPickingActive] = useState<
    "pickup" | "destination" | null
  >(null);

  const hasAssignedCollector = Boolean(
    activeOrder?.collector_id &&
    (activeOrder.status === "confirmed" || activeOrder.status === "en_route"),
  );
  const collectorCoords = {
    latitude: pickupLocation.latitude + 0.004,
    longitude: pickupLocation.longitude + 0.004,
  };

  React.useEffect(() => {
    if (!activeOrder?.id) return;

    return subscribeToOrderById(activeOrder.id, (updatedOrder) => {
      setActiveOrder(updatedOrder);
    });
  }, [activeOrder?.id]);

  // Dynamic Map markers setup worldwide
  const mapMarkers = [
    {
      id: "user",
      latitude:
        editingLocation === "pickup" && editingPickupLocation
          ? editingPickupLocation.latitude
          : pickupLocation.latitude,
      longitude:
        editingLocation === "pickup" && editingPickupLocation
          ? editingPickupLocation.longitude
          : pickupLocation.longitude,
      title: `Pickup: ${pickupAddress}`,
      type: "user" as const,
      draggable: true,
      isHighlighted: editingLocation === "pickup",
    },
    ...(hasAssignedCollector
      ? [
          {
            id: "collector",
            latitude: collectorCoords.latitude,
            longitude: collectorCoords.longitude,
            title: "Assigned EcoLift collector",
            type: "collector" as const,
            draggable: false,
          },
        ]
      : []),
    {
      id: "station",
      latitude:
        editingLocation === "disposal" && editingDisposalLocation
          ? editingDisposalLocation.latitude
          : disposalLocation.latitude,
      longitude:
        editingLocation === "disposal" && editingDisposalLocation
          ? editingDisposalLocation.longitude
          : disposalLocation.longitude,
      title: `Destination: ${disposalAddress}`,
      type: "destination" as const,
      draggable: true,
      isHighlighted: editingLocation === "disposal",
    },
  ];

  // Dynamic route polyline connecting collector -> user -> destination
  const routePolyline = [
    ...(hasAssignedCollector
      ? [
          collectorCoords,
          {
            latitude:
              (pickupLocation.latitude + collectorCoords.latitude) / 2 + 0.001,
            longitude:
              (pickupLocation.longitude + collectorCoords.longitude) / 2 -
              0.001,
          },
        ]
      : []),
    {
      latitude:
        (pickupLocation.latitude + disposalLocation.latitude) / 2 + 0.002,
      longitude:
        (pickupLocation.longitude + disposalLocation.longitude) / 2 + 0.002,
    },
    pickupLocation,
    disposalLocation,
  ];

  const activePickupLocation =
    editingLocation === "pickup" && editingPickupLocation
      ? editingPickupLocation
      : pickupLocation;
  const activeDisposalLocation =
    editingLocation === "disposal" && editingDisposalLocation
      ? editingDisposalLocation
      : disposalLocation;
  const routeDistanceKm = Math.max(
    0.1,
    Math.sqrt(
      Math.pow(
        (activePickupLocation.latitude - activeDisposalLocation.latitude) * 111,
        2,
      ) +
        Math.pow(
          (activePickupLocation.longitude - activeDisposalLocation.longitude) *
            111 *
            Math.cos((activePickupLocation.latitude * Math.PI) / 180),
          2,
        ),
    ),
  );
  const estimatedMinutes = Math.max(5, Math.round(routeDistanceKm * 3));
  const vehicleBasePrice = { tricycle: 25, truck: 45, heavy: 85 }[
    selectedVehicle
  ];
  const pickupPrice =
    vehicleBasePrice + Math.max(0, Math.round(routeDistanceKm - 3) * 2);

  // Map Tap Handler - pick any location around the world directly from map
  const handleMapPress = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const address = await reverseGeocode(coords);
      const displayAddress =
        address ||
        `Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)}`;

      if (editingLocation === "pickup") {
        setEditingPickupLocation(coords);
        setEditingPickupAddress(displayAddress);
        return;
      }
      if (editingLocation === "disposal") {
        setEditingDisposalLocation(coords);
        setEditingDisposalAddress(displayAddress);
        return;
      }

      if (isMapPickingActive === "destination") {
        setDisposalLocation(coords);
        setDisposalAddress(displayAddress);
        setIsMapPickingActive(null);
        showAlert({
          type: "success",
          title: "Destination Updated",
          message: `Disposal destination set to: ${displayAddress}`,
        });
      } else {
        setPickupLocation(coords);
        setPickupAddress(displayAddress);
        setIsMapPickingActive(null);
        showAlert({
          type: "success",
          title: "Pickup Location Updated",
          message: `Pickup location set to: ${displayAddress}`,
        });
      }
    } catch (err) {
      console.warn("Map Press Reverse Geocode Error:", err);
    }
  };

  // Marker Drag End Handler - pick/adjust location worldwide by dragging pins
  const handleMarkerDragEnd = async (
    markerId: string,
    coords: { latitude: number; longitude: number },
  ) => {
    try {
      const address = await reverseGeocode(coords);
      const displayAddress =
        address ||
        `Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)}`;

      if (editingLocation === "pickup" && markerId === "user") {
        setEditingPickupLocation(coords);
        setEditingPickupAddress(displayAddress);
        return;
      }
      if (
        editingLocation === "disposal" &&
        (markerId === "station" || markerId === "destination")
      ) {
        setEditingDisposalLocation(coords);
        setEditingDisposalAddress(displayAddress);
        return;
      }

      if (markerId === "station" || markerId === "destination") {
        setDisposalLocation(coords);
        setDisposalAddress(displayAddress);
        showAlert({
          type: "success",
          title: "Destination Pin Moved",
          message: `Disposal destination updated to: ${displayAddress}`,
        });
      } else if (markerId === "user") {
        setPickupLocation(coords);
        setPickupAddress(displayAddress);
        showAlert({
          type: "success",
          title: "Pickup Pin Moved",
          message: `Pickup location updated to: ${displayAddress}`,
        });
      }
    } catch (err) {
      console.warn("Marker Drag Reverse Geocode Error:", err);
    }
  };

  // Resolve an OpenStreetMap result by its stable coordinate identifier.
  const fetchPlaceDetailsById = async (placeId: string) => {
    try {
      const place = await getPlaceDetails(placeId);
      if (place) {
        setPickupLocation(place.location);
        setPickupAddress(place.formattedAddress || place.name);
        setIsSearchOpen(false);
        setSearchQuery("");
        searchInputRef.current?.blur();
        setViewState("choose_vehicle");

        const isOpen = place.isOpenNow ?? true;
        showAlert({
          type: "success",
          title: "Location Updated",
          message: `${place.name || "Location"} is ${isOpen ? "Open Now 🟢" : "Closed 🔴"}. Pickup route calculated.`,
        });
      }
    } catch (err) {
      console.warn("FetchPlaceDetails Exception:", err);
    }
  };

  // Fetch real place and geocoding results worldwide from OpenStreetMap.
  const handleSearchTextChange = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults(DEFAULT_LOCATIONS);
      return;
    }

    setIsSearching(true);
    try {
      const results = await geocodeAddress(text);

      if (results.length > 0) {
        const parsedResults: LocationResult[] = results.map((res) => ({
          id: res.placeId,
          name: res.name,
          area: res.formattedAddress,
          coords: res.location,
        }));
        setSearchResults(parsedResults);
      } else {
        const filtered = DEFAULT_LOCATIONS.filter(
          (loc) =>
            loc.name.toLowerCase().includes(text.toLowerCase()) ||
            loc.area.toLowerCase().includes(text.toLowerCase()),
        );
        setSearchResults(filtered);
      }
    } catch (e) {
      console.warn("OpenStreetMap geocoding search error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (loc: LocationResult) => {
    if (loc.id && loc.id.length > 10) {
      fetchPlaceDetailsById(loc.id);
    } else {
      setPickupAddress(loc.area || loc.name);
      setPickupLocation(loc.coords);
      setIsSearchOpen(false);
      setSearchQuery("");
      searchInputRef.current?.blur();
      setViewState("choose_vehicle");
    }
  };

  // Disposal station search & edit states
  const [isDisposalModalVisible, setIsDisposalModalVisible] = useState(false);
  const [disposalSearchQuery, setDisposalSearchQuery] = useState("");
  const [disposalResults, setDisposalResults] = useState<LocationResult[]>(
    DEFAULT_DISPOSAL_STATIONS,
  );
  const [isDisposalSearching, setIsDisposalSearching] = useState(false);

  const handleDisposalSearch = async (text: string) => {
    setDisposalSearchQuery(text);
    if (!text.trim()) {
      setDisposalResults(DEFAULT_DISPOSAL_STATIONS);
      return;
    }
    setIsDisposalSearching(true);
    try {
      const results = await geocodeAddress(text);
      if (results.length > 0) {
        setDisposalResults(
          results.map((r, i) => ({
            id: r.placeId || i.toString(),
            name: r.name,
            area: r.formattedAddress,
            coords: r.location,
          })),
        );
      } else {
        const filtered = DEFAULT_DISPOSAL_STATIONS.filter(
          (d) =>
            d.name.toLowerCase().includes(text.toLowerCase()) ||
            d.area.toLowerCase().includes(text.toLowerCase()),
        );
        setDisposalResults(filtered);
      }
    } catch {
      setDisposalResults(DEFAULT_DISPOSAL_STATIONS);
    } finally {
      setIsDisposalSearching(false);
    }
  };

  const handleDisposalSelect = (loc: LocationResult) => {
    const address = loc.area ? `${loc.name}, ${loc.area}` : loc.name;
    if (editingLocation === "disposal") {
      setEditingDisposalAddress(address);
      setEditingDisposalLocation(loc.coords);
    } else {
      setDisposalAddress(address);
      setDisposalLocation(loc.coords);
    }
    setIsDisposalModalVisible(false);
    setDisposalSearchQuery("");
    setDisposalResults(DEFAULT_DISPOSAL_STATIONS);
    showAlert({
      type: "success",
      title: "Disposal Station Updated",
      message: `Destination set to: ${loc.name}`,
    });
  };

  // Pickup edit search & edit states
  const [isPickupEditModalVisible, setIsPickupEditModalVisible] =
    useState(false);
  const [pickupEditQuery, setPickupEditQuery] = useState("");
  const [pickupEditResults, setPickupEditResults] =
    useState<LocationResult[]>(DEFAULT_LOCATIONS);
  const [isPickupEditSearching, setIsPickupEditSearching] = useState(false);

  const handlePickupEditSearch = async (text: string) => {
    setPickupEditQuery(text);
    if (!text.trim()) {
      setPickupEditResults(DEFAULT_LOCATIONS);
      return;
    }
    setIsPickupEditSearching(true);
    try {
      const results = await geocodeAddress(text);
      if (results.length > 0) {
        setPickupEditResults(
          results.map((r, i) => ({
            id: r.placeId || i.toString(),
            name: r.name,
            area: r.formattedAddress,
            coords: r.location,
          })),
        );
      } else {
        setPickupEditResults(
          DEFAULT_LOCATIONS.filter(
            (l) =>
              l.name.toLowerCase().includes(text.toLowerCase()) ||
              l.area.toLowerCase().includes(text.toLowerCase()),
          ),
        );
      }
    } catch {
      setPickupEditResults(DEFAULT_LOCATIONS);
    } finally {
      setIsPickupEditSearching(false);
    }
  };

  const handlePickupEditSelect = (loc: LocationResult) => {
    const address = loc.area || loc.name;
    if (editingLocation === "pickup") {
      setEditingPickupAddress(address);
      setEditingPickupLocation(loc.coords);
    } else {
      setPickupAddress(address);
      setPickupLocation(loc.coords);
    }
    setIsPickupEditModalVisible(false);
    setPickupEditQuery("");
    setPickupEditResults(DEFAULT_LOCATIONS);
    showAlert({
      type: "success",
      title: "Pickup Location Updated",
      message: `Pickup location set to: ${loc.area || loc.name}`,
    });
  };

  const applyTypedPickupAddress = async () => {
    const query = pickupEditQuery.trim();
    if (!query || isPickupEditSearching) return;

    setIsPickupEditSearching(true);
    try {
      const [result] = await geocodeAddress(query);
      if (!result) {
        showAlert({
          type: "error",
          title: "Location Not Found",
          message: "Try a more specific pickup address or choose a map result.",
        });
        return;
      }
      const address = result.formattedAddress || result.name || query;
      setEditingPickupLocation(result.location);
      setEditingPickupAddress(address);
      setIsPickupEditModalVisible(false);
      setPickupEditQuery("");
      setPickupEditResults(DEFAULT_LOCATIONS);
    } catch {
      showAlert({
        type: "error",
        title: "Location Search Failed",
        message: "Check your connection and try the address again.",
      });
    } finally {
      setIsPickupEditSearching(false);
    }
  };

  const applyTypedDisposalAddress = async () => {
    const query = disposalSearchQuery.trim();
    if (!query || isDisposalSearching) return;

    setIsDisposalSearching(true);
    try {
      const [result] = await geocodeAddress(query);
      if (!result) {
        showAlert({
          type: "error",
          title: "Location Not Found",
          message:
            "Try a more specific disposal station or choose a map result.",
        });
        return;
      }
      const address = result.formattedAddress || result.name || query;
      setEditingDisposalLocation(result.location);
      setEditingDisposalAddress(address);
      setIsDisposalModalVisible(false);
      setDisposalSearchQuery("");
      setDisposalResults(DEFAULT_DISPOSAL_STATIONS);
    } catch {
      showAlert({
        type: "error",
        title: "Location Search Failed",
        message: "Check your connection and try the address again.",
      });
    } finally {
      setIsDisposalSearching(false);
    }
  };

  const beginLocationEditing = (mode: "pickup" | "disposal") => {
    setEditingLocation(mode);
    setEditingPickupLocation(pickupLocation);
    setEditingPickupAddress(pickupAddress);
    setEditingDisposalLocation(disposalLocation);
    setEditingDisposalAddress(disposalAddress);
    setIsMapPickingActive(null);
    setViewState("editing_location");
  };

  const cancelLocationEditing = () => {
    setEditingLocation(null);
    setEditingPickupLocation(null);
    setEditingDisposalLocation(null);
    setViewState("confirm_pickup");
  };

  const confirmLocationEditing = () => {
    if (editingLocation === "pickup" && editingPickupLocation) {
      setPickupLocation(editingPickupLocation);
      setPickupAddress(editingPickupAddress);
    }
    if (editingLocation === "disposal" && editingDisposalLocation) {
      setDisposalLocation(editingDisposalLocation);
      setDisposalAddress(editingDisposalAddress);
    }
    setEditingLocation(null);
    setEditingPickupLocation(null);
    setEditingDisposalLocation(null);
    setViewState("confirm_pickup");
  };

  const handleConfirmPickup = async () => {
    if (
      !Number.isFinite(pickupLocation.latitude) ||
      !Number.isFinite(pickupLocation.longitude) ||
      !Number.isFinite(disposalLocation.latitude) ||
      !Number.isFinite(disposalLocation.longitude)
    ) {
      showAlert({
        type: "error",
        title: "Locations Required",
        message:
          "Please select both a pickup location and a disposal station before continuing.",
      });
      return;
    }
    // Create order in Supabase backend
    const wasteTypeMap: Record<string, string> = {
      Household: "household",
      Recyclables: "recyclables",
      Commercial: "commercial",
      "Bulk / Construction": "bulk_construction",
    };
    const vehiclePriceMap: Record<string, number> = {
      tricycle: 25,
      truck: 45,
      heavy: 85,
    };
    try {
      const createdOrder = await createPickupOrder({
        waste_type: (wasteTypeMap[selectedWasteType] || "household") as any,
        pickup_lat: pickupLocation.latitude,
        pickup_lng: pickupLocation.longitude,
        pickup_address: pickupAddress,
        disposal_lat: disposalLocation.latitude,
        disposal_lng: disposalLocation.longitude,
        disposal_address: disposalAddress,
        bags_count: bagsCount,
        price: pickupPrice || vehiclePriceMap[selectedVehicle] || 45,
        payment_method: (selectedPaymentMethod === "moolre_momo"
          ? "momo"
          : selectedPaymentMethod === "card"
            ? "card"
            : "wallet") as any,
      });

      if (!createdOrder) {
        showAlert({
          type: "error",
          title: "Pickup Request Not Created",
          message: "We could not submit your pickup request. Please try again.",
        });
        return;
      }

      setActiveOrder(createdOrder);
    } catch (err) {
      console.warn("Order creation error:", err);
      showAlert({
        type: "error",
        title: "Pickup Request Not Created",
        message: "We could not submit your pickup request. Please try again.",
      });
      return;
    }

    setViewState("tracking");
    showAlert({
      type: "success",
      title: "Pickup Request Submitted",
      message: "We are finding an available collector for your request.",
    });
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Semi-transparent backdrop when floating search dropdown is open */}
        {isSearchOpen && (
          <TouchableOpacity
            style={styles.searchBackdropOverlay}
            activeOpacity={1}
            onPress={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
              setSearchResults(DEFAULT_LOCATIONS);
              searchInputRef.current?.blur();
            }}
          />
        )}

        {/* ------------------- VIEW 1: USER HOME (NEW MOCKUP DESIGN) ------------------- */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ambient Background Glows */}
          <View style={styles.ambientGlowTop} pointerEvents="none" />
          <View style={styles.ambientGlowBottom} pointerEvents="none" />

          {/* Header Top Bar */}
          <View style={styles.topHeaderRow}>
            <View style={styles.brandRow}>
              <Text
                style={[
                  styles.brandTitle,
                  { color: isDarkMode ? "#95D3BA" : "#003527" },
                ]}
              >
                EcoLift
              </Text>
            </View>

            <View style={styles.topRightRow}>
              <TouchableOpacity
                style={[
                  styles.iconCircleBtn,
                  {
                    backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF",
                    borderColor: C.border,
                  },
                ]}
                onPress={() => router.push("/notifications" as any)}
              >
                <Bell size={18} color={C.text} />
                {unreadCount > 0 && (
                  <View style={styles.badgeDot}>
                    <Text style={styles.badgeDotText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile" as any)}
                style={styles.avatarContainer}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri:
                      user?.avatar_url ||
                      "https://lh3.googleusercontent.com/aida/AP1WRLvvebFOZ6ynMsVwLT_RhMB47PIf8hxioUnplUngiLRck_uwziGuo8q9YO5aj1foVEUmhejlyafL2z2OHqEPi7FC8azbJoc-ziJbt6qsF5SMnw3GGseHcRNMOLhOvVO7v71vEGCzSy99We7_7rFyQI5Xzz2j4GcrsBMMWBjTRHPbwqUwGF-tolAZtlI0fp2FGa_-ATEKQMsHpKcZA_Q1cKK8GQq6hUUor6q0TpvsuD-ZBS35WmtkQvEqKtrn1A2MHmfBS2lh9XHmQQ",
                  }}
                  style={styles.avatarImage}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Interactive Location Setter Floating Pill */}
          <View
            style={[
              styles.locationSetterWrapper,
              isSearchOpen && styles.locationSetterWrapperActive,
            ]}
          >
            <View
              style={[
                styles.voicePillBar,
                {
                  backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF",
                  borderColor: isSearchOpen ? "#006C49" : C.border,
                },
              ]}
            >
              <View style={styles.voicePillLeft}>
                <View
                  style={[
                    styles.micCircle,
                    {
                      backgroundColor: isDarkMode ? "#95D3BA" : "#003527",
                    },
                  ]}
                >
                  <MapPin
                    size={14}
                    color={isDarkMode ? "#000000" : "#FFFFFF"}
                  />
                </View>
                <TextInput
                  ref={searchInputRef}
                  style={[styles.voicePillTextInput, { color: C.text }]}
                  placeholder="Set pickup location worldwide..."
                  placeholderTextColor={C.greyText}
                  value={isSearchOpen ? searchQuery : pickupAddress}
                  onChangeText={handleSearchTextChange}
                  onFocus={() => {
                    setIsSearchOpen(true);
                  }}
                  returnKeyType="search"
                />
              </View>

              {isSearching ? (
                <ActivityIndicator
                  size="small"
                  color="#006C49"
                  style={{ marginRight: 4 }}
                />
              ) : isSearchOpen ? (
                <TouchableOpacity
                  onPress={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults(DEFAULT_LOCATIONS);
                    searchInputRef.current?.blur();
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.pillClearBtn}
                >
                  <X size={16} color={C.greyText} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setIsSearchOpen(true);
                    searchInputRef.current?.focus();
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Search size={16} color={C.greyText} />
                </TouchableOpacity>
              )}
            </View>

            {/* Floating Dropdown attached directly beneath the Location Setter */}
            {isSearchOpen && (
              <View
                style={[
                  styles.floatingDropdownCard,
                  {
                    backgroundColor: isDarkMode ? "#1A1F1D" : "#FFFFFF",
                    borderColor: isDarkMode ? "#2C3531" : C.border,
                  },
                ]}
              >
                <View style={styles.floatingHeader}>
                  <Text
                    style={[styles.floatingHeaderText, { color: C.greyText }]}
                  >
                    {searchQuery.trim()
                      ? "SEARCH RESULTS"
                      : "POPULAR PICKUP LOCATIONS"}
                  </Text>
                  {searchQuery.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={() => handleSearchTextChange("")}
                    >
                      <Text
                        style={[styles.floatingClearText, { color: "#006C49" }]}
                      >
                        Clear
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView
                  style={styles.floatingList}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={true}
                >
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.locationResultRow,
                        {
                          borderBottomColor: isDarkMode ? "#262D2A" : C.border,
                        },
                      ]}
                      onPress={() => handleSelectLocation(item)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.locResultIconCircle,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(149, 211, 186, 0.15)"
                              : "rgba(0, 108, 73, 0.1)",
                          },
                        ]}
                      >
                        <MapPin
                          size={15}
                          color={isDarkMode ? "#95D3BA" : "#006C49"}
                        />
                      </View>
                      <View style={styles.locResultText}>
                        <Text style={[styles.locName, { color: C.text }]}>
                          {item.name}
                        </Text>
                        <Text
                          style={[styles.locArea, { color: C.greyText }]}
                          numberOfLines={1}
                        >
                          {item.area}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={C.greyText} />
                    </TouchableOpacity>
                  ))}

                  {searchResults.length === 0 && !isSearching && (
                    <View style={styles.emptyResultsContainer}>
                      <Text
                        style={[styles.emptyResultsText, { color: C.greyText }]}
                      >
                        No locations found for &quot;{searchQuery}&quot;
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 1. Schedule a Pickup Hero Card */}
          <View style={styles.heroPickupCard}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqQYga1SGpJxtvuSMpI27EroZsgkFIu0aME6yLXITm3ghjarJOfA4-PRvf5d15_q6L8l5FFf6fNQcJEVV4LKXEwMHnb0hhx8Wjvl9VWofoZRTpy_TgdLGQA7GFKF26iWNXkNv9TdWdeHEY3FeTV_odkxWxtOVm1tE2EJAOn2o2hFGa7A0EzRdVzq1gq47bYlMOwUu2BzItOr6yrOSf7WK1JPUqbRPL7nkWG-fmzgw2RT7Uj2My9Q2B",
              }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={
                isDarkMode
                  ? ["rgba(0, 53, 39, 0.2)", "rgba(0, 53, 39, 0.8)", "#003527"]
                  : ["rgba(0, 53, 39, 0.2)", "rgba(6, 78, 59, 0.85)", "#064E3B"]
              }
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContentContainer}>
              <Text style={styles.heroTitle}>Schedule a Pickup</Text>
              <TouchableOpacity
                style={styles.heroRequestBtn}
                onPress={() => setViewState("choose_vehicle")}
                activeOpacity={0.9}
              >
                <CalendarPlus size={16} color="#FFFFFF" />
                <Text style={styles.heroRequestBtnText}>Request Pickup</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Weekly Impact Card */}
          <View
            style={[
              styles.impactCard,
              {
                backgroundColor: isDarkMode ? "#1A201E" : "#E7EEFE",
                borderColor: isDarkMode
                  ? "#293330"
                  : "rgba(220, 226, 243, 0.7)",
              },
            ]}
          >
            <View style={styles.impactHeaderRow}>
              <View style={styles.impactTitleLeft}>
                <Leaf size={18} color={isDarkMode ? "#95D3BA" : "#003527"} />
                <Text
                  style={[
                    styles.impactTitleText,
                    { color: isDarkMode ? "#F0F5F2" : "#003527" },
                  ]}
                >
                  Weekly Impact
                </Text>
              </View>
              <Text
                style={[
                  styles.impactBadgeText,
                  { color: isDarkMode ? "#A8B5AD" : "#404944" },
                ]}
              >
                4 / 5 Goals Met
              </Text>
            </View>

            <View style={styles.impactBodyRow}>
              {/* Circular 80% Gauge */}
              <View style={styles.gaugeContainer}>
                <Svg
                  width={76}
                  height={76}
                  viewBox="0 0 36 36"
                  style={{ transform: [{ rotate: "-90deg" }] }}
                >
                  <Path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={isDarkMode ? "rgba(255,255,255,0.08)" : "#DCE2F3"}
                    strokeWidth={3.2}
                  />
                  <Path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={isDarkMode ? "#4EDEA3" : "#006C49"}
                    strokeWidth={3.2}
                    strokeDasharray="80, 100"
                    strokeLinecap="round"
                  />
                </Svg>
                <Text
                  style={[
                    styles.gaugeCenterText,
                    { color: isDarkMode ? "#95D3BA" : "#003527" },
                  ]}
                >
                  80%
                </Text>
              </View>

              {/* Progress Bars */}
              <View style={styles.metricsColumn}>
                <View style={styles.metricRow}>
                  <Text
                    style={[
                      styles.metricName,
                      { color: isDarkMode ? "#E1E8E4" : "#151C27" },
                    ]}
                  >
                    Recycled Material
                  </Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDarkMode ? "#4EDEA3" : "#006C49" },
                    ]}
                  >
                    24 lbs
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBarTrack,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.08)"
                        : "#DCE2F3",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: "80%",
                        backgroundColor: isDarkMode ? "#4EDEA3" : "#006C49",
                      },
                    ]}
                  />
                </View>

                <View style={[styles.metricRow, { marginTop: 10 }]}>
                  <Text
                    style={[
                      styles.metricName,
                      { color: isDarkMode ? "#E1E8E4" : "#151C27" },
                    ]}
                  >
                    Compost Added
                  </Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isDarkMode ? "#4EDEA3" : "#006C49" },
                    ]}
                  >
                    10 lbs
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBarTrack,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.08)"
                        : "#DCE2F3",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: "60%",
                        backgroundColor: isDarkMode ? "#4EDEA3" : "#006C49",
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 3. Daily Eco Tip Card */}
          <View style={styles.ecoTipCard}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5QxMKJ7EjPQ332i9tHUM5G126i1nPGLLKKwy6-NKgoeLN1gif0o3wTBX4ntCzvDkV5a3EURAl9wSmcjK5a-sARgvSAvOoMLclP0uIH_otkW73u5F5On8py5bl0z_4H5LHWsVFm-mIiVYdSOecrpSJe2cJb35VEvdr8w8rVEBaGmV_nnSdHsbtPITQVm6qoW0L5F-Hznp9rJHNEEJ6TTVGpiHNvIPta12_AaEevrNyXioWgfdcGjgo",
              }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={
                isDarkMode
                  ? [
                      "#1B2621",
                      "rgba(27, 38, 33, 0.88)",
                      "rgba(27, 38, 33, 0.25)",
                    ]
                  : [
                      "#D9E6DD",
                      "rgba(217, 230, 221, 0.92)",
                      "rgba(217, 230, 221, 0.3)",
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.ecoTipContent}>
              <View style={styles.ecoTipHeaderRow}>
                <Lightbulb
                  size={14}
                  color={isDarkMode ? "#95D3BA" : "#25312B"}
                />
                <Text
                  style={[
                    styles.ecoTipTagText,
                    { color: isDarkMode ? "#95D3BA" : "#25312B" },
                  ]}
                >
                  Daily Eco Tip
                </Text>
              </View>
              <Text
                style={[
                  styles.ecoTipBodyText,
                  { color: isDarkMode ? "#FFFFFF" : "#131E19" },
                ]}
              >
                Rinse glass jars before recycling.
              </Text>
            </View>
          </View>

          {/* 4. Nearby Centers Section */}
          <View style={styles.nearbySection}>
            <View style={styles.nearbyHeaderRow}>
              <Text
                style={[
                  styles.nearbySectionTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#151C27" },
                ]}
              >
                Nearby Centers
              </Text>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => router.push("/recycling-centres" as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.viewAllBtnText,
                    { color: isDarkMode ? "#95D3BA" : "#003527" },
                  ]}
                >
                  View All
                </Text>
                <ChevronRight
                  size={14}
                  color={isDarkMode ? "#95D3BA" : "#003527"}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.centerCard,
                {
                  backgroundColor: isDarkMode ? "#1A201E" : "#FFFFFF",
                  borderColor: isDarkMode ? "#293330" : "#E2E8F8",
                },
              ]}
              onPress={() => router.push("/recycling-centres" as any)}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj9RaPqz2QI5Q8sm07gWRTcjgzDTodohanHbc6VvOZHa6bka_hdf55c7gIxsExnmAp-LbC2smHPIo36IS-8CiQQFs-T91ue0k2zP-4BpHSj_jnyYPj6Xe7HMOvkKYhJXV7Kuae6QDr2EoG7edDzHUHnhezpCqsyda3_bqfPMG2andNQh6wuAFuOC2uxk7DWvvvUZAsKovY7IfacI5HVqV2ORkRDGBDJwwr7smKXXkr0bT_h0i8EzI1",
                }}
                style={styles.centerImage}
                resizeMode="cover"
              />
              <View style={styles.centerCardBody}>
                <Text
                  style={[
                    styles.centerTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#151C27" },
                  ]}
                >
                  Pearl District Drop-off
                </Text>
                <View style={styles.chipsRow}>
                  <View
                    style={[
                      styles.chipPill,
                      {
                        backgroundColor: isDarkMode ? "#28322E" : "#DCE2F3",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkMode ? "#A8B5AD" : "#404944" },
                      ]}
                    >
                      Glass
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.chipPill,
                      {
                        backgroundColor: isDarkMode ? "#28322E" : "#DCE2F3",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkMode ? "#A8B5AD" : "#404944" },
                      ]}
                    >
                      Electronics
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.chipPill,
                      {
                        backgroundColor: isDarkMode ? "#28322E" : "#DCE2F3",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDarkMode ? "#A8B5AD" : "#404944" },
                      ]}
                    >
                      Plastic
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ------------------- FULL-SCREEN MODAL FOR BOOKING (Hides Bottom Tab Bar) ------------------- */}
        <Modal
          visible={viewState !== "home"}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setViewState("home")}
        >
          <View
            style={[
              styles.fullModalContainer,
              { backgroundColor: isDarkMode ? "#121212" : "#F3F7F5" },
            ]}
          >
            {/* SUB-VIEW: CHOOSE VEHICLE */}
            {viewState === "choose_vehicle" && (
              <View style={styles.fullScreenMapContainer}>
                <EcoliftMap
                  markers={mapMarkers}
                  routeCoordinates={routePolyline}
                  onMapPress={handleMapPress}
                  onMarkerDragEnd={handleMarkerDragEnd}
                  style={styles.fullMap}
                />

                <SafeAreaView style={styles.mapTopHeader}>
                  <TouchableOpacity
                    onPress={() => setViewState("home")}
                    style={[
                      styles.mapBackButton,
                      { backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF" },
                    ]}
                  >
                    <ChevronLeft size={22} color={C.text} />
                  </TouchableOpacity>
                </SafeAreaView>

                <View
                  style={[
                    styles.bottomSheet,
                    { backgroundColor: isDarkMode ? "#141716" : "#FFFFFF" },
                  ]}
                >
                  {/* Interactive Handle Bar: Tapping minimizes sheet back to home */}
                  <TouchableOpacity
                    style={styles.sheetHandleTouchArea}
                    onPress={() => setViewState("home")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sheetHandle} />
                  </TouchableOpacity>

                  <Text style={[styles.sheetHeaderTitle, { color: C.text }]}>
                    Choose a Vehicle
                  </Text>

                  {/* Option 1: Ecolift Tricycle */}
                  <TouchableOpacity
                    style={[
                      styles.vehicleOptionCard,
                      {
                        backgroundColor: isDarkMode ? "#1E2321" : "#FAFCFA",
                        borderColor: C.border,
                      },
                      selectedVehicle === "tricycle" && {
                        borderColor: isDarkMode
                          ? Colors.accent
                          : Colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedVehicle("tricycle")}
                    activeOpacity={0.9}
                  >
                    <View style={styles.vehicleInfoLeft}>
                      <View
                        style={[
                          styles.vehicleIconCircle,
                          { backgroundColor: "rgba(16, 185, 129, 0.1)" },
                        ]}
                      >
                        <Truck size={22} color="#10B981" />
                      </View>
                      <View>
                        <Text style={[styles.vehicleName, { color: C.text }]}>
                          Ecolift Tricycle
                        </Text>
                        <Text
                          style={[styles.vehicleMeta, { color: C.greyText }]}
                        >
                          4 min away · Up to 150 kg
                        </Text>
                      </View>
                    </View>

                    <View style={styles.vehicleInfoRight}>
                      <Text style={[styles.vehiclePrice, { color: C.text }]}>
                        GH₵ 25.00
                      </Text>
                      <View
                        style={[
                          styles.vehicleBadgePill,
                          { backgroundColor: "#DEF7EC" },
                        ]}
                      >
                        <Text style={styles.badgeTextFast}>⚡ Fastest</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Option 2: Ecolift Standard Truck */}
                  <TouchableOpacity
                    style={[
                      styles.vehicleOptionCard,
                      {
                        backgroundColor: isDarkMode ? "#1E2321" : "#FAFCFA",
                        borderColor: C.border,
                      },
                      selectedVehicle === "truck" && {
                        borderColor: isDarkMode
                          ? Colors.accent
                          : Colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedVehicle("truck")}
                    activeOpacity={0.9}
                  >
                    <View style={styles.vehicleInfoLeft}>
                      <View
                        style={[
                          styles.vehicleIconCircle,
                          { backgroundColor: "rgba(11, 61, 46, 0.1)" },
                        ]}
                      >
                        <Truck size={22} color={C.primary} />
                      </View>
                      <View>
                        <Text style={[styles.vehicleName, { color: C.text }]}>
                          Ecolift Standard Truck
                        </Text>
                        <Text
                          style={[styles.vehicleMeta, { color: C.greyText }]}
                        >
                          7 min away · Up to 500 kg
                        </Text>
                      </View>
                    </View>

                    <View style={styles.vehicleInfoRight}>
                      <Text style={[styles.vehiclePrice, { color: C.text }]}>
                        GH₵ 45.00
                      </Text>
                      <View
                        style={[
                          styles.vehicleBadgePill,
                          { backgroundColor: "#FEF3C7" },
                        ]}
                      >
                        <Text style={styles.badgeTextCheaper}>
                          💡 Best Value
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Option 3: Ecolift Heavy Hauler */}
                  <TouchableOpacity
                    style={[
                      styles.vehicleOptionCard,
                      {
                        backgroundColor: isDarkMode ? "#1E2321" : "#FAFCFA",
                        borderColor: C.border,
                      },
                      selectedVehicle === "heavy" && {
                        borderColor: isDarkMode
                          ? Colors.accent
                          : Colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedVehicle("heavy")}
                    activeOpacity={0.9}
                  >
                    <View style={styles.vehicleInfoLeft}>
                      <View
                        style={[
                          styles.vehicleIconCircle,
                          { backgroundColor: "rgba(245, 158, 11, 0.1)" },
                        ]}
                      >
                        <Package size={22} color="#F59E0B" />
                      </View>
                      <View>
                        <Text style={[styles.vehicleName, { color: C.text }]}>
                          Ecolift Heavy Hauler
                        </Text>
                        <Text
                          style={[styles.vehicleMeta, { color: C.greyText }]}
                        >
                          12 min away · Up to 2 Tons
                        </Text>
                      </View>
                    </View>

                    <View style={styles.vehicleInfoRight}>
                      <Text style={[styles.vehiclePrice, { color: C.text }]}>
                        GH₵ 85.00
                      </Text>
                      <View
                        style={[
                          styles.vehicleBadgePill,
                          { backgroundColor: "#E0E7FF" },
                        ]}
                      >
                        <Text style={styles.badgeTextHeavy}>📦 Heavy Load</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Bottom Action Bar */}
                  <View style={styles.sheetBottomActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.sheetDarkPrimaryBtn,
                        {
                          backgroundColor: isDarkMode
                            ? Colors.accent
                            : Colors.primary,
                        },
                      ]}
                      onPress={() => setViewState("confirm_pickup")}
                      activeOpacity={0.9}
                    >
                      <Text
                        style={[
                          styles.sheetDarkBtnText,
                          { color: isDarkMode ? "#000000" : "#FFFFFF" },
                        ]}
                      >
                        Choose{" "}
                        {selectedVehicle === "tricycle"
                          ? "Tricycle"
                          : selectedVehicle === "heavy"
                            ? "Heavy Hauler"
                            : "Standard Truck"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.calendarIconBtn,
                        { backgroundColor: isDarkMode ? "#242A28" : "#F0F4F2" },
                      ]}
                      onPress={() => {
                        setViewState("home");
                        router.push("/(tabs)/schedule" as any);
                      }}
                    >
                      <CalendarIcon size={20} color={C.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* SUB-VIEW: CONFIRM PICKUP */}
            {viewState === "confirm_pickup" && (
              <View style={styles.fullScreenMapContainer}>
                <EcoliftMap
                  markers={mapMarkers}
                  routeCoordinates={routePolyline}
                  onMapPress={handleMapPress}
                  onMarkerDragEnd={handleMarkerDragEnd}
                  style={styles.fullMap}
                />

                <SafeAreaView style={styles.mapTopHeader}>
                  <View style={styles.mapTopHeaderRow}>
                    <TouchableOpacity
                      onPress={() => setViewState("choose_vehicle")}
                      style={[
                        styles.mapBackButton,
                        { backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF" },
                      ]}
                    >
                      <ChevronLeft size={22} color={C.text} />
                    </TouchableOpacity>

                    {isMapPickingActive && (
                      <View
                        style={[
                          styles.mapPickingBanner,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(26, 31, 29, 0.95)"
                              : "rgba(255, 255, 255, 0.95)",
                            borderColor:
                              isMapPickingActive === "destination"
                                ? "#10B981"
                                : "#EF4444",
                          },
                        ]}
                      >
                        <MapPin
                          size={15}
                          color={
                            isMapPickingActive === "destination"
                              ? "#10B981"
                              : "#EF4444"
                          }
                        />
                        <Text
                          style={[styles.mapPickingText, { color: C.text }]}
                        >
                          Tap map to set{" "}
                          {isMapPickingActive === "destination"
                            ? "destination"
                            : "pickup"}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setIsMapPickingActive(null)}
                          style={styles.mapPickingCloseBtn}
                        >
                          <X size={14} color={C.greyText} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </SafeAreaView>

                <View
                  style={[
                    styles.bottomSheet,
                    { backgroundColor: isDarkMode ? "#141716" : "#FFFFFF" },
                  ]}
                >
                  {/* Interactive Handle Bar */}
                  <TouchableOpacity
                    style={styles.sheetHandleTouchArea}
                    onPress={() => setViewState("choose_vehicle")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sheetHandle} />
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.sheetHeaderTitle,
                      { color: C.text, marginBottom: 8 },
                    ]}
                  >
                    Confirm Pickup Request
                  </Text>

                  {/* Map Quick Action Buttons for Worldwide Map Picking */}
                  <View style={styles.mapQuickActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.mapActionChip,
                        isMapPickingActive === "pickup" && {
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          borderColor: "#EF4444",
                        },
                        {
                          backgroundColor: isDarkMode ? "#1E2321" : "#F0F4F2",
                          borderColor: C.border,
                        },
                      ]}
                      onPress={() =>
                        setIsMapPickingActive(
                          isMapPickingActive === "pickup" ? null : "pickup",
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <MapPin size={13} color="#EF4444" />
                      <Text
                        style={[styles.mapActionChipText, { color: C.text }]}
                      >
                        {isMapPickingActive === "pickup"
                          ? "📍 Tapping Map (Pickup)"
                          : "Pin Pickup on Map"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.mapActionChip,
                        isMapPickingActive === "destination" && {
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          borderColor: "#10B981",
                        },
                        {
                          backgroundColor: isDarkMode ? "#1E2321" : "#F0F4F2",
                          borderColor: C.border,
                        },
                      ]}
                      onPress={() =>
                        setIsMapPickingActive(
                          isMapPickingActive === "destination"
                            ? null
                            : "destination",
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Recycle size={13} color="#10B981" />
                      <Text
                        style={[styles.mapActionChipText, { color: C.text }]}
                      >
                        {isMapPickingActive === "destination"
                          ? "♻️ Tapping Map (Disposal)"
                          : "Pin Disposal on Map"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <GlassCard style={styles.locationDetailCard}>
                    {/* Editable Pickup Location */}
                    <TouchableOpacity
                      style={styles.locationItemRow}
                      onPress={() => {
                        beginLocationEditing("pickup");
                        setIsPickupEditModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.locPinCircle,
                          { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                        ]}
                      >
                        <MapPin size={16} color="#EF4444" />
                      </View>
                      <View style={styles.locTextContent}>
                        <Text style={[styles.locLabel, { color: C.greyText }]}>
                          Pickup Location (Tap to edit)
                        </Text>
                        <Text
                          style={[styles.locAddress, { color: C.text }]}
                          numberOfLines={1}
                        >
                          {pickupAddress}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.editBadge,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(182,255,60,0.15)"
                              : "rgba(11,61,46,0.08)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.editBadgeText,
                            {
                              color: isDarkMode
                                ? Colors.accent
                                : Colors.primary,
                            },
                          ]}
                        >
                          Edit
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.connectorLine} />

                    {/* Editable Disposal Station */}
                    <TouchableOpacity
                      style={styles.locationItemRow}
                      onPress={() => {
                        beginLocationEditing("disposal");
                        setIsDisposalModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.locPinCircle,
                          { backgroundColor: "rgba(16, 185, 129, 0.1)" },
                        ]}
                      >
                        <Recycle size={16} color="#10B981" />
                      </View>
                      <View style={styles.locTextContent}>
                        <Text style={[styles.locLabel, { color: C.greyText }]}>
                          Disposal / Eco-Station (Tap to edit)
                        </Text>
                        <Text
                          style={[styles.locAddress, { color: C.text }]}
                          numberOfLines={1}
                        >
                          {disposalAddress}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.editBadge,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(182,255,60,0.15)"
                              : "rgba(11,61,46,0.08)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.editBadgeText,
                            {
                              color: isDarkMode
                                ? Colors.accent
                                : Colors.primary,
                            },
                          ]}
                        >
                          Edit
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </GlassCard>

                  <View
                    style={[
                      styles.selectedVehicleSummary,
                      {
                        backgroundColor: isDarkMode ? "#1E2321" : "#F7FAF8",
                        borderColor: C.border,
                      },
                    ]}
                  >
                    <View style={styles.vehicleSummaryLeft}>
                      <Truck size={20} color={C.primary} />
                      <View>
                        <Text
                          style={[
                            styles.summaryVehicleTitle,
                            { color: C.text },
                          ]}
                        >
                          Ecolift Standard Truck
                        </Text>
                        <Text
                          style={[
                            styles.summaryVehicleMeta,
                            { color: C.greyText },
                          ]}
                        >
                          {estimatedMinutes} min away · Up to 500 kg
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.summaryVehiclePrice, { color: C.text }]}
                    >
                      GH₵ {pickupPrice.toFixed(2)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.paymentPillBar,
                      {
                        backgroundColor: isDarkMode ? "#1E2321" : "#F7FAF8",
                        borderColor: C.border,
                      },
                    ]}
                    onPress={() => {
                      setViewState("home");
                      router.push("/payment-methods" as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.paymentLeft}>
                      <CreditCard size={18} color={C.primary} />
                      <Text style={[styles.paymentText, { color: C.text }]}>
                        💵 Cash / Mobile Money
                      </Text>
                    </View>
                    <ChevronRight size={16} color={C.greyText} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmPrimaryBtn,
                      {
                        backgroundColor: isDarkMode
                          ? Colors.accent
                          : Colors.primary,
                      },
                    ]}
                    onPress={handleConfirmPickup}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.confirmBtnText,
                        { color: isDarkMode ? "#000000" : "#FFFFFF" },
                      ]}
                    >
                      Confirm Pickup Request
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SUB-VIEW: LOCATION EDITOR */}
            {viewState === "editing_location" && (
              <View style={styles.fullScreenMapContainer}>
                <EcoliftMap
                  markers={mapMarkers}
                  routeCoordinates={routePolyline}
                  onMapPress={handleMapPress}
                  onMarkerDragEnd={handleMarkerDragEnd}
                  style={styles.fullMap}
                />

                <SafeAreaView style={styles.mapTopHeader}>
                  <View style={styles.mapTopHeaderRow}>
                    <TouchableOpacity
                      onPress={cancelLocationEditing}
                      style={[
                        styles.mapBackButton,
                        { backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF" },
                      ]}
                    >
                      <X size={20} color={C.text} />
                    </TouchableOpacity>
                    <View
                      style={[
                        styles.mapPickingBanner,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(26, 31, 29, 0.95)"
                            : "rgba(255, 255, 255, 0.95)",
                          borderColor:
                            editingLocation === "pickup"
                              ? "#EF4444"
                              : "#10B981",
                        },
                      ]}
                    >
                      {editingLocation === "pickup" ? (
                        <MapPin size={15} color="#EF4444" />
                      ) : (
                        <Recycle size={15} color="#10B981" />
                      )}
                      <Text style={[styles.mapPickingText, { color: C.text }]}>
                        Tap the map to move{" "}
                        {editingLocation === "pickup" ? "pickup" : "disposal"}
                      </Text>
                    </View>
                  </View>
                </SafeAreaView>

                <View
                  style={[
                    styles.bottomSheet,
                    { backgroundColor: isDarkMode ? "#141716" : "#FFFFFF" },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.sheetHandleTouchArea}
                    onPress={cancelLocationEditing}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sheetHandle} />
                  </TouchableOpacity>
                  <Text style={[styles.sheetHeaderTitle, { color: C.text }]}>
                    Edit{" "}
                    {editingLocation === "pickup"
                      ? "Pickup Location"
                      : "Disposal / Eco-Station"}
                  </Text>
                  <Text
                    style={[
                      styles.locAddress,
                      { color: C.text, marginBottom: 14 },
                    ]}
                    numberOfLines={2}
                  >
                    {editingLocation === "pickup"
                      ? editingPickupAddress
                      : editingDisposalAddress}
                  </Text>
                  <View style={styles.trackingActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.confirmPrimaryBtn,
                        {
                          flex: 1,
                          backgroundColor: isDarkMode
                            ? Colors.accent
                            : Colors.primary,
                        },
                      ]}
                      onPress={confirmLocationEditing}
                      disabled={
                        editingLocation === "pickup"
                          ? !editingPickupLocation
                          : !editingDisposalLocation
                      }
                    >
                      <Text
                        style={[
                          styles.confirmBtnText,
                          { color: isDarkMode ? "#000000" : "#FFFFFF" },
                        ]}
                      >
                        Confirm Location
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.mapBackButton,
                        { backgroundColor: isDarkMode ? "#242A28" : "#F0F4F2" },
                      ]}
                      onPress={cancelLocationEditing}
                    >
                      <X size={20} color={C.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* SUB-VIEW: HIGH-END LIVE MAP TRACKING */}
            {viewState === "tracking" && (
              <View style={styles.fullScreenMapContainer}>
                <EcoliftMap
                  markers={mapMarkers}
                  routeCoordinates={routePolyline}
                  onMapPress={handleMapPress}
                  onMarkerDragEnd={handleMarkerDragEnd}
                  style={styles.fullMap}
                />

                {!hasAssignedCollector && (
                  <View
                    style={[
                      styles.searchingCollectorPanel,
                      { backgroundColor: isDarkMode ? "#141716" : "#FFFFFF" },
                    ]}
                  >
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text
                      style={[
                        styles.searchingCollectorTitle,
                        { color: C.text },
                      ]}
                    >
                      Finding a collector...
                    </Text>
                    <Text
                      style={[
                        styles.searchingCollectorSubtitle,
                        { color: C.greyText },
                      ]}
                    >
                      Your pickup request is being shared with available EcoLift
                      collectors.
                    </Text>
                    <TouchableOpacity
                      style={styles.searchingBackButton}
                      onPress={() => setViewState("home")}
                    >
                      <Text
                        style={[
                          styles.searchingBackButtonText,
                          { color: C.primary },
                        ]}
                      >
                        Back Home
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <SafeAreaView
                  style={[
                    styles.trackingTopHeader,
                    !hasAssignedCollector && styles.hiddenTrackingPanel,
                  ]}
                >
                  <View
                    style={[
                      styles.driverFloatingHeader,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(30, 35, 33, 0.95)"
                          : "rgba(255, 255, 255, 0.95)",
                        borderColor: C.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setViewState("home")}
                      style={styles.closeTrackingBtn}
                    >
                      <X size={18} color={C.text} />
                    </TouchableOpacity>

                    <View style={styles.driverInfoMeta}>
                      <View style={styles.driverAvatarCircle}>
                        <Text style={styles.driverAvatarText}>EC</Text>
                      </View>
                      <View>
                        <Text
                          style={[styles.driverNameText, { color: C.text }]}
                        >
                          EcoLift Collector
                        </Text>
                        <Text
                          style={[
                            styles.driverVehicleSub,
                            { color: C.greyText },
                          ]}
                        >
                          Assigned to your pickup
                        </Text>
                      </View>
                    </View>

                    <View style={styles.driverQuickActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionCirclePill,
                          { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                        ]}
                        onPress={() => router.push("/chat" as any)}
                      >
                        <PhoneCall size={16} color="#10B981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionCirclePill,
                          { backgroundColor: "rgba(59, 130, 246, 0.15)" },
                        ]}
                        onPress={() => router.push("/chat" as any)}
                      >
                        <MessageSquare size={16} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </SafeAreaView>

                <View
                  style={[
                    styles.bottomSheet,
                    !hasAssignedCollector && styles.hiddenTrackingPanel,
                    { backgroundColor: isDarkMode ? "#141716" : "#FFFFFF" },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.sheetHandleTouchArea}
                    onPress={() => setViewState("home")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sheetHandle} />
                  </TouchableOpacity>

                  <View style={styles.etaRingContainer}>
                    <View
                      style={[
                        styles.etaBadgeCircle,
                        {
                          backgroundColor: isDarkMode
                            ? Colors.accent
                            : Colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.etaNumberText,
                          { color: isDarkMode ? "#000000" : "#FFFFFF" },
                        ]}
                      >
                        7
                      </Text>
                      <Text
                        style={[
                          styles.etaUnitText,
                          { color: isDarkMode ? "#000000" : "#FFFFFF" },
                        ]}
                      >
                        MINS
                      </Text>
                    </View>
                    <View style={styles.etaTextContent}>
                      <Text
                        style={[styles.etaStatusHeading, { color: C.text }]}
                      >
                        {activeOrder?.status === "en_route"
                          ? "Collector En-Route"
                          : "Collector Assigned"}
                      </Text>
                      <Text
                        style={[styles.etaStatusSub, { color: C.greyText }]}
                      >
                        1.2 km away · Arriving at {pickupAddress.split(",")[0]}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressStepsRow}>
                    <View style={styles.stepItem}>
                      <View style={[styles.stepDot, styles.stepDoneDot]}>
                        <CheckCircle2 size={12} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.stepLabel, { color: C.text }]}>
                        Confirmed
                      </Text>
                    </View>

                    <View style={styles.stepLineActive} />

                    <View style={styles.stepItem}>
                      <View style={[styles.stepDot, styles.stepActiveDot]}>
                        <View style={styles.activePulseInner} />
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          { color: C.primary, fontFamily: "Poppins-Bold" },
                        ]}
                      >
                        En-Route
                      </Text>
                    </View>

                    <View style={styles.stepLineInactive} />

                    <View style={styles.stepItem}>
                      <View style={[styles.stepDot, styles.stepInactiveDot]} />
                      <Text style={[styles.stepLabel, { color: C.greyText }]}>
                        Arrived
                      </Text>
                    </View>
                  </View>

                  <View style={styles.trackingActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.confirmPrimaryBtn,
                        {
                          flex: 1,
                          backgroundColor: isDarkMode
                            ? Colors.accent
                            : Colors.primary,
                        },
                      ]}
                      onPress={() => setViewState("home")}
                    >
                      <Text
                        style={[
                          styles.confirmBtnText,
                          { color: isDarkMode ? "#000000" : "#FFFFFF" },
                        ]}
                      >
                        Done / Back Home
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Modal>

        {/* EDIT PICKUP LOCATION MODAL */}
        <Modal
          visible={isPickupEditModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsPickupEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContentCard,
                { backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF" },
              ]}
            >
              <View style={styles.searchModalHeader}>
                <Text style={[styles.searchModalTitle, { color: C.text }]}>
                  Edit Pickup Location
                </Text>
                <TouchableOpacity
                  onPress={() => setIsPickupEditModalVisible(false)}
                >
                  <X size={20} color={C.text} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.searchBoxInput,
                  {
                    borderColor: C.border,
                    backgroundColor: isDarkMode ? "#141716" : "#F7FAF8",
                  },
                ]}
              >
                <Search size={18} color={C.greyText} />
                <TextInput
                  style={[styles.searchInput, { color: C.text }]}
                  placeholder="Search any location worldwide..."
                  placeholderTextColor={C.greyText}
                  value={pickupEditQuery}
                  onChangeText={handlePickupEditSearch}
                  autoFocus
                />
                {isPickupEditSearching && (
                  <ActivityIndicator size="small" color={C.primary} />
                )}
              </View>

              {/* Action Button: Pick Directly on Map */}
              <TouchableOpacity
                style={[
                  styles.pickOnMapModalBtn,
                  {
                    backgroundColor: isDarkMode ? "#242B28" : "#EAF4EE",
                    borderColor: isDarkMode ? "#333D39" : "#D2E8DA",
                  },
                ]}
                onPress={() => {
                  setIsPickupEditModalVisible(false);
                  setIsMapPickingActive("pickup");
                  showAlert({
                    type: "info",
                    title: "Tap Map to Place Pickup",
                    message:
                      "Tap anywhere on the world map to drop your pickup location pin.",
                  });
                }}
                activeOpacity={0.8}
              >
                <MapPin size={16} color="#EF4444" />
                <Text style={[styles.pickOnMapModalBtnText, { color: C.text }]}>
                  📍 Or tap anywhere on the map to set pin
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.useTypedLocationBtn, { borderColor: C.border }]}
                onPress={applyTypedPickupAddress}
                disabled={!pickupEditQuery.trim() || isPickupEditSearching}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.useTypedLocationText, { color: C.primary }]}
                >
                  Use typed pickup address
                </Text>
              </TouchableOpacity>

              <FlatList
                data={pickupEditResults}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.locationResultRow,
                      { borderBottomColor: isDarkMode ? "#262D2A" : C.border },
                    ]}
                    onPress={() => handlePickupEditSelect(item)}
                  >
                    <View
                      style={[
                        styles.locResultIconCircle,
                        { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                      ]}
                    >
                      <MapPin size={16} color="#EF4444" />
                    </View>
                    <View style={styles.locResultText}>
                      <Text style={[styles.locName, { color: C.text }]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[styles.locArea, { color: C.greyText }]}
                        numberOfLines={1}
                      >
                        {item.area}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={C.greyText} />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* EDIT DISPOSAL STATION MODAL */}
        <Modal
          visible={isDisposalModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsDisposalModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContentCard,
                { backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF" },
              ]}
            >
              <View style={styles.searchModalHeader}>
                <Text style={[styles.searchModalTitle, { color: C.text }]}>
                  Select Disposal / Eco-Station
                </Text>
                <TouchableOpacity
                  onPress={() => setIsDisposalModalVisible(false)}
                >
                  <X size={20} color={C.text} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.searchBoxInput,
                  {
                    borderColor: C.border,
                    backgroundColor: isDarkMode ? "#141716" : "#F7FAF8",
                  },
                ]}
              >
                <Search size={18} color={C.greyText} />
                <TextInput
                  style={[styles.searchInput, { color: C.text }]}
                  placeholder="Search any recycling center or address worldwide..."
                  placeholderTextColor={C.greyText}
                  value={disposalSearchQuery}
                  onChangeText={handleDisposalSearch}
                  autoFocus
                />
                {isDisposalSearching && (
                  <ActivityIndicator size="small" color={C.primary} />
                )}
              </View>

              {/* Action Button: Pick Directly on Map */}
              <TouchableOpacity
                style={[
                  styles.pickOnMapModalBtn,
                  {
                    backgroundColor: isDarkMode ? "#242B28" : "#EAF4EE",
                    borderColor: isDarkMode ? "#333D39" : "#D2E8DA",
                  },
                ]}
                onPress={() => {
                  setIsDisposalModalVisible(false);
                  setIsMapPickingActive("destination");
                  showAlert({
                    type: "info",
                    title: "Tap Map to Place Destination",
                    message:
                      "Tap anywhere on the world map to drop your disposal station pin.",
                  });
                }}
                activeOpacity={0.8}
              >
                <Recycle size={16} color="#10B981" />
                <Text style={[styles.pickOnMapModalBtnText, { color: C.text }]}>
                  ♻️ Or tap anywhere on the map to set destination
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.useTypedLocationBtn, { borderColor: C.border }]}
                onPress={applyTypedDisposalAddress}
                disabled={!disposalSearchQuery.trim() || isDisposalSearching}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.useTypedLocationText, { color: C.primary }]}
                >
                  Use typed disposal address
                </Text>
              </TouchableOpacity>

              <FlatList
                data={disposalResults}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.locationResultRow,
                      { borderBottomColor: isDarkMode ? "#262D2A" : C.border },
                    ]}
                    onPress={() => handleDisposalSelect(item)}
                  >
                    <View
                      style={[
                        styles.locResultIconCircle,
                        { backgroundColor: "rgba(16,185,129,0.1)" },
                      ]}
                    >
                      <Recycle size={16} color="#10B981" />
                    </View>
                    <View style={styles.locResultText}>
                      <Text style={[styles.locName, { color: C.text }]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[styles.locArea, { color: C.greyText }]}
                        numberOfLines={1}
                      >
                        {item.area}
                      </Text>
                    </View>
                    {disposalAddress.includes(item.name) && (
                      <View
                        style={[
                          styles.activeCheckBadge,
                          {
                            backgroundColor: isDarkMode
                              ? Colors.accent
                              : Colors.primary,
                          },
                        ]}
                      >
                        <ChevronRight
                          size={12}
                          color={isDarkMode ? "#000" : "#fff"}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      <CustomAlert {...alertProps} />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
  },
  ambientGlowTop: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0, 53, 39, 0.08)",
  },
  ambientGlowBottom: {
    position: "absolute",
    top: 380,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(0, 108, 73, 0.07)",
  },
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 8 : 18,
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    letterSpacing: -0.5,
  },
  topRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    borderRadius: 22,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#95D3BA",
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeDot: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Poppins-Bold",
  },
  heroPickupCard: {
    width: "100%",
    height: 190,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroContentContainer: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 18,
    gap: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
  },
  heroRequestBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#006C49",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 8,
    shadowColor: "#006C49",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  heroRequestBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  impactCard: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  impactHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  impactTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  impactTitleText: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  impactBadgeText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
  },
  impactBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  gaugeContainer: {
    width: 76,
    height: 76,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeCenterText: {
    position: "absolute",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  metricsColumn: {
    flex: 1,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  metricName: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
  },
  metricValue: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  ecoTipCard: {
    width: "100%",
    height: 125,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  ecoTipContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    width: "75%",
    gap: 4,
  },
  ecoTipHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ecoTipTagText: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  ecoTipBodyText: {
    fontSize: 15,
    fontFamily: "Poppins-Bold",
    lineHeight: 20,
  },
  nearbySection: {
    width: "100%",
    marginBottom: 10,
  },
  nearbyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  nearbySectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllBtnText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  centerCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  centerImage: {
    width: "100%",
    height: 150,
  },
  centerCardBody: {
    padding: 14,
    gap: 8,
  },
  centerTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chipPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
  },
  searchBackdropOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 90,
  },
  locationSetterWrapper: {
    position: "relative",
    zIndex: 100,
    marginBottom: 14,
  },
  locationSetterWrapperActive: {
    zIndex: 1000,
    elevation: 25,
  },
  voicePillBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 22,
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  voicePillLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
    height: "100%",
  },
  micCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  voicePillTextInput: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    paddingVertical: 0,
  },
  voicePillText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    flex: 1,
  },
  pillClearBtn: {
    padding: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingDropdownCard: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 14,
    maxHeight: 300,
    zIndex: 1001,
    elevation: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  floatingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
    marginBottom: 4,
  },
  floatingHeaderText: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  floatingClearText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  floatingList: {
    maxHeight: 230,
  },
  locResultIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyResultsContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyResultsText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContentCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "80%",
  },
  searchModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  searchModalTitle: {
    fontSize: 17,
    fontFamily: "Poppins-Bold",
  },
  searchBoxInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  locationResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  locResultText: {
    flex: 1,
  },
  locName: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  locArea: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
  },
  fullModalContainer: {
    flex: 1,
  },
  fullScreenMapContainer: {
    flex: 1,
    position: "relative",
  },
  fullMap: {
    ...StyleSheet.absoluteFill,
  },
  mapTopHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 24,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  mapTopHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mapPickingBanner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  mapPickingText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  mapPickingCloseBtn: {
    padding: 4,
  },
  mapBackButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  hiddenTrackingPanel: {
    display: "none",
  },
  searchingCollectorPanel: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 32,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 20,
  },
  searchingCollectorTitle: {
    marginTop: 16,
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
  },
  searchingCollectorSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
  },
  searchingBackButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  searchingBackButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  sheetHandleTouchArea: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#C5D6CF",
  },
  sheetHeaderTitle: {
    fontSize: 17,
    fontFamily: "Poppins-Bold",
    marginBottom: 14,
    textAlign: "center",
  },
  vehicleOptionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  vehicleInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vehicleIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleName: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  vehicleMeta: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
  },
  vehicleInfoRight: {
    alignItems: "flex-end",
  },
  vehiclePrice: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    marginBottom: 2,
  },
  vehicleBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTextFast: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    color: "#047857",
  },
  badgeTextCheaper: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    color: "#B45309",
  },
  badgeTextHeavy: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    color: "#4338CA",
  },
  sheetBottomActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  sheetDarkPrimaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  sheetDarkBtnText: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  calendarIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  locationDetailCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  locationItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  locTextContent: {
    flex: 1,
  },
  locLabel: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
  },
  locAddress: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  connectorLine: {
    width: 2,
    height: 16,
    backgroundColor: "#E2ECE9",
    marginLeft: 15,
    marginVertical: 2,
  },
  selectedVehicleSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  vehicleSummaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryVehicleTitle: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  summaryVehicleMeta: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
  },
  summaryVehiclePrice: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  paymentPillBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paymentText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
  },
  confirmPrimaryBtn: {
    width: "100%",
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  trackingTopHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 24,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  driverFloatingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  closeTrackingBtn: {
    padding: 4,
  },
  driverInfoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  driverAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarText: {
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  driverNameText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  driverVehicleSub: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
  },
  driverQuickActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionCirclePill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  etaRingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  etaBadgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  etaNumberText: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    lineHeight: 22,
  },
  etaUnitText: {
    fontSize: 9,
    fontFamily: "Poppins-Bold",
    lineHeight: 10,
  },
  etaTextContent: {
    flex: 1,
  },
  etaStatusHeading: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  etaStatusSub: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
  },
  progressStepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDoneDot: {
    backgroundColor: "#10B981",
  },
  stepActiveDot: {
    backgroundColor: Colors.primary,
  },
  activePulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  stepInactiveDot: {
    backgroundColor: "#E5EDE8",
  },
  stepLineActive: {
    flex: 1,
    height: 2,
    backgroundColor: "#10B981",
    marginHorizontal: 6,
  },
  stepLineInactive: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5EDE8",
    marginHorizontal: 6,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
  },
  editBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editBadgeText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  activeCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  trackingActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  mapQuickActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  mapActionChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  mapActionChipText: {
    fontSize: 11,
    fontFamily: "Poppins-SemiBold",
  },
  pickOnMapModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  pickOnMapModalBtnText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  useTypedLocationBtn: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  useTypedLocationText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
});
