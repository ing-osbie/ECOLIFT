import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/src/context/AuthContext";
import * as collectorService from "@/src/services/collector";
import { dispatchOrder } from "@/src/services/dispatch";
import * as notificationsService from "@/src/services/notifications";
import * as ordersService from "@/src/services/orders";
import * as schedulesService from "@/src/services/schedules";
import * as walletService from "@/src/services/wallet";
import { CollectorJob as DbCollectorJob } from "@/src/types/collector";
import { NotificationItem as DbNotification } from "@/src/types/notification";
import { CreateOrderInput, Order as DbOrder } from "@/src/types/order";
import { ScheduledPickup as DbSchedule } from "@/src/types/schedule";

export type BookingStep =
  | "idle"
  | "matching"
  | "choose_collector"
  | "payment"
  | "en_route"
  | "completed";

export type CollectorJobStep =
  | "idle"
  | "incoming"
  | "details"
  | "navigating"
  | "proof"
  | "payout";

export interface Collector {
  id: string;
  name: string;
  avatar: string;
  rating: string;
  price: number;
  vehicleName: string;
  vehicleImage: string;
  eta: string;
  plate: string;
}

export interface Order {
  id: string;
  date: string;
  wasteType: string;
  price: string;
  status: "Completed" | "Cancelled";
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "payment" | "match" | "system";
  time: string;
}

export interface ScheduledPickup {
  id: string;
  frequency: string;
  days: string[];
  address: string;
  wasteType: string;
  enabled: boolean;
}

export interface CollectorJob {
  id: string;
  date: string;
  wasteType: string;
  fare: string;
  rating: number;
  status: "Completed" | "Cancelled" | "Missed";
  customerName: string;
  address: string;
}

interface AppContextProps {
  // Common states
  userRole: "customer" | "collector";
  setUserRole: (role: "customer" | "collector") => void;
  switchRole: (role: "customer" | "collector") => Promise<void>;
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  walletBalance: number;
  topUpWallet: (amount: number, description?: string) => Promise<void>;
  debitWallet: (amount: number, description?: string) => Promise<void>;

  // Customer Booking flow
  currentBookingStep: BookingStep;
  setCurrentBookingStep: (step: BookingStep) => void;
  selectedWasteType: string;
  setSelectedWasteType: (type: string) => void;
  pickupAddress: string;
  setPickupAddress: (addr: string) => void;
  pickupDate: string;
  setPickupDate: (date: string) => void;
  bagsCount: number;
  setBagsCount: (count: number) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  selectedCollector: Collector | null;
  setSelectedCollector: (collector: Collector | null) => void;

  // Lists
  orders: Order[];
  addOrder: (order: Order) => void;
  notifications: NotificationItem[];
  addNotification: (notif: Omit<NotificationItem, "id" | "time">) => void;
  clearNotifications: () => void;
  schedules: ScheduledPickup[];
  saveSchedule: (schedule: ScheduledPickup) => void;
  toggleSchedule: (id: string, enabled: boolean) => void;

  // Customer Live Tracking Animation
  trackingProgress: number; // 0 to 1
  setTrackingProgress: (progress: number) => void;
  simulateTracking: () => void;
  resetBooking: () => void;

  // COLLECTOR SPECIFIC STATES
  isCollectorOnline: boolean;
  setIsCollectorOnline: (val: boolean) => void;
  isCollectorVerified: boolean;
  setIsCollectorVerified: (val: boolean) => void;
  frontIdUploaded: boolean;
  setFrontIdUploaded: (val: boolean) => void;
  backIdUploaded: boolean;
  setBackIdUploaded: (val: boolean) => void;

  // Collector Earnings
  collectorEarningsToday: number;
  collectorEarningsWeek: number;
  collectorEarningsMonth: number;
  addCollectorEarning: (amount: number) => void;

  // Collector Booking Job flow
  activeJobStep: CollectorJobStep;
  setActiveJobStep: (step: CollectorJobStep) => void;
  collectorJobs: CollectorJob[];
  addCollectorJob: (job: CollectorJob) => void;

  // Collector Navigation simulation progress
  navigationProgress: number; // 0 to 1
  setNavigationProgress: (progress: number) => void;
  simulateNavigation: () => void;
  resetCollectorJob: () => void;

  // Dark Mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // EcoPoints
  ecoPoints: number;
  setEcoPoints: (points: number) => void;
  addEcoPoints: (points: number) => void;

