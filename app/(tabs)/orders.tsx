import { CustomAlert, useCustomAlert } from "@/components/custom-alert";
import { getColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  Scale,
  Truck,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ImpactOrder {
  id: string;
  title: string;
  weight: string;
  date: string;
  status: "Completed" | "Pending" | "Cancelled";
  image: string;
  pointsEarned: number;
  co2Saved: string;
  address: string;
}

const IMPACT_ORDERS: ImpactOrder[] = [
  {
    id: "ord-101",
    title: "Mixed Recycling",
    weight: "12.5 kg",
    date: "Oct 24, 2023",
    status: "Completed",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBK9e7LanzTjwQS0BZ8o3qyyapIOHrtYQfo65nB3TRj7wbY6I9FjSfkdNAdl6ssqiIPTvlPS4Hkl34Xk97S9tYJjnC39ZOcdGw6oxFbETyF0YlD1f_HSJVM2y_NHYzrVrYCXmPNKBB1n3udsbX57eBn2gbsKxzRAkaUGhR21PjT2x0w6FHkmbax8vA3zTgeZ22R13OHg7Jft_uSr6KCQWv1fU1SC9o3tRUTMc0bv6eZLRfdYFjCzOXM",
    pointsEarned: 45,
    co2Saved: "18.2 kg CO₂e",
    address: "18 Kojo Thompson Road, Accra",
  },
  {
    id: "ord-102",
    title: "E-Waste Collection",
    weight: "4.2 kg",
    date: "Oct 10, 2023",
    status: "Completed",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC55kch440C_nnUx90yOSMfpDsoaJJSIoIjGtG1fjPyqmPJWfGWYVPCxiI1JLHgW3Fxmx2iuvAFFhkoHldLTTmiDQNPX0CPhOtoudxznPO_g9PQDMCx6nVOQqxPNOVibIH0MGm8SZLvwbgu9l0P6CgWK2BfjDPjSx_W5saEIdExqQcwo1ATs30Xh4apUPuR8TkxHF0DnQNAXXrYtO17Hwkp6zdDynO6YP8rFGyWEoGsxTS9Syy6oAPk",
    pointsEarned: 80,
    co2Saved: "14.5 kg CO₂e",
    address: "12 Ring Road Central, Accra",
  },
  {
    id: "ord-103",
    title: "Organic & Yard Waste",
    weight: "28.0 kg",
    date: "Sep 28, 2023",
    status: "Completed",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCxO1AXrWNH-V7kXINgVN82U7al2Q2TT_iJ3Bmn19-LAnroO3WKvspb2rbvEeG-yp9zyLhP97Ii6QWrJizNgHSYdjGIi5FjMyFzqaSkOp-JvgVpyh90d2K2qCbZsacvhxQH_IXMVQwKR0BBQ6xRsKggzrzpAloL-PxsHbsNFal8_hBecyH3-QdJ3qyGBaRN7x4agL2Zd0CSVfTmzo1G4d9rvVPcQyxPUIOrg0fbrTXtOJDclXLRUdW-",
    pointsEarned: 35,
    co2Saved: "32.0 kg CO₂e",
    address: "Block 4, Airport Residential Area, Accra",
  },
];

export default function OrderHistory() {
  const router = useRouter();
  const { isDarkMode, orders } = useApp();
  const { user } = useAuth();
  const C = getColors(isDarkMode);
  const { showAlert, alertProps } = useCustomAlert();

  const [selectedOrder, setSelectedOrder] = useState<ImpactOrder | null>(null);

  // Map AppContext orders to ImpactOrder format for display, with fallback to static data
  const displayOrders: ImpactOrder[] =
    orders.length > 0
      ? orders.map((o, i) => ({
          id: o.id,
          title:
            o.wasteType.charAt(0).toUpperCase() +
            o.wasteType.slice(1) +
            " Pickup",
          weight: `${Math.floor(Math.random() * 20 + 5)} kg`,
          date: o.date,
          status: o.status as ImpactOrder["status"],
          image:
            IMPACT_ORDERS[i % IMPACT_ORDERS.length]?.image ??
            IMPACT_ORDERS[0].image,
          pointsEarned: Math.floor(Math.random() * 50 + 15),
          co2Saved: `${(Math.random() * 30 + 5).toFixed(1)} kg CO₂e`,
          address: "12 Ring Road Central, Accra",
        }))
      : IMPACT_ORDERS;

  return (
    <View style={[styles.container, { backgroundColor: C.screenBg }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
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
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.bellBtn,
                {
                  backgroundColor: isDarkMode ? "#1E2321" : "#FFFFFF",
                  borderColor: isDarkMode
                    ? "rgba(255,255,255,0.08)"
                    : "#E2E8F8",
                },
              ]}
              onPress={() => router.push("/notifications" as any)}
              activeOpacity={0.85}
            >
              <Bell size={18} color={isDarkMode ? "#95D3BA" : "#003527"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile" as any)}
              style={styles.avatarBtn}
              activeOpacity={0.8}
            >
              <Text style={[styles.headerProfileText, { color: C.greyText }]}>
                Profile
              </Text>
              <Image
                source={{
                  uri: user?.avatar_url || "https://lh3.googleusercontent.com/aida/AP1WRLvvebFOZ6ynMsVwLT_RhMB47PIf8hxioUnplUngiLRck_uwziGuo8q9YO5aj1foVEUmhejlyafL2z2OHqEPi7FC8azbJoc-ziJbt6qsF5SMnw3GGseHcRNMOLhOvVO7v71vEGCzSy99We7_7rFyQI5Xzz2j4GcrsBMMWBjTRHPbwqUwGF-tolAZtlI0fp2FGa_-ATEKQMsHpKcZA_Q1cKK8GQq6hUUor6q0TpvsuD-ZBS35WmtkQvEqKtrn1A2MHmfBS2lh9XHmQQ",
                }}
                style={styles.avatarImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title and Subtitle */}
          <View style={styles.titleSection}>
            <Text style={[styles.headingTitle, { color: C.text }]}>
              Your Impact Log
            </Text>
            <Text style={[styles.headingSub, { color: C.greyText }]}>
              A record of your environmental contributions.
            </Text>
          </View>

          {/* Impact Order Cards */}
          <View style={styles.ordersList}>
            {displayOrders.map((order) => (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: isDarkMode ? "#1A211E" : "#E7EEFE",
                    borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                  },
                ]}
              >
                {/* Hero Card Image */}
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={{ uri: order.image }}
                    style={styles.cardImage}
                  />

                  {/* Verified Badge */}
                  <View style={styles.verifiedBadge}>
                    <CheckCircle2 size={14} color="#00714D" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>

                {/* Card Content */}
                <View style={styles.cardBody}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={[styles.statusText, { color: C.greyText }]}>
                        {order.status.toUpperCase()}
                      </Text>
                      <Text style={[styles.cardTitle, { color: C.text }]}>
                        {order.title}
                      </Text>
                    </View>

                    <View style={styles.weightBadge}>
                      <Text style={styles.weightText}>{order.weight}</Text>
                    </View>
                  </View>

                  <View style={styles.dateRow}>
                    <Calendar size={16} color={C.greyText} />
                    <Text style={[styles.dateText, { color: C.greyText }]}>
                      {order.date}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.viewDetailsBtn,
                      {
                        backgroundColor: isDarkMode ? "#141A17" : "#FFFFFF",
                        borderColor: isDarkMode ? "#2B3530" : "#BFC9C3",
                      },
                    ]}
                    onPress={() => setSelectedOrder(order)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.viewDetailsText,
                        { color: isDarkMode ? "#95D3BA" : "#003527" },
                      ]}
                    >
                      View Details
                    </Text>
                    <ArrowRight
                      size={16}
                      color={isDarkMode ? "#95D3BA" : "#003527"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Lifetime Impact Mini-Dashboard */}
          <View style={styles.lifetimeImpactCard}>
            <Text style={styles.lifetimeTitle}>Lifetime Impact</Text>
            <View style={styles.lifetimeStatsRow}>
              <View style={styles.lifetimeStatBox}>
                <Scale size={20} color="#B0F0D6" style={{ marginBottom: 4 }} />
                <Text style={styles.lifetimeStatNum}>44.7</Text>
                <Text style={styles.lifetimeStatLabel}>KG DIVERTED</Text>
              </View>

              <View style={styles.lifetimeStatBox}>
                <Truck size={20} color="#B0F0D6" style={{ marginBottom: 4 }} />
                <Text style={styles.lifetimeStatNum}>12</Text>
                <Text style={styles.lifetimeStatLabel}>PICKUPS</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Order Details Modal */}
        <Modal
          visible={!!selectedOrder}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: isDarkMode ? "#141A17" : "#FFFFFF" },
              ]}
            >
              {selectedOrder && (
                <>
                  <Image
                    source={{ uri: selectedOrder.image }}
                    style={styles.modalHeaderImage}
                  />

                  <View style={styles.modalBody}>
                    <View style={styles.modalTopRow}>
                      <View>
                        <Text
                          style={[styles.modalOrderTitle, { color: C.text }]}
                        >
                          {selectedOrder.title}
                        </Text>
                        <Text
                          style={[styles.modalOrderDate, { color: C.greyText }]}
                        >
                          {selectedOrder.date} • {selectedOrder.weight}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setSelectedOrder(null)}
                        style={styles.modalCloseBtn}
                      >
                        <X size={20} color={C.text} />
                      </TouchableOpacity>
                    </View>

                    <View
                      style={[
                        styles.modalInfoCard,
                        {
                          backgroundColor: isDarkMode ? "#1C2420" : "#F0F3FF",
                          borderColor: isDarkMode ? "#2B3530" : "#DCE2F3",
                        },
                      ]}
                    >
                      <View style={styles.modalInfoRow}>
                        <Text
                          style={[styles.modalInfoLabel, { color: C.greyText }]}
                        >
                          CO₂ Diverted:
                        </Text>
                        <Text
                          style={[styles.modalInfoValue, { color: "#006C49" }]}
                        >
                          {selectedOrder.co2Saved}
                        </Text>
                      </View>

                      <View style={styles.modalInfoRow}>
                        <Text
                          style={[styles.modalInfoLabel, { color: C.greyText }]}
                        >
                          Eco-Points Earned:
                        </Text>
                        <Text
                          style={[styles.modalInfoValue, { color: "#006C49" }]}
                        >
                          +{selectedOrder.pointsEarned} Pts
                        </Text>
                      </View>

                      <View style={styles.modalInfoRow}>
                        <Text
                          style={[styles.modalInfoLabel, { color: C.greyText }]}
                        >
                          Location:
                        </Text>
                        <Text
                          style={[
                            styles.modalInfoValue,
                            { color: C.text, flex: 1, textAlign: "right" },
                          ]}
                        >
                          {selectedOrder.address}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.modalDoneBtn,
                        { backgroundColor: "#003527" },
                      ]}
                      onPress={() => {
                        setSelectedOrder(null);
                        router.push("/receipt" as any);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.modalDoneBtnText}>
                        View Receipt
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      <CustomAlert {...alertProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
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
  avatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerProfileText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#95D3BA",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 16,
  },
  titleSection: {
    marginTop: 4,
  },
  headingTitle: {
    fontSize: 26,
    fontFamily: "Poppins-Bold",
    letterSpacing: -0.5,
  },
  headingSub: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    marginTop: 2,
  },
  ordersList: {
    gap: 18,
  },
  orderCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageWrapper: {
    width: "100%",
    height: 170,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  verifiedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(108, 248, 187, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
    color: "#00714D",
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Poppins-Bold",
    marginTop: 2,
  },
  weightBadge: {
    backgroundColor: "#064E3B",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  weightText: {
    color: "#80BEA6",
    fontSize: 12,
    fontFamily: "Poppins-Bold",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  lifetimeImpactCard: {
    backgroundColor: "#003527",
    borderRadius: 20,
    padding: 18,
    gap: 12,
    marginTop: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  lifetimeTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Bold",
  },
  lifetimeStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  lifetimeStatBox: {
    flex: 1,
    backgroundColor: "#2B6954",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  lifetimeStatNum: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Poppins-Bold",
  },
  lifetimeStatLabel: {
    color: "#95D3BA",
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeaderImage: {
    width: "100%",
    height: 170,
  },
  modalBody: {
    padding: 20,
  },
  modalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalOrderTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
  modalOrderDate: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalInfoCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 18,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalInfoLabel: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
  },
  modalInfoValue: {
    fontSize: 13,
    fontFamily: "Poppins-Bold",
  },
  modalDoneBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDoneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
});
