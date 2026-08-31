import { GlassCard } from "@/components/glass-card";
import { GradientBackground } from "@/components/gradient-background";
import { Colors, getColors } from "@/constants/theme";
import { Order, useApp } from "@/context/AppContext";
import { Construction, Home, Recycle, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterType = "all" | "completed" | "cancelled";

export default function OrderHistory() {
  const { orders, isDarkMode } = useApp();
  const C = getColors(isDarkMode);
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredOrders = orders.filter((o) => {
    if (filter === "completed") return o.status === "Completed";
    if (filter === "cancelled") return o.status === "Cancelled";
    return true;
  });

  const getWasteIcon = (type: string) => {
    const size = 20;
    const color = C.primary;
    switch (type.toLowerCase()) {
      case "household":
        return <Home size={size} color={color} />;
      case "commercial":
        return <Trash2 size={size} color={color} />;
      case "bulk/construction":
        return <Construction size={size} color={color} />;
      case "recyclables":
        return <Recycle size={size} color={color} />;
      default:
        return <Trash2 size={size} color={color} />;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const isCompleted = item.status === "Completed";

    return (
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconAndTitle}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(11, 61, 46, 0.05)",
                },
              ]}
            >
              {getWasteIcon(item.wasteType)}
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.wasteTypeText, { color: C.text }]}>
                {item.wasteType}
              </Text>
              <Text style={[styles.dateText, { color: C.greyText }]}>
                {item.date}
              </Text>
            </View>
          </View>

          <View style={styles.priceAndStatus}>
            <Text style={[styles.priceText, { color: C.text }]}>
              {item.price}
            </Text>
            <View
              style={[
                styles.statusPill,
                isCompleted
                  ? {
                      backgroundColor: isDarkMode
                        ? "rgba(182, 255, 60, 0.2)"
                        : Colors.accent,
                    }
                  : {
                      borderWidth: 1,
                      borderColor: C.border,
                      backgroundColor: "transparent",
                    },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isCompleted ? { color: C.primary } : { color: C.greyText },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: C.text }]}>
            Order History
          </Text>
          <Text style={[styles.headerSubtitle, { color: C.greyText }]}>
            View all your past garbage requests
          </Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(["all", "completed", "cancelled"] as FilterType[]).map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  isActive
                    ? { backgroundColor: C.primary }
                    : {
                        backgroundColor: isDarkMode ? "#2C2C2E" : Colors.white,
                        borderColor: C.border,
                        borderWidth: 1,
                      },
                ]}
                onPress={() => setFilter(f)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive
                      ? { color: isDarkMode ? "#000000" : "#FFFFFF" }
                      : { color: C.greyText },
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Scrollable list */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Trash2
                size={48}
                color={C.greyText}
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.emptyTitle, { color: C.text }]}>
                No Pickups Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: C.greyText }]}>
                You have not requested any pickups under this filter yet.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: Colors.greyText,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(11, 61, 46, 0.05)",
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 110, // Ensure bottom tab doesn't overlap
    gap: 12,
  },
  card: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(11, 61, 46, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    justifyContent: "center",
  },
  wasteTypeText: {
    fontSize: 15,
    fontFamily: "Poppins-Bold",
    color: Colors.textDark,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: Colors.greyText,
    marginTop: 2,
  },
  priceAndStatus: {
    alignItems: "flex-end",
    gap: 6,
  },
  priceText: {
    fontSize: 15,
    fontFamily: "Poppins-Bold",
    color: Colors.primary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: Colors.textDark,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: Colors.greyText,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});