  // Create Pickup Order (backend-wired)
  createPickupOrder: (input: CreateOrderInput) => Promise<DbOrder | null>;

  // Data refresh from backend
  refreshData: () => Promise<void>;
  isLoadingData: boolean;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// ---- Mapping helpers between DB rows and UI-facing types ----

function mapDbOrderToUi(db: DbOrder): Order {
  const status: Order["status"] =
    db.status === "completed" ? "Completed" : "Cancelled";
  const date = db.created_at
    ? new Date(db.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  return {
    id: db.id,
    date,
    wasteType: db.waste_type.replace("_", "/"),
    price: `GHS ${Number(db.price).toFixed(2)}`,
    status,
  };
}

function mapDbNotificationToUi(db: DbNotification): NotificationItem {
  const type: NotificationItem["type"] =
    db.type === "payment" || db.type === "match" ? db.type : "system";
  const time = db.created_at
    ? new Date(db.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "Just now";
  return {
    id: db.id,
    title: db.title,
    body: db.body,
    type,
    time,
  };
}

function mapDbScheduleToUi(db: DbSchedule): ScheduledPickup {
  return {
    id: db.id,
    frequency: db.frequency,
    days: db.days ?? [],
    address: db.address ?? "",
    wasteType: db.waste_type.replace("_", "/"),
    enabled: db.enabled,
  };
}

function mapDbJobToUi(db: DbCollectorJob): CollectorJob {
  const status: CollectorJob["status"] =
    db.status === "completed"
      ? "Completed"
      : db.status === "cancelled"
        ? "Cancelled"
        : "Missed";
  const date = db.created_at
    ? new Date(db.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "—";
  return {
    id: db.id,
    date,
    wasteType: db.waste_type.replace("_", "/"),
    fare: `GHS ${Number(db.fare).toFixed(2)}`,
    rating: db.rating ?? 0,
    status,
    customerName: "Customer",
    address: db.pickup_address ?? "",
  };
}

export const AppContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();

  // Common states
  const [userRole, setUserRoleState] = useState<"customer" | "collector">(
    "customer",
  );

  const setUserRole = useCallback((_role: "customer" | "collector") => {
    // Role changes must come from the authenticated Supabase profile.
  }, []);

  const switchRole = useCallback(
    async (_role: "customer" | "collector") => {
      setUserRoleState(user?.role === "collector" ? "collector" : "customer");
    },
    [user?.role],
  );

  const [isOnboarded, setIsOnboardedState] = useState<boolean>(false);
  const setIsOnboarded = useCallback((val: boolean) => {
    setIsOnboardedState(val);
    AsyncStorage.setItem("@ecolift_onboarded", val ? "true" : "false").catch(
      () => {},
    );
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userPhone, setUserPhone] = useState<string>("");
  const [userName, setUserName] = useState<string>("Akwasi");
  const [walletBalance, setWalletBalance] = useState<number>(0.0);

  // Customer Booking states
  const [currentBookingStep, setCurrentBookingStep] =
    useState<BookingStep>("idle");
  const [selectedWasteType, setSelectedWasteType] =
    useState<string>("Household");
  const [pickupAddress, setPickupAddress] = useState<string>(
    "12 Ring Road Central, Accra",
  );
  const [pickupDate, setPickupDate] = useState<string>("Today, 11:30 AM");
  const [bagsCount, setBagsCount] = useState<number>(2);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("moolre_momo");
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(
    null,
  );

  // Customer Animation tracking
  const [trackingProgress, setTrackingProgress] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // COLLECTOR STATES
  const [isCollectorOnline, setIsCollectorOnline] = useState<boolean>(true);
  const [isCollectorVerified, setIsCollectorVerifiedState] =
    useState<boolean>(true);

  const setIsCollectorVerified = useCallback((val: boolean) => {
    setIsCollectorVerifiedState(val);
    AsyncStorage.setItem(
      "@ecolift_collector_verified",
      val ? "true" : "false",
    ).catch(() => {});
  }, []);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem("@ecolift_dark_mode", next ? "true" : "false").catch(
        () => {},
      );
      return next;
    });
  }, []);

  // EcoPoints
  const [ecoPoints, setEcoPointsState] = useState<number>(2450);
  const setEcoPoints = useCallback((points: number) => {
    setEcoPointsState(points);
    AsyncStorage.setItem("@ecolift_eco_points", points.toString()).catch(
      () => {},
    );
  }, []);
  const addEcoPoints = useCallback((points: number) => {
    setEcoPointsState((prev) => {
      const next = prev + points;
      AsyncStorage.setItem("@ecolift_eco_points", next.toString()).catch(
        () => {},
      );
      return next;
    });
  }, []);

  // Hydrate persisted state on mount
  useEffect(() => {
    AsyncStorage.getItem("@ecolift_user_role")
      .then((saved) => {
        if (saved === "customer" || saved === "collector") {
          setUserRoleState(saved);
        }
      })
      .catch(() => {});

    AsyncStorage.getItem("@ecolift_collector_verified")
      .then((saved) => {
        if (saved !== null) {
          setIsCollectorVerifiedState(saved === "true");
        }
      })
      .catch(() => {});

    AsyncStorage.getItem("@ecolift_onboarded")
      .then((saved) => {
        if (saved !== null) {
          setIsOnboardedState(saved === "true");
        }
      })
      .catch(() => {});

    AsyncStorage.getItem("@ecolift_dark_mode")
      .then((saved) => {
        if (saved !== null) {
          setIsDarkMode(saved === "true");
        }
      })
      .catch(() => {});

    AsyncStorage.getItem("@ecolift_eco_points")
      .then((saved) => {
        if (saved !== null) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed)) setEcoPointsState(parsed);
        }
      })
      .catch(() => {});
  }, []);
  const [frontIdUploaded, setFrontIdUploaded] = useState<boolean>(false);
  const [backIdUploaded, setBackIdUploaded] = useState<boolean>(false);

  const [collectorEarningsToday, setCollectorEarningsToday] =
    useState<number>(0);
  const [collectorEarningsWeek, setCollectorEarningsWeek] = useState<number>(0);
  const [collectorEarningsMonth, setCollectorEarningsMonth] =
    useState<number>(0);

  const [activeJobStep, setActiveJobStep] = useState<CollectorJobStep>("idle");
  const [navigationProgress, setNavigationProgress] = useState<number>(0);
  const [isNavSimulating, setIsNavSimulating] = useState<boolean>(false);

  // Lists (start empty; populated from backend when authenticated)
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduledPickup[]>([]);
  const [collectorJobs, setCollectorJobs] = useState<CollectorJob[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // ---- Backend data loading ----
  const refreshData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingData(true);
    try {
      // Wallet
      const wallet = await walletService.getWallet(user.id);
      if (wallet) setWalletBalance(Number(wallet.balance) || 0);

      // Orders
      const dbOrders = await ordersService.getOrders(user.id);
      setOrders(dbOrders.map(mapDbOrderToUi));

      // Notifications
      const dbNotifs = await notificationsService.getNotifications(user.id);
      setNotifications(dbNotifs.map(mapDbNotificationToUi));

      // Schedules
      const dbSchedules = await schedulesService.getSchedules(user.id);
      setSchedules(dbSchedules.map(mapDbScheduleToUi));

      // Collector data
      if (user.role === "collector") {
        const jobs = await collectorService.getCollectorJobs(user.id);
        setCollectorJobs(jobs.map(mapDbJobToUi));

        const earnings = await collectorService.getCollectorEarnings(user.id);
        if (earnings) {
          setCollectorEarningsToday(Number(earnings.week_earnings) || 0);
          setCollectorEarningsWeek(Number(earnings.week_earnings) || 0);
          setCollectorEarningsMonth(Number(earnings.month_earnings) || 0);
        }

        const profile = await collectorService.getMyCollectorProfile(user.id);
        if (profile) {
          setIsCollectorOnline(profile.is_online);
          setIsCollectorVerified(profile.is_verified);
        }
      }
    } catch (err) {
      console.warn("AppContext refreshData error:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, setIsCollectorVerified]);

  const hydrateAuthenticatedUser = useCallback(async () => {
    if (user?.id) {
      setUserName(user.full_name || "Ecolift User");
      setUserPhone(user.phone || "");
      setUserRoleState(user.role === "collector" ? "collector" : "customer");
      setIsLoggedIn(true);
      await refreshData();
    } else {
      // Reset to defaults when signed out
      setOrders([]);
      setNotifications([]);
      setSchedules([]);
      setCollectorJobs([]);
      setWalletBalance(0);
      setIsLoggedIn(false);
    }
  }, [user, refreshData]);

  // Load data when the authenticated user changes
  useEffect(() => {
    const timer = setTimeout(() => {
      void hydrateAuthenticatedUser();
    }, 0);

    return () => clearTimeout(timer);
  }, [hydrateAuthenticatedUser]);

  const topUpWallet = async (amount: number, description = "Wallet top-up") => {
    setWalletBalance((prev) => prev + amount);
    addNotification({
      title: "Wallet Topped Up",
      body: `Successfully added GHS ${amount.toFixed(2)} to your wallet.`,
      type: "payment",
    });
    // Persist to backend if authenticated
    if (user?.id) {
      try {
        await walletService.topUpWallet(amount, description);
      } catch (err) {
        console.warn("topUpWallet backend error:", err);
      }
    }
  };

  const debitWallet = async (amount: number, description = "Wallet debit") => {
    setWalletBalance((prev) => Math.max(0, prev - amount));
    addNotification({
      title: "Wallet Debited",
      body: `Deducted GHS ${amount.toFixed(2)}: ${description}`,
      type: "payment",
    });
    if (user?.id) {
      try {
        await walletService.debitWallet(amount, description);
      } catch (err) {
        console.warn("debitWallet backend error:", err);
      }
    }
  };

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const createPickupOrder = async (
    input: CreateOrderInput,
  ): Promise<DbOrder | null> => {
    try {
      const dbOrder = await ordersService.createOrder(input);
      if (dbOrder) {
        console.log("CUSTOMER: [ORDER CREATED]", dbOrder.id);
        console.log("CUSTOMER: [ORDER ID]", dbOrder.id);
        // The order remains real even when nobody is currently available. The
        // retry can be initiated later without inventing a local-only order.
        dispatchOrder(dbOrder.id).catch((error) =>
          console.warn("[DISPATCH PENDING]", error.message),
        );
        addOrder(mapDbOrderToUi(dbOrder));
        addNotification({
          title: "Pickup Confirmed",
          body: `Your ${dbOrder.waste_type} pickup has been booked.`,
          type: "match",
        });
        return dbOrder;
      }
    } catch (err) {
      console.warn("createPickupOrder backend error:", err);
    }

    // Offline drafts must never masquerade as dispatched orders: no collector
    // could receive them and the customer would wait forever.
    return null;
    /* Legacy local fallback retained below for reference.
    const fallbackOrder: DbOrder = {
      id: `local-order-${Date.now()}`,
      customer_id: user?.id || "local-user",
      waste_type: input.waste_type,
      pickup_lat: input.pickup_lat ?? null,
      pickup_lng: input.pickup_lng ?? null,
      pickup_address: input.pickup_address ?? null,
      disposal_lat: input.disposal_lat ?? null,
      disposal_lng: input.disposal_lng ?? null,
      disposal_address: input.disposal_address ?? null,
      bags_count: input.bags_count ?? 1,
      price: input.price ?? 45,
      status: "matching",
      payment_method: input.payment_method ?? "momo",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addOrder(mapDbOrderToUi(fallbackOrder));
    addNotification({
      title: "Pickup Confirmed",
      body: `Your ${fallbackOrder.waste_type} pickup has been booked.`,
      type: "match",
    });
    return fallbackOrder;
    */
  };

  const addNotification = (notif: Omit<NotificationItem, "id" | "time">) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: Math.random().toString(),
      time: "Just now",
    };
    setNotifications((prev) => [newNotif, ...prev]);
    // Persist to backend if authenticated
    if (user?.id) {
      notificationsService
        .sendNotification({
          title: notif.title,
          body: notif.body,
          type: notif.type,
        })
        .catch((err) => console.warn("sendNotification error:", err));
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    if (user?.id) {
      try {
        await notificationsService.clearNotifications(user.id);
      } catch (err) {
        console.warn("clearNotifications error:", err);
      }
    }
  };

  const saveSchedule = async (schedule: ScheduledPickup) => {
    setSchedules((prev) => {
      const idx = prev.findIndex((s) => s.id === schedule.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = schedule;
        return updated;
      }
      return [...prev, schedule];
    });
    addNotification({
      title: "Schedule Updated",
      body: `Recurring schedule for ${schedule.frequency} pickups saved.`,
      type: "system",
    });
    // Persist to backend if authenticated
    if (user?.id) {
      try {
        await schedulesService.createSchedule({
          frequency: schedule.frequency,
          days: schedule.days,
          address: schedule.address,
          waste_type: schedule.wasteType.toLowerCase() as any,
          enabled: schedule.enabled,
        });
      } catch (err) {
        console.warn("saveSchedule backend error:", err);
      }
    }
  };

  const toggleSchedule = async (id: string, enabled: boolean) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled } : s)),
    );
    if (user?.id) {
      try {
        await schedulesService.toggleSchedule(id, enabled);
      } catch (err) {
        console.warn("toggleSchedule backend error:", err);
      }
    }
  };

  // Simulate customer tracking (Customer flow)
  const simulateTracking = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setTrackingProgress(0);
  };

  useEffect(() => {
    let intervalId: any;
    if (isSimulating) {
      intervalId = setInterval(() => {
        setTrackingProgress((prev) => {
          if (prev >= 1) {
            clearInterval(intervalId);
            setIsSimulating(false);
            return 1;
          }
          return prev + 0.1; // 10 steps
        });
      }, 1000); // 10 seconds total
    }
    return () => clearInterval(intervalId);
  }, [isSimulating]);

  const resetBooking = () => {
    setTrackingProgress(0);
    setIsSimulating(false);
    setSelectedCollector(null);
    setCurrentBookingStep("idle");
  };

  // Collector Earnings
  const addCollectorEarning = (amount: number) => {
    setCollectorEarningsToday((prev) => prev + amount);
    setCollectorEarningsWeek((prev) => prev + amount);
    setCollectorEarningsMonth((prev) => prev + amount);
  };

  // Collector Job History Management
  const addCollectorJob = (job: CollectorJob) => {
    setCollectorJobs((prev) => [job, ...prev]);
  };

  // Collector Navigation Simulation
  const simulateNavigation = () => {
    if (isNavSimulating) return;
    setIsNavSimulating(true);
    setNavigationProgress(0);
  };

  useEffect(() => {
    let intervalId: any;
    if (isNavSimulating) {
      intervalId = setInterval(() => {
        setNavigationProgress((prev) => {
          if (prev >= 1) {
            clearInterval(intervalId);
            setIsNavSimulating(false);
            return 1;
          }
          return prev + 0.1; // 10 steps
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isNavSimulating]);

  const resetCollectorJob = () => {
    setNavigationProgress(0);
    setIsNavSimulating(false);
    setActiveJobStep("idle");
  };

  // Automated Job alert generation for online collectors
  useEffect(() => {
    let timeout: any;
    if (
      userRole === "collector" &&
      isLoggedIn &&
      isCollectorOnline &&
      activeJobStep === "idle"
    ) {
      // Prompt a job alert after 5 seconds of being online & idle
      timeout = setTimeout(() => {
        setActiveJobStep("incoming");
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [userRole, isLoggedIn, isCollectorOnline, activeJobStep]);

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        switchRole,
        isOnboarded,
        setIsOnboarded,
        isLoggedIn,
        setIsLoggedIn,
        userPhone,
        setUserPhone,
        userName,
        setUserName,
        walletBalance,
        topUpWallet,
        debitWallet,

        currentBookingStep,
        setCurrentBookingStep,
        selectedWasteType,
        setSelectedWasteType,
        pickupAddress,
        setPickupAddress,
        pickupDate,
        setPickupDate,
        bagsCount,
        setBagsCount,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        selectedCollector,
        setSelectedCollector,

        orders,
        addOrder,
        notifications,
        addNotification,
        clearNotifications,
        schedules,
        saveSchedule,
        toggleSchedule,

        trackingProgress,
        setTrackingProgress,
        simulateTracking,
        resetBooking,

        // Collector exports
        isCollectorOnline,
        setIsCollectorOnline,
        isCollectorVerified,
        setIsCollectorVerified,
        frontIdUploaded,
        setFrontIdUploaded,
        backIdUploaded,
        setBackIdUploaded,
        collectorEarningsToday,
        collectorEarningsWeek,
        collectorEarningsMonth,
        addCollectorEarning,
        activeJobStep,
        setActiveJobStep,
        collectorJobs,
        addCollectorJob,
        navigationProgress,
        setNavigationProgress,
        simulateNavigation,
        resetCollectorJob,

        // Dark Mode
        isDarkMode,
        toggleDarkMode,

        // EcoPoints
        ecoPoints,
        setEcoPoints,
        addEcoPoints,

        // Create Pickup Order
        createPickupOrder,

        // Data refresh
        refreshData,
        isLoadingData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return context;
};
