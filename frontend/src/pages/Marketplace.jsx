import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { loadStripe } from "@stripe/stripe-js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowUp,
  CalendarRange,
  Car,
  Eye,
  Fuel,
  Gauge,
  MapPin,
  Move,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  ShieldCheck,
  Sparkles,
  Star,
  Settings2,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { supabase } from "../utils/supabaseClient";
import AppDropdown from "../components/AppDropdown";
import bumpedSticker from "../assets/marketplace-stickers/bumpup.png";
import spotlightSticker from "../assets/marketplace-stickers/spotlight.png";
import urgentSticker from "../assets/marketplace-stickers/urgent.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  globalThis.process?.env?.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  "";
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : Promise.resolve(null);

const ALL_BRANDS = "__all_brands__";
const ALL_MODELS = "__all_models__";
const ALL_FUEL_TYPES = "__all_fuel_types__";
const ALL_LOCATION_REGIONS = "__all_location_regions__";
const ALL_LOCATION_CITIES = "__all_location_cities__";
const MARKETPLACE_PAGE_SIZE = 25;

const priceRangeValues = ["all", "under_3m", "3m_6m", "6m_10m", "above_10m"];

const sriLankaLocationRegions = [
  {
    key: "colombo",
    label: "Colombo",
    province: "Western Province",
    center: [6.9271, 79.8612],
    cities: ["Colombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Sri Jayawardenepura Kotte", "Malabe", "Maharagama", "Nugegoda", "Padukka", "Avissawella"],
  },
  {
    key: "gampaha",
    label: "Gampaha",
    province: "Western Province",
    center: [7.084, 80.0098],
    cities: ["Gampaha", "Negombo", "Kelaniya", "Wattala", "Ja-Ela", "Minuwangoda", "Kadawatha", "Ragama", "Kiribathgoda"],
  },
  {
    key: "kalutara",
    label: "Kalutara",
    province: "Western Province",
    center: [6.5854, 79.9607],
    cities: ["Kalutara", "Panadura", "Horana", "Beruwala", "Alutgama", "Matugama", "Bandaragama"],
  },
  {
    key: "kandy",
    label: "Kandy",
    province: "Central Province",
    center: [7.2906, 80.6337],
    cities: ["Kandy", "Gampola", "Nawalapitiya", "Peradeniya", "Akurana", "Kadugannawa", "Kundasale"],
  },
  {
    key: "matale",
    label: "Matale",
    province: "Central Province",
    center: [7.4675, 80.6234],
    cities: ["Matale", "Dambulla", "Sigiriya", "Pallepola", "Galewela", "Rattota"],
  },
  {
    key: "nuwara_eliya",
    label: "Nuwara Eliya",
    province: "Central Province",
    center: [6.9497, 80.7891],
    cities: ["Nuwara Eliya", "Hatton", "Talawakele", "Lindula", "Ginigathena", "Walapane"],
  },
  {
    key: "galle",
    label: "Galle",
    province: "Southern Province",
    center: [6.0535, 80.221],
    cities: ["Galle", "Hikkaduwa", "Ambalangoda", "Baddegama", "Bentota", "Karapitiya", "Elpitiya"],
  },
  {
    key: "matara",
    label: "Matara",
    province: "Southern Province",
    center: [5.9549, 80.555],
    cities: ["Matara", "Weligama", "Akuressa", "Deniyaya", "Dikwella", "Kekanadurra"],
  },
  {
    key: "hambantota",
    label: "Hambantota",
    province: "Southern Province",
    center: [6.1241, 81.1185],
    cities: ["Hambantota", "Tangalle", "Beliatta", "Ambalantota", "Tissamaharama"],
  },
  {
    key: "jaffna",
    label: "Jaffna",
    province: "Northern Province",
    center: [9.6615, 80.0255],
    cities: ["Jaffna", "Chavakachcheri", "Point Pedro", "Valvettithurai", "Nallur"],
  },
  {
    key: "kilinochchi",
    label: "Kilinochchi",
    province: "Northern Province",
    center: [9.3803, 80.377],
    cities: ["Kilinochchi", "Pallai", "Pooneryn"],
  },
  {
    key: "mannar",
    label: "Mannar",
    province: "Northern Province",
    center: [8.981, 79.9044],
    cities: ["Mannar", "Nanattan", "Madhu"],
  },
  {
    key: "vavuniya",
    label: "Vavuniya",
    province: "Northern Province",
    center: [8.7514, 80.4971],
    cities: ["Vavuniya", "Cheddikulam", "Nedunkeni"],
  },
  {
    key: "mullaitivu",
    label: "Mullaitivu",
    province: "Northern Province",
    center: [9.2671, 80.8142],
    cities: ["Mullaitivu", "Puthukkudiyiruppu", "Oddusuddan"],
  },
  {
    key: "trincomalee",
    label: "Trincomalee",
    province: "Eastern Province",
    center: [8.5874, 81.2152],
    cities: ["Trincomalee", "Kinniya", "Muttur", "Kantale"],
  },
  {
    key: "batticaloa",
    label: "Batticaloa",
    province: "Eastern Province",
    center: [7.7102, 81.6924],
    cities: ["Batticaloa", "Kattankudy", "Eravur", "Valaichchenai"],
  },
  {
    key: "ampara",
    label: "Ampara",
    province: "Eastern Province",
    center: [7.3018, 81.6747],
    cities: ["Ampara", "Akkaraipattu", "Kalmunai", "Sainthamaruthu", "Pottuvil"],
  },
  {
    key: "kurunegala",
    label: "Kurunegala",
    province: "North Western Province",
    center: [7.4863, 80.3647],
    cities: ["Kurunegala", "Kuliyapitiya", "Narammala", "Polgahawela", "Wariyapola", "Pannala", "Giriulla"],
  },
  {
    key: "puttalam",
    label: "Puttalam",
    province: "North Western Province",
    center: [8.0362, 79.8283],
    cities: ["Puttalam", "Chilaw", "Wennappuwa", "Marawila", "Dankotuwa", "Anamaduwa"],
  },
  {
    key: "anuradhapura",
    label: "Anuradhapura",
    province: "North Central Province",
    center: [8.3114, 80.4037],
    cities: ["Anuradhapura", "Kekirawa", "Tambuttegama", "Medawachchiya", "Mihintale"],
  },
  {
    key: "polonnaruwa",
    label: "Polonnaruwa",
    province: "North Central Province",
    center: [7.9403, 81.0188],
    cities: ["Polonnaruwa", "Kaduruwela", "Medirigiriya", "Hingurakgoda"],
  },
  {
    key: "badulla",
    label: "Badulla",
    province: "Uva Province",
    center: [6.9934, 81.055],
    cities: ["Badulla", "Bandarawela", "Haputale", "Welimada", "Mahiyanganaya", "Diyatalawa"],
  },
  {
    key: "moneragala",
    label: "Moneragala",
    province: "Uva Province",
    center: [6.8728, 81.3507],
    cities: ["Moneragala", "Wellawaya", "Buttala", "Kataragama", "Bibile"],
  },
  {
    key: "ratnapura",
    label: "Ratnapura",
    province: "Sabaragamuwa Province",
    center: [6.6828, 80.3992],
    cities: ["Ratnapura", "Balangoda", "Pelmadulla", "Embilipitiya", "Kuruwita"],
  },
  {
    key: "kegalle",
    label: "Kegalle",
    province: "Sabaragamuwa Province",
    center: [7.2513, 80.3464],
    cities: ["Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Ruwanwella"],
  },
];

const sriLankaMapBounds = {
  north: 10.05,
  south: 5.75,
  east: 82.1,
  west: 79.45,
};

const getCityMapPosition = (region, city) => {
  if (!region?.center || !city || city === ALL_LOCATION_CITIES) {
    return null;
  }

  const cityIndex = Math.max(region.cities.indexOf(city), 0);
  const angle = cityIndex * 1.618;
  const radius = 0.035 + (cityIndex % 4) * 0.018;

  return [
    region.center[0] + Math.sin(angle) * radius,
    region.center[1] + Math.cos(angle) * radius,
  ];
};

const normalizeLocationToken = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ district$/i, "");

const initialForm = {
  brand: "",
  model: "",
  seller_name: "",
  phone_number: "",
  vehicle_location: "",
  vehicle_description: "",
  year: "",
  mileage: "",
  fuel_type: "Petrol",
  transmission: "Automatic",
  condition: "Used",
  price: "",
};

const localeMap = {
  en: "en-LK",
  si: "si-LK",
  ta: "ta-LK",
};

const getLocale = (language) => localeMap[language] || "en-LK";

const formatCurrency = (value, locale) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value, locale) => Number(value || 0).toLocaleString(locale);

const getListingViewCount = (listing) => Number(listing?.view_count || listing?.views || 0);

const normalizeImageCollection = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim());
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string" && item.trim());
      }
    } catch {
      return [value];
    }
  }

  return [];
};

const getBoostSticker = (listing) => {
  if (listing?.is_spotlight) {
    return { src: spotlightSticker, alt: "Spotlight ad sticker" };
  }

  if (listing?.is_urgent) {
    return { src: urgentSticker, alt: "Urgent ad sticker" };
  }

  if (listing?.is_bumped) {
    return { src: bumpedSticker, alt: "Bump up ad sticker" };
  }

  return null;
};

const parseApiResponse = async (response, fallbackMessage) => {
  const rawText = await response.text();
  let result = {};

  if (rawText) {
    try {
      result = JSON.parse(rawText);
    } catch {
      throw new Error(fallbackMessage || "The server returned a non-JSON response.");
    }
  }

  if (!response.ok) {
    throw new Error(result.error || fallbackMessage || "Request failed.");
  }

  return result;
};

const fetchApprovedListingsFromSupabase = async () => {
  const marketplaceResult = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (!marketplaceResult.error) {
    return marketplaceResult.data || [];
  }

  const legacyResult = await supabase
    .from("listings")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (legacyResult.error) {
    throw new Error(legacyResult.error.message || marketplaceResult.error.message || "Failed to load marketplace listings.");
  }

  return legacyResult.data || [];
};

export const handlePayment = async (boostType, listingId) => {
  const stripe = await stripePromise;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!stripe) {
    throw new Error("Stripe is not configured on the frontend.");
  }

  if (!session?.access_token) {
    throw new Error("Please log in before paying for a boosted marketplace ad.");
  }

  const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(
      Array.isArray(boostType)
        ? {
            boost_types: boostType,
            listing_id: listingId,
          }
        : {
            boost_type: boostType,
            listing_id: listingId,
          }
    ),
  });

  const result = await parseApiResponse(response, "Unable to create Stripe checkout session.");

  const redirectResult = await stripe.redirectToCheckout({ sessionId: result.sessionId });
  if (redirectResult.error) {
    throw new Error(redirectResult.error.message || "Stripe checkout redirection failed.");
  }
};

const getListingPriority = (listing) => {
  if (listing?.is_bumped) return 3;
  if (listing?.is_spotlight) return 2;
  if (listing?.is_urgent) return 1;
  return 0;
};

function Marketplace() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = getLocale(i18n.resolvedLanguage);
  const [cars, setCars] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filters, setFilters] = useState({
    brand: ALL_BRANDS,
    model: ALL_MODELS,
    priceRange: "all",
    fuelType: ALL_FUEL_TYPES,
    locationRegion: ALL_LOCATION_REGIONS,
    locationCity: ALL_LOCATION_CITIES,
  });
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [publishLocation, setPublishLocation] = useState({
    district: "",
    city: "",
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitState, setSubmitState] = useState({ saving: false, error: "", success: "" });
  const [descriptionState, setDescriptionState] = useState({
    generating: false,
    error: "",
    source: "",
  });
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSpotlight, setIsSpotlight] = useState(false);
  const [isBumped, setIsBumped] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [visibleListingCount, setVisibleListingCount] = useState(MARKETPLACE_PAGE_SIZE);
  const [selectedCarImage, setSelectedCarImage] = useState("");
  const [lightboxImage, setLightboxImage] = useState("");
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isLightboxPanning, setIsLightboxPanning] = useState(false);
  const lightboxPanStartRef = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });

  const priceRanges = useMemo(
    () =>
      priceRangeValues.map((value) => ({
        value,
        label: t(`marketplace.price_ranges.${value}`),
      })),
    [t]
  );

  const translatedFuelLabels = useMemo(
    () => ({
      Petrol: t("marketplace.fuel_values.petrol"),
      Diesel: t("marketplace.fuel_values.diesel"),
      Hybrid: t("marketplace.fuel_values.hybrid"),
      Electric: t("marketplace.fuel_values.electric"),
    }),
    [t]
  );

  const translatedTransmissionLabels = useMemo(
    () => ({
      Automatic: t("marketplace.transmission_values.automatic"),
      Manual: t("marketplace.transmission_values.manual"),
      CVT: t("marketplace.transmission_values.cvt"),
    }),
    [t]
  );

  const translatedConditionLabels = useMemo(
    () => ({
      Used: t("marketplace.condition_values.used"),
      Reconditioned: t("marketplace.condition_values.reconditioned"),
      "Brand New": t("marketplace.condition_values.brand_new"),
    }),
    [t]
  );

  const toggleBoostSelection = useCallback((boostKey) => {
    const isSelected =
      (boostKey === "urgent" && isUrgent) ||
      (boostKey === "spotlight" && isSpotlight) ||
      (boostKey === "bumped" && isBumped);

    setIsUrgent(!isSelected && boostKey === "urgent");
    setIsSpotlight(!isSelected && boostKey === "spotlight");
    setIsBumped(!isSelected && boostKey === "bumped");
  }, [isBumped, isSpotlight, isUrgent]);

  const boostOptions = useMemo(
    () => [
      {
        key: "urgent",
        selected: isUrgent,
        toggle: () => toggleBoostSelection("urgent"),
        icon: Zap,
        title: t("marketplace.boost.urgent.title", { defaultValue: "Urgent Ad" }),
        description: t("marketplace.boost.urgent.description", { defaultValue: "Sell 2x faster with urgent visibility." }),
        price: 500,
        accentClassName: "marketplace-boost-card-urgent",
      },
      {
        key: "spotlight",
        selected: isSpotlight,
        toggle: () => toggleBoostSelection("spotlight"),
        icon: Star,
        title: t("marketplace.boost.spotlight.title", { defaultValue: "Spotlight" }),
        description: t("marketplace.boost.spotlight.description", { defaultValue: "Stay featured in the premium spotlight area." }),
        price: 750,
        accentClassName: "marketplace-boost-card-spotlight",
      },
      {
        key: "bumped",
        selected: isBumped,
        toggle: () => toggleBoostSelection("bumped"),
        icon: ArrowUp,
        title: t("marketplace.boost.bumped.title", { defaultValue: "Bump Up" }),
        description: t("marketplace.boost.bumped.description", { defaultValue: "Push your listing higher in recent results." }),
        price: 300,
        accentClassName: "marketplace-boost-card-bumped",
      },
    ],
    [isBumped, isSpotlight, isUrgent, t, toggleBoostSelection]
  );

  const totalBoostPrice = useMemo(
    () => boostOptions.reduce((sum, option) => sum + (option.selected ? option.price : 0), 0),
    [boostOptions]
  );

  const hasPremiumSelection = totalBoostPrice > 0;
  const selectedBoostTypes = useMemo(() => {
    const next = [];
    if (isUrgent) next.push("urgent");
    if (isSpotlight) next.push("spotlight");
    if (isBumped) next.push("bump");
    return next;
  }, [isBumped, isSpotlight, isUrgent]);

  const resetPublishFlow = () => {
    setForm(initialForm);
    setPublishLocation({ district: "", city: "" });
    setSelectedImages([]);
    setDescriptionState({ generating: false, error: "", source: "" });
    setIsUrgent(false);
    setIsSpotlight(false);
    setIsBumped(false);
    setIsPublishModalOpen(false);
  };

  useEffect(() => {
    let isActive = true;

    const syncAuthState = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isActive) {
        setIsAuthenticated(Boolean(session?.access_token));
      }
    };

    syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isActive) {
        setIsAuthenticated(Boolean(session?.access_token));
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const redirectToLogin = (authMessage, authSubMessage) => {
    navigate("/login", {
      state: {
        authMessage,
        authSubMessage,
      },
    });
  };

  const handleProtectedMarketplaceNavigation = (event) => {
    if (submitState.saving) {
      return;
    }

    if (!isAuthenticated) {
      event.preventDefault();
      redirectToLogin(
        "Please log in to access this page.",
        "Your listing status and seller activity are available only in your account."
      );
    }
  };

  const openPublishModal = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      redirectToLogin(
        "Please log in to access this page.",
        "Creating, managing, and boosting vehicle listings is available only for logged-in users."
      );
      return;
    }

    setSubmitState((current) => ({ ...current, error: "", success: "" }));
    setIsPublishModalOpen(true);
  };

  const createListing = async (boostOverrides) => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "vehicle_location") {
        formData.append(key, value);
      }
    });
    formData.append("vehicle_location", publishVehicleLocation);
    formData.append("is_urgent", String(boostOverrides?.is_urgent ?? isUrgent));
    formData.append("is_spotlight", String(boostOverrides?.is_spotlight ?? isSpotlight));
    formData.append("is_bumped", String(boostOverrides?.is_bumped ?? isBumped));
    selectedImages.filter(Boolean).forEach((file) => formData.append("images", file));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`${API_BASE_URL}/api/marketplace/listings`, {
      method: "POST",
      headers: session?.access_token
        ? {
            Authorization: `Bearer ${session.access_token}`,
          }
        : undefined,
      body: formData,
    });

    const result = await parseApiResponse(response, t("marketplace.errors.submit_failed"));

    return result;
  };

  const fetchListings = async () => {
    try {
      setLoadError("");

      const [supabaseResult, backendResult] = await Promise.allSettled([
        fetchApprovedListingsFromSupabase(),
        fetch(`${API_BASE_URL}/api/marketplace/listings`)
          .then((response) => parseApiResponse(response, t("marketplace.errors.load_failed")))
          .then((result) => result.listings || []),
      ]);

      const supabaseListings =
        supabaseResult.status === "fulfilled" ? supabaseResult.value : [];
      const backendApprovedListings =
        backendResult.status === "fulfilled"
          ? backendResult.value.filter((listing) => listing.status === "approved")
          : [];

      const mergedListings = [...supabaseListings];
      const seenKeys = new Set(
        supabaseListings.map((listing) =>
          [
            listing.brand,
            listing.model,
            listing.year,
            listing.price,
            listing.seller_name,
            listing.phone_number,
          ]
            .map((value) => String(value || "").trim().toLowerCase())
            .join("|")
        )
      );

      backendApprovedListings.forEach((listing) => {
        const key = [
          listing.brand,
          listing.model,
          listing.year,
          listing.price,
          listing.seller_name,
          listing.phone_number,
        ]
          .map((value) => String(value || "").trim().toLowerCase())
          .join("|");

        const existingIndex = mergedListings.findIndex((item) => {
          const sameId = item.id && listing.id && String(item.id) === String(listing.id);
          const sameKey =
            [
              item.brand,
              item.model,
              item.year,
              item.price,
              item.seller_name,
              item.phone_number,
            ]
              .map((value) => String(value || "").trim().toLowerCase())
              .join("|") === key;
          return sameId || sameKey;
        });

        if (existingIndex >= 0) {
          mergedListings[existingIndex] = {
            ...mergedListings[existingIndex],
            ...listing,
            view_count: Math.max(
              getListingViewCount(mergedListings[existingIndex]),
              getListingViewCount(listing)
            ),
          };
        } else if (!seenKeys.has(key)) {
          seenKeys.add(key);
          mergedListings.push(listing);
        }
      });

      if (mergedListings.length === 0) {
        throw new Error(t("marketplace.errors.load_failed"));
      }

      setCars(mergedListings);
    } catch (error) {
      setLoadError(error.message || t("marketplace.errors.load_failed"));
    }
  };

  useEffect(() => {
    fetchListings();
  }, [t]);

  const openListingDetails = (car) => {
    const nextViewCount = getListingViewCount(car) + 1;
    const optimisticCar = { ...car, view_count: nextViewCount };

    setSelectedCar(optimisticCar);
    setSelectedCarImage(getListingImages(car)[0] || "");
    setCars((current) =>
      current.map((item) =>
        String(item.id) === String(car.id) ? { ...item, view_count: nextViewCount } : item
      )
    );

    fetch(`${API_BASE_URL}/api/marketplace/listings/${encodeURIComponent(car.id)}/view`, {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to record listing view.");
        }
        return response.json();
      })
      .then((result) => {
        const syncedCount = Number(result.view_count || nextViewCount);
        setSelectedCar((current) =>
          current && String(current.id) === String(car.id)
            ? { ...current, view_count: syncedCount }
            : current
        );
        setCars((current) =>
          current.map((item) =>
            String(item.id) === String(car.id) ? { ...item, view_count: syncedCount } : item
          )
        );
      })
      .catch(() => {
        setSelectedCar((current) =>
          current && String(current.id) === String(car.id)
            ? { ...current, view_count: getListingViewCount(car) }
            : current
        );
        setCars((current) =>
          current.map((item) =>
            String(item.id) === String(car.id)
              ? { ...item, view_count: getListingViewCount(car) }
              : item
          )
        );
      });
  };

  const approvedCars = useMemo(
    () =>
      cars
        .filter((car) => car.status === "approved")
        .sort((left, right) => {
          const priorityDifference = getListingPriority(right) - getListingPriority(left);
          if (priorityDifference !== 0) {
            return priorityDifference;
          }

          const rightCreatedAt = new Date(right.created_at || 0).getTime();
          const leftCreatedAt = new Date(left.created_at || 0).getTime();
          return rightCreatedAt - leftCreatedAt;
        }),
    [cars]
  );

  const brandOptions = useMemo(
    () => [
      { value: ALL_BRANDS, label: t("marketplace.filters.all_brands") },
      ...Array.from(new Set(approvedCars.map((car) => car.brand).filter(Boolean))).map((brand) => ({
        value: brand,
        label: brand,
      })),
    ],
    [approvedCars, t]
  );

  const modelOptions = useMemo(
    () => [
      { value: ALL_MODELS, label: t("marketplace.filters.all_models") },
      ...Array.from(
        new Set(
        approvedCars
          .filter((car) => filters.brand === ALL_BRANDS || car.brand === filters.brand)
          .map((car) => car.model)
          .filter(Boolean)
        )
      ).map((model) => ({
        value: model,
        label: model,
      })),
    ],
    [approvedCars, filters.brand, t]
  );

  const fuelOptions = useMemo(
    () => [
      { value: ALL_FUEL_TYPES, label: t("marketplace.filters.all_fuel_types") },
      ...Array.from(new Set(approvedCars.map((car) => car.fuel_type).filter(Boolean))).map((fuel) => ({
        value: fuel,
        label: translatedFuelLabels[fuel] || fuel,
      })),
    ],
    [approvedCars, t, translatedFuelLabels]
  );

  const locationRegionOptions = useMemo(
    () => [
      {
        value: ALL_LOCATION_REGIONS,
        label: t("marketplace.filters.all_locations", { defaultValue: "All Sri Lanka" }),
      },
      ...sriLankaLocationRegions.map((region) => ({
        value: region.key,
        label: `${region.label} (${region.province})`,
      })),
    ],
    [t]
  );

  const selectedLocationRegion = useMemo(
    () => sriLankaLocationRegions.find((region) => region.key === filters.locationRegion) || null,
    [filters.locationRegion]
  );

  const locationCityOptions = useMemo(
    () => [
      {
        value: ALL_LOCATION_CITIES,
        label: selectedLocationRegion
          ? t("marketplace.filters.all_region_cities", {
              defaultValue: `Everywhere in ${selectedLocationRegion.label} District`,
            })
          : t("marketplace.filters.all_cities", { defaultValue: "All cities" }),
      },
      ...(selectedLocationRegion?.cities || []).map((city) => ({
        value: city,
        label: city,
      })),
    ],
    [selectedLocationRegion, t]
  );

  const publishSelectedDistrict = useMemo(
    () => sriLankaLocationRegions.find((region) => region.key === publishLocation.district) || null,
    [publishLocation.district]
  );

  const publishDistrictOptions = useMemo(
    () => [
      { value: "", label: "Choose district" },
      ...sriLankaLocationRegions.map((region) => ({
        value: region.key,
        label: `${region.label} (${region.province})`,
      })),
    ],
    []
  );

  const publishCityOptions = useMemo(
    () => [
      { value: "", label: publishSelectedDistrict ? "Choose city" : "Choose district first" },
      ...(publishSelectedDistrict?.cities || []).map((city) => ({
        value: city,
        label: city,
      })),
    ],
    [publishSelectedDistrict]
  );

  const publishVehicleLocation = useMemo(() => {
    if (!publishSelectedDistrict || !publishLocation.city) return "";
    return `${publishLocation.city}, ${publishSelectedDistrict.label}`;
  }, [publishLocation.city, publishSelectedDistrict]);

  const filteredCars = useMemo(() => {
    return approvedCars.filter((car) => {
      const normalizedSearch = appliedSearch.trim().toLowerCase();
      const vehicleName = [car.brand, car.model].filter(Boolean).join(" ").toLowerCase();
      const normalizedVehicleLocation = String(car.vehicle_location || "").trim().toLowerCase();
      const matchesSearch = !normalizedSearch || vehicleName.includes(normalizedSearch);
      const matchesBrand =
        filters.brand === ALL_BRANDS || car.brand === filters.brand;
      const matchesModel =
        filters.model === ALL_MODELS || car.model === filters.model;
      const matchesFuel =
        filters.fuelType === ALL_FUEL_TYPES || car.fuel_type === filters.fuelType;

      const price = Number(car.price || 0);
      const matchesPriceRange =
        filters.priceRange === "all" ||
        (filters.priceRange === "under_3m" && price < 3000000) ||
        (filters.priceRange === "3m_6m" && price >= 3000000 && price <= 6000000) ||
        (filters.priceRange === "6m_10m" && price > 6000000 && price <= 10000000) ||
        (filters.priceRange === "above_10m" && price > 10000000);

      const matchesLocationRegion =
        filters.locationRegion === ALL_LOCATION_REGIONS ||
        [
          selectedLocationRegion?.label,
          ...(selectedLocationRegion?.cities || []),
        ]
          .filter(Boolean)
          .some((locationTerm) => normalizedVehicleLocation.includes(locationTerm.toLowerCase()));

      const matchesLocationCity =
        filters.locationCity === ALL_LOCATION_CITIES ||
        normalizedVehicleLocation.includes(String(filters.locationCity).toLowerCase());

      return (
        matchesSearch &&
        matchesBrand &&
        matchesModel &&
        matchesFuel &&
        matchesPriceRange &&
        matchesLocationRegion &&
        matchesLocationCity
      );
    });
  }, [appliedSearch, approvedCars, filters, selectedLocationRegion]);

  const visibleCars = useMemo(
    () => filteredCars.slice(0, visibleListingCount),
    [filteredCars, visibleListingCount]
  );
  const hasMoreListings = visibleListingCount < filteredCars.length;

  useEffect(() => {
    setVisibleListingCount(MARKETPLACE_PAGE_SIZE);
  }, [appliedSearch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "brand" ? { model: ALL_MODELS } : {}),
      ...(key === "locationRegion" ? { locationCity: ALL_LOCATION_CITIES } : {}),
    }));
  };

  const handleInputChange = (key, value) => {
    const nextValue = key === "price" ? String(value).replace(/\D/g, "") : value;

    setForm((current) => ({
      ...current,
      [key]: nextValue,
    }));

    if (key === "vehicle_description" && descriptionState.error) {
      setDescriptionState((current) => ({
        ...current,
        error: "",
      }));
    }
  };

  const handleGenerateDescription = async () => {
    const brand = form.brand.trim();
    const model = form.model.trim();

    if (!brand || !model) {
      setDescriptionState({
        generating: false,
        error: "Enter the brand and model first, then generate a description.",
        source: "",
      });
      return;
    }

    setDescriptionState((current) => ({
      ...current,
      generating: true,
      error: "",
    }));

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please log in before generating a marketplace description.");
      }

      const response = await fetch(`${API_BASE_URL}/api/marketplace/generate-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          brand,
          model,
          year: form.year ? Number(form.year) : null,
          mileage: form.mileage ? Number(form.mileage) : null,
          fuel_type: form.fuel_type || null,
          transmission: form.transmission || null,
          condition: form.condition || null,
          vehicle_location: publishVehicleLocation || null,
        }),
      });

      const result = await parseApiResponse(response, "Unable to generate a vehicle description right now.");

      setForm((current) => ({
        ...current,
        vehicle_description: result.description || current.vehicle_description,
      }));
      setDescriptionState({
        generating: false,
        error: "",
        source: result.model || "",
      });
    } catch (error) {
      setDescriptionState({
        generating: false,
        error: error.message || "Unable to generate a vehicle description right now.",
        source: "",
      });
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  const handleSearchReset = () => {
    setSearchInput("");
    setAppliedSearch("");
  };

  const handleImageChange = (slotIndex, event) => {
    const file = event.target.files?.[0] || null;
    setSelectedImages((current) => {
      const next = [...current];
      next[slotIndex] = file;
      return next.slice(0, 5);
    });
  };

  const handleRemoveImage = (slotIndex) => {
    setSelectedImages((current) => {
      const next = [...current];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitState({ saving: true, error: "", success: "" });

    try {
      if (!publishVehicleLocation) {
        throw new Error("Choose the vehicle district and city before submitting the ad.");
      }

      await createListing();
      setSubmitState({
        saving: false,
        error: "",
        success: t("marketplace.success.submitted"),
      });
      resetPublishFlow();
      fetchListings();
    } catch (error) {
      setSubmitState({
        saving: false,
        error: error.message || t("marketplace.errors.submit_failed"),
        success: "",
      });
    }
  };

  const handlePublishFormSubmit = async (event) => {
    event.preventDefault();

    if (!publishVehicleLocation) {
      setSubmitState({
        saving: false,
        error: "Choose the vehicle district and city before submitting the ad.",
        success: "",
      });
      return;
    }

    if (!publishVehicleLocation) {
      setDescriptionState({
        generating: false,
        error: "Choose the vehicle district and city first, then generate a description.",
        source: "",
      });
      return;
    }

    if (hasPremiumSelection) {
      setSubmitState({ saving: true, error: "", success: "" });

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Please log in before adding a paid boost to your marketplace ad.");
        }

        const result = await createListing({
          is_urgent: false,
          is_spotlight: false,
          is_bumped: false,
        });
        const createdListingId = result?.listing?.id;

        if (!createdListingId) {
          throw new Error("Listing was created without an id for payment.");
        }

        await handlePayment(selectedBoostTypes, createdListingId);
        setSubmitState({ saving: false, error: "", success: "" });
      } catch (error) {
        setSubmitState({
          saving: false,
          error: error.message || "Unable to start Stripe checkout.",
          success: "",
        });
      }
      return;
    }

    await handleSubmit();
  };


  const getListingImages = (car) => {
    const images = normalizeImageCollection(car?.image_urls);
    if (images.length > 0) return images;
    return normalizeImageCollection(car?.image_url);
  };

  const selectedCarImages = useMemo(() => getListingImages(selectedCar), [selectedCar]);

  const lightboxIndex = useMemo(
    () => selectedCarImages.findIndex((imageUrl) => imageUrl === lightboxImage),
    [lightboxImage, selectedCarImages]
  );

  const openLightbox = (imageUrl) => {
    if (!imageUrl) return;
    setLightboxImage(imageUrl);
  };

  const closeLightbox = () => {
    setLightboxImage("");
    setIsLightboxPanning(false);
  };

  const resetLightboxView = () => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const zoomLightboxIn = () => {
    setLightboxZoom((zoom) => Math.min(Number((zoom + 0.5).toFixed(2)), 4));
  };

  const zoomLightboxOut = () => {
    setLightboxZoom((zoom) => {
      const nextZoom = Math.max(Number((zoom - 0.5).toFixed(2)), 1);
      if (nextZoom === 1) {
        setLightboxPan({ x: 0, y: 0 });
      }
      return nextZoom;
    });
  };

  const handleLightboxWheel = (event) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      zoomLightboxIn();
      return;
    }
    zoomLightboxOut();
  };

  const handleLightboxImageClick = () => {
    if (lightboxZoom === 1) {
      setLightboxZoom(2);
    }
  };

  const showPreviousLightboxImage = () => {
    if (selectedCarImages.length <= 1) return;
    const currentIndex = lightboxIndex >= 0 ? lightboxIndex : 0;
    const nextIndex = (currentIndex - 1 + selectedCarImages.length) % selectedCarImages.length;
    setLightboxImage(selectedCarImages[nextIndex]);
    setSelectedCarImage(selectedCarImages[nextIndex]);
  };

  const showNextLightboxImage = () => {
    if (selectedCarImages.length <= 1) return;
    const currentIndex = lightboxIndex >= 0 ? lightboxIndex : 0;
    const nextIndex = (currentIndex + 1) % selectedCarImages.length;
    setLightboxImage(selectedCarImages[nextIndex]);
    setSelectedCarImage(selectedCarImages[nextIndex]);
  };

  const handleLightboxPointerDown = (event) => {
    if (lightboxZoom <= 1) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    lightboxPanStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: lightboxPan.x,
      panY: lightboxPan.y,
    };
    setIsLightboxPanning(true);
  };

  const handleLightboxPointerMove = (event) => {
    if (!isLightboxPanning || lightboxZoom <= 1) return;
    const start = lightboxPanStartRef.current;
    setLightboxPan({
      x: start.panX + event.clientX - start.pointerX,
      y: start.panY + event.clientY - start.pointerY,
    });
  };

  const stopLightboxPanning = (event) => {
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsLightboxPanning(false);
  };

  useEffect(() => {
    resetLightboxView();
    setIsLightboxPanning(false);
  }, [lightboxImage]);

  useEffect(() => {
    if (!lightboxImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeLightbox();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousLightboxImage();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextLightboxImage();
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomLightboxIn();
      }

      if (event.key === "-") {
        event.preventDefault();
        zoomLightboxOut();
      }

      if (event.key === "0") {
        event.preventDefault();
        resetLightboxView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, lightboxIndex, selectedCarImages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const sessionId = params.get("session_id");

    if (paymentStatus !== "success" || !sessionId) return;

    let cancelled = false;

    const syncStripePayment = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = await fetch(`${API_BASE_URL}/api/verify-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? {
                  Authorization: `Bearer ${session.access_token}`,
                }
              : {}),
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        const result = await parseApiResponse(response, "Unable to verify Stripe payment.");

        if (cancelled) return;

        setSubmitState({
          saving: false,
          error: "",
          success: "Payment successful. Your boosted listing was published and synced.",
        });
        resetPublishFlow();
        fetchListings();

        params.delete("payment");
        params.delete("session_id");
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
        window.history.replaceState({}, "", nextUrl);
      } catch (error) {
        if (cancelled) return;

        setSubmitState({
          saving: false,
          error: error.message || "Stripe payment verification failed.",
          success: "",
        });
      }
    };

    syncStripePayment();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="marketplace-page app-page-shell">
      <div className="marketplace-redesign-hero animate-fade-in">
        <div>
          <div className="marketplace-redesign-eyebrow">{t("marketplace.redesigned.eyebrow")}</div>
          <h1>{t("marketplace.redesigned.title")}</h1>
          <p>{t("marketplace.redesigned.subtitle")}</p>
        </div>
        <div className="marketplace-redesign-hero-actions">
          <Link
            to="/marketplace/my-ads"
            onClick={handleProtectedMarketplaceNavigation}
            className="marketplace-redesign-ghost-button"
          >
            {t("marketplace.my_ads.title", { defaultValue: "My submitted ads" })}
          </Link>
          <button type="button" onClick={openPublishModal} className="marketplace-redesign-primary-button">
            <Plus className="h-3.5 w-3.5" />
            {t("marketplace.publish.button", { defaultValue: "Publish Ad" })}
          </button>
        </div>
      </div>

      <section className="mb-3 animate-fade-in">
        <form onSubmit={handleSearchSubmit}>
          <div className="marketplace-redesign-search">
            <Search className="marketplace-redesign-search-icon" />
            <input
              id="marketplace-vehicle-search"
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("marketplace.search.placeholder", {
                defaultValue: "Try Toyota Corolla, Honda Vezel, Prius...",
              })}
              className="marketplace-redesign-search-input"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleSearchReset}
                className="marketplace-redesign-clear-button"
                aria-label={t("marketplace.search.clear", { defaultValue: "Clear search" })}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button type="submit" className="marketplace-redesign-search-button">
              <Search className="h-[13px] w-[13px]" />
              {t("marketplace.search.submit", { defaultValue: "Search ads" })}
            </button>
          </div>
        </form>
      </section>

      {!appliedSearch && (
      <section className="marketplace-redesign-cta animate-fade-in animate-delay-200">
        <div className="marketplace-redesign-cta-copy">
          <Car className="h-4 w-4" />
          <div>
            <h2>{t("marketplace.redesigned.cta_title")}</h2>
            <p>{t("marketplace.redesigned.cta_subtitle")}</p>
          </div>
        </div>

        <button type="button" onClick={openPublishModal} className="marketplace-redesign-cta-button">
          Submit a listing -&gt;
        </button>

          {submitState.success && (
            <div className="marketplace-redesign-success">
              {submitState.success}
            </div>
          )}
      </section>
      )}

      <section className="marketplace-filter-panel marketplace-redesign-filter-panel animate-fade-in animate-delay-100">
        <div className="marketplace-redesign-filter-bar">
          <FilterSelect
            label={t("marketplace.labels.brand")}
            value={filters.brand}
            options={brandOptions}
            onChange={(value) => handleFilterChange("brand", value)}
            hideLabel
            className="marketplace-compact-dropdown"
          />
          <div className="marketplace-filter-divider" />
          <FilterSelect
            label={t("marketplace.labels.model")}
            value={filters.model}
            options={modelOptions}
            onChange={(value) => handleFilterChange("model", value)}
            hideLabel
            className="marketplace-compact-dropdown"
          />
          <div className="marketplace-filter-divider" />
          <FilterSelect
            label={t("marketplace.labels.price_range")}
            value={filters.priceRange}
            options={priceRanges}
            onChange={(value) => handleFilterChange("priceRange", value)}
            hideLabel
            className="marketplace-compact-dropdown"
          />
          <div className="marketplace-filter-divider" />
          <FilterSelect
            label={t("marketplace.labels.fuel_type")}
            value={filters.fuelType}
            options={fuelOptions}
            onChange={(value) => handleFilterChange("fuelType", value)}
            hideLabel
            className="marketplace-compact-dropdown"
          />
          <div className="marketplace-filter-divider" />
          <LocationPickerButton
            label={t("marketplace.labels.location", { defaultValue: "Location" })}
            value={
              selectedLocationRegion
                ? filters.locationCity === ALL_LOCATION_CITIES
                  ? `${selectedLocationRegion.label} District`
                  : `${filters.locationCity}, ${selectedLocationRegion.label}`
                : t("marketplace.filters.all_locations", { defaultValue: "All Sri Lanka" })
            }
            onClick={() => setIsLocationPickerOpen(true)}
            hideLabel
            compact
          />
          <div className="marketplace-results-pill">
            {formatNumber(filteredCars.length, locale)} listings
          </div>
        </div>

        {loadError && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {loadError}
          </div>
        )}
      </section>

      <section className="mt-4 animate-fade-in animate-delay-200">
        <div className="marketplace-redesign-section-heading">
          <div>
            <h2>{t("marketplace.redesigned.approved_title")}</h2>
            <p>{t("marketplace.redesigned.approved_subtitle")}</p>
          </div>
          <AppDropdown
            label=""
            value="newest"
            options={[
              { value: "newest", label: "Newest first" },
              { value: "price_low", label: "Price: Low to high" },
              { value: "price_high", label: "Price: High to low" },
              { value: "most_viewed", label: "Most viewed" },
            ]}
            onChange={() => {}}
            className="marketplace-sort-dropdown"
          />
        </div>

        {filteredCars.length === 0 ? (
          <div className="marketplace-redesign-empty">
            <SearchX className="h-8 w-8" />
            <h3>{t("marketplace.redesigned.no_listings_title")}</h3>
            <p>{t("marketplace.redesigned.no_listings_subtitle")}</p>
            <button type="button" onClick={handleSearchReset} className="marketplace-redesign-empty-button">
              Clear filters
            </button>
          </div>
        ) : (
          <>
          <div className="marketplace-redesign-grid">
            {visibleCars.map((car) => (
              <article
                key={car.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  openListingDetails(car);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openListingDetails(car);
                  }
                }}
                className="marketplace-listing-card marketplace-redesign-card group"
              >
                <div className="marketplace-listing-media marketplace-redesign-card-media">
                  {getListingImages(car)[0] ? (
                    <img
                      src={getListingImages(car)[0]}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="marketplace-redesign-card-fallback">
                      <ShieldCheck className="h-9 w-9" />
                    </div>
                  )}

                  <div className="marketplace-redesign-status-badge">
                    {t("marketplace.card.approved", { defaultValue: "Approved" })}
                  </div>
                  {getBoostSticker(car) && (
                    <img
                      src={getBoostSticker(car).src}
                      alt={getBoostSticker(car).alt}
                      className="marketplace-redesign-boost-sticker"
                    />
                  )}
                </div>

                <div className="marketplace-redesign-card-body">
                  <div>
                    <div>
                      <h3 title={`${car.brand} ${car.model}`}>
                        {car.brand} {car.model}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {(car.condition && translatedConditionLabels[car.condition]) ||
                          car.condition ||
                          t("marketplace.fallbacks.used_vehicle")}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {car.seller_name || t("marketplace.fallbacks.private_seller")} {" • "} {car.vehicle_location || t("marketplace.fallbacks.location_not_listed")}
                      </p>
                    </div>
                    <div>
                      <p className="marketplace-price">
                        {formatCurrency(car.price, locale)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MarketplaceMeta
                      icon={<CalendarRange className="h-4 w-4" />}
                      label={t("marketplace.labels.year")}
                      value={car.year || "-"}
                    />
                    <MarketplaceMeta
                      icon={<Gauge className="h-4 w-4" />}
                      label={t("marketplace.labels.mileage")}
                      value={t("marketplace.values.km", { value: formatNumber(car.mileage, locale) })}
                    />
                    <MarketplaceMeta
                      icon={<Fuel className="h-4 w-4" />}
                      label={t("marketplace.labels.fuel")}
                      value={translatedFuelLabels[car.fuel_type] || car.fuel_type || "-"}
                    />
                    <MarketplaceMeta
                      icon={<Settings2 className="h-4 w-4" />}
                      label={t("marketplace.labels.gearbox")}
                      value={translatedTransmissionLabels[car.transmission] || car.transmission || "-"}
                    />
                  </div>

                  <div className="marketplace-redesign-card-footer">
                    <span className="marketplace-redesign-location">
                      <MapPin className="h-3 w-3" />
                      {car.vehicle_location || t("marketplace.fallbacks.location_not_listed")}
                    </span>
                    <span className="marketplace-redesign-views">
                      <Eye className="h-3 w-3" />
                      {formatNumber(getListingViewCount(car), locale)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {hasMoreListings && (
            <div className="marketplace-show-more-wrap">
              <button
                type="button"
                className="marketplace-show-more-button"
                onClick={() =>
                  setVisibleListingCount((current) =>
                    Math.min(current + MARKETPLACE_PAGE_SIZE, filteredCars.length)
                  )
                }
              >
                Show More
                <span>{formatNumber(filteredCars.length - visibleCars.length, locale)} more ads</span>
              </button>
            </div>
          )}
          </>
        )}
      </section>

      {selectedCar && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
            onClick={() => setSelectedCar(null)}
          />

          <section className="marketplace-detail-modal relative z-10 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[30px] border border-slate-700/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94),rgba(30,41,59,0.96))] shadow-2xl shadow-slate-950/50">
            <div className="grid lg:grid-cols-[1.2fr_0.9fr]">
              <div className="relative min-h-[320px] border-b border-slate-800 lg:min-h-[620px] lg:border-b-0 lg:border-r">
                {selectedCarImage ? (
                  <button
                    type="button"
                    onClick={() => openLightbox(selectedCarImage)}
                    className="block h-full w-full"
                  >
                    <img
                      src={selectedCarImage}
                      alt={`${selectedCar.brand} ${selectedCar.model}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))] text-slate-500">
                    <ShieldCheck className="h-14 w-14 text-cyan-300/70" />
                    <p className="text-sm text-slate-300">{t("marketplace.detail.approved_listing")}</p>
                  </div>
                )}

                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  {t("marketplace.detail.approved_by_admin")}
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{t("marketplace.detail.listing")}</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">
                      {selectedCar.brand} {selectedCar.model}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {t("marketplace.detail.description")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCar(null)}
                    className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500/80 hover:text-white"
                  >
                    {t("marketplace.common.close")}
                  </button>
                </div>

                <div className="mt-6 rounded-[24px] border border-cyan-500/15 bg-cyan-500/10 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">{t("marketplace.labels.price")}</p>
                  <p className="marketplace-price mt-2 text-3xl font-bold text-cyan-100">
                    {formatCurrency(selectedCar.price, locale)}
                  </p>
                </div>

                {getListingImages(selectedCar).length > 1 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                    {getListingImages(selectedCar).map((imageUrl, index) => (
                      <button
                        key={`${selectedCar.id}-image-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedCarImage(imageUrl);
                          openLightbox(imageUrl);
                        }}
                        className={`h-20 w-24 shrink-0 overflow-hidden rounded-2xl border transition ${
                          selectedCarImage === imageUrl
                            ? "border-cyan-400/60 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                            : "border-slate-700/70 hover:border-slate-500/80"
                        }`}
                      >
                        <img src={imageUrl} alt={`${selectedCar.brand} ${selectedCar.model} view ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 1115 0A17.933 17.933 0 0112 21.75a17.933 17.933 0 01-7.5-1.632z" />
                      </svg>
                    }
                    label={t("marketplace.labels.seller")}
                    value={selectedCar.seller_name || "-"}
                  />
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 6.75c0 7.318 5.932 13.25 13.25 13.25h.75a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.965-.852-1.089l-4.423-1.106a1.125 1.125 0 00-1.173.417l-.97 1.293a1.125 1.125 0 01-1.21.38 10.502 10.502 0 01-6.273-6.273 1.125 1.125 0 01.38-1.21l1.293-.97c.328-.246.5-.652.417-1.173L4.96 3.602A1.125 1.125 0 003.872 2.75H2.5A2.25 2.25 0 00.25 5v1.75z" />
                      </svg>
                    }
                    label={t("marketplace.labels.phone")}
                    value={selectedCar.phone_number || "-"}
                  />
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21a8.967 8.967 0 005.002-1.516A8.967 8.967 0 0021 12c0-4.971-4.029-9-9-9s-9 4.029-9 9a8.967 8.967 0 003.998 7.484A8.967 8.967 0 0012 21zm0-13.5a2.25 2.25 0 110 4.5 2.25 2.25 0 010-4.5z" />
                      </svg>
                    }
                    label={t("marketplace.labels.location")}
                    value={selectedCar.vehicle_location || "-"}
                  />
                  <MarketplaceMeta
                    icon={<CalendarRange className="h-4 w-4" />}
                    label={t("marketplace.labels.year")}
                    value={selectedCar.year || "-"}
                  />
                  <MarketplaceMeta
                    icon={<Gauge className="h-4 w-4" />}
                    label={t("marketplace.labels.mileage")}
                    value={t("marketplace.values.km", { value: formatNumber(selectedCar.mileage, locale) })}
                  />
                  <MarketplaceMeta
                    icon={<Fuel className="h-4 w-4" />}
                    label={t("marketplace.labels.fuel")}
                    value={translatedFuelLabels[selectedCar.fuel_type] || selectedCar.fuel_type || "-"}
                  />
                  <MarketplaceMeta
                    icon={
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 18.75h7.5m-7.5-13.5h7.5M9 7.5h6a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0115 16.5H9a2.25 2.25 0 01-2.25-2.25v-4.5A2.25 2.25 0 019 7.5z" />
                      </svg>
                    }
                    label={t("marketplace.labels.gearbox")}
                    value={translatedTransmissionLabels[selectedCar.transmission] || selectedCar.transmission || "-"}
                  />
                  <MarketplaceMeta
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label={t("marketplace.labels.condition")}
                    value={translatedConditionLabels[selectedCar.condition] || selectedCar.condition || "-"}
                  />
                  <MarketplaceMeta
                    icon={<Sparkles className="h-4 w-4" />}
                    label={t("marketplace.labels.status")}
                    value={t("marketplace.detail.approved_visible")}
                  />
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t("marketplace.detail.section_description")}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
                    {selectedCar.vehicle_description || t("marketplace.fallbacks.no_description")}
                  </p>
                </div>

                <div className="mt-6 rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t("marketplace.detail.section_summary")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {t("marketplace.detail.summary_text", {
                      brand: selectedCar.brand,
                      model: selectedCar.model,
                      condition:
                        translatedConditionLabels[selectedCar.condition] ||
                        selectedCar.condition ||
                        t("marketplace.fallbacks.vehicle"),
                      year: selectedCar.year || t("marketplace.fallbacks.unspecified_year"),
                      mileage: formatNumber(selectedCar.mileage, locale),
                      fuel:
                        translatedFuelLabels[selectedCar.fuel_type] ||
                        selectedCar.fuel_type ||
                        t("marketplace.fallbacks.unspecified_fuel"),
                      transmission:
                        translatedTransmissionLabels[selectedCar.transmission] ||
                        selectedCar.transmission ||
                        t("marketplace.fallbacks.standard_transmission"),
                    })}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>,
        document.body
      )}

      {lightboxImage && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-3 sm:p-5">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute inset-0 cursor-default"
            aria-label={t("marketplace.lightbox.close_full_view")}
          />

          <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden">
            {selectedCarImages.length > 1 && (
              <button
                type="button"
                onClick={showPreviousLightboxImage}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700/70 bg-slate-900/90 p-3 text-slate-200 transition hover:border-slate-500/80 hover:text-white md:left-6"
                aria-label={t("marketplace.lightbox.previous_image")}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            <div
              className="flex h-full w-full items-center justify-center overflow-hidden rounded-[24px]"
              onWheel={handleLightboxWheel}
            >
              <div
                onPointerDown={handleLightboxPointerDown}
                onPointerMove={handleLightboxPointerMove}
                onPointerUp={stopLightboxPanning}
                onPointerCancel={stopLightboxPanning}
                onClick={handleLightboxImageClick}
                onDoubleClick={lightboxZoom > 1 ? resetLightboxView : zoomLightboxIn}
                className={`flex max-h-[92vh] max-w-[96vw] select-none items-center justify-center transition-transform duration-150 ${
                  lightboxZoom > 1
                    ? isLightboxPanning
                      ? "cursor-grabbing"
                      : "cursor-grab"
                    : "cursor-zoom-in"
                }`}
                style={{
                  transform: `translate3d(${lightboxPan.x}px, ${lightboxPan.y}px, 0) scale(${lightboxZoom})`,
                  transformOrigin: "center",
                  touchAction: lightboxZoom > 1 ? "none" : "auto",
                }}
              >
                <img
                  src={lightboxImage}
                  alt={t("marketplace.lightbox.full_vehicle_view")}
                  draggable={false}
                  className="max-h-[92vh] max-w-[96vw] select-none object-contain"
                />
              </div>
            </div>

            {selectedCarImages.length > 1 && (
              <button
                type="button"
                onClick={showNextLightboxImage}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700/70 bg-slate-900/90 p-3 text-slate-200 transition hover:border-slate-500/80 hover:text-white md:right-6"
                aria-label={t("marketplace.lightbox.next_image")}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}

            <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/90 px-3 py-2 text-slate-200 shadow-xl shadow-slate-950/40 backdrop-blur md:top-4">
              <button
                type="button"
                onClick={zoomLightboxOut}
                disabled={lightboxZoom <= 1}
                className="rounded-full p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-12 text-center text-xs font-semibold tabular-nums">
                {Math.round(lightboxZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomLightboxIn}
                disabled={lightboxZoom >= 4}
                className="rounded-full p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="mx-1 h-5 w-px bg-slate-700" aria-hidden="true" />
              <button
                type="button"
                onClick={resetLightboxView}
                className="rounded-full p-2 transition hover:bg-white/10"
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <span
                className={`hidden items-center gap-1 rounded-full px-2 py-1 text-xs md:inline-flex ${
                  lightboxZoom > 1 ? "bg-cyan-500/15 text-cyan-100" : "text-slate-500"
                }`}
                title={lightboxZoom > 1 ? "Drag the image to move it" : "Zoom in to move the image"}
              >
                <Move className="h-3.5 w-3.5" />
                Move
              </span>
            </div>

            {selectedCarImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/85 px-4 py-2 text-xs text-slate-200">
                <span>
                  {lightboxIndex + 1} / {selectedCarImages.length}
                </span>
                <span className="text-slate-500">{t("marketplace.lightbox.keyboard_hint")} • + / - zoom</span>
              </div>
            )}

            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-2 top-3 rounded-full border border-slate-700/70 bg-slate-900/90 p-3 text-slate-200 transition hover:border-slate-500/80 hover:text-white md:right-4 md:top-4"
              aria-label={t("marketplace.common.close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {isLocationPickerOpen && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
            onClick={() => setIsLocationPickerOpen(false)}
          />
          <section
            className="marketplace-location-modal relative z-10 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[30px] border border-slate-700/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94),rgba(30,41,59,0.96))] p-5 shadow-2xl shadow-slate-950/50 md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                  {t("marketplace.location_filter.eyebrow", { defaultValue: "Location filter" })}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {t("marketplace.location_filter.modal_title", { defaultValue: "Choose a Sri Lanka area" })}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {t("marketplace.location_filter.modal_description", {
                    defaultValue: "Choose a district first, then narrow the results to a city inside that district.",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationPickerOpen(false)}
                className="rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500/80 hover:text-white"
              >
                {t("marketplace.common.close")}
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <FilterSelect
                  label={t("marketplace.labels.location_area", { defaultValue: "District" })}
                  value={filters.locationRegion}
                  options={locationRegionOptions}
                  onChange={(value) => handleFilterChange("locationRegion", value)}
                />
                <FilterSelect
                  label={t("marketplace.labels.location_city", { defaultValue: "City" })}
                  value={filters.locationCity}
                  options={locationCityOptions}
                  onChange={(value) => handleFilterChange("locationCity", value)}
                />

                <div className="rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t("marketplace.location_filter.current", { defaultValue: "Current selection" })}
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {selectedLocationRegion
                      ? filters.locationCity === ALL_LOCATION_CITIES
                        ? `${selectedLocationRegion.label} District`
                        : `${filters.locationCity}, ${selectedLocationRegion.label}`
                      : t("marketplace.filters.all_locations", { defaultValue: "All Sri Lanka" })}
                  </p>
                  {selectedLocationRegion && (
                    <p className="mt-1 text-sm text-slate-400">{selectedLocationRegion.province}</p>
                  )}
                </div>
              </div>

              <DistrictCityPicker
                regions={sriLankaLocationRegions}
                selectedRegionKey={filters.locationRegion}
                selectedCity={filters.locationCity}
                onSelectDistrict={(value) => handleFilterChange("locationRegion", value)}
                onSelectCity={(value) => handleFilterChange("locationCity", value)}
              />
            </div>
          </section>
        </div>,
        document.body
      )}

      {isPublishModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !submitState.saving && setIsPublishModalOpen(false)}
          />
          <section
            className="marketplace-publish-modal relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-slate-950/50 md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">{t("marketplace.publish.modal_title")}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {t("marketplace.publish.modal_description")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                disabled={submitState.saving}
                className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("marketplace.common.close")}
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handlePublishFormSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("marketplace.labels.brand")}
                  value={form.brand}
                  onChange={(value) => handleInputChange("brand", value)}
                  placeholder="Toyota"
                />
                <InputField
                  label={t("marketplace.labels.model")}
                  value={form.model}
                  onChange={(value) => handleInputChange("model", value)}
                  placeholder="Corolla"
                />
                <InputField
                  label={t("marketplace.labels.your_name")}
                  value={form.seller_name}
                  onChange={(value) => handleInputChange("seller_name", value)}
                  placeholder="Kasun Perera"
                />
                <InputField
                  label={t("marketplace.labels.phone_number")}
                  value={form.phone_number}
                  onChange={(value) => handleInputChange("phone_number", value)}
                  placeholder="0771234567"
                />
                <InputField
                  label={t("marketplace.labels.year")}
                  type="number"
                  value={form.year}
                  onChange={(value) => handleInputChange("year", value)}
                  placeholder="2020"
                />
                <InputField
                  label={t("marketplace.labels.mileage_km")}
                  type="number"
                  value={form.mileage}
                  onChange={(value) => handleInputChange("mileage", value)}
                  placeholder="45000"
                />
                <SelectField
                  label={t("marketplace.labels.fuel_type")}
                  value={form.fuel_type}
                  options={[
                    { value: "Petrol", label: t("marketplace.fuel_values.petrol") },
                    { value: "Diesel", label: t("marketplace.fuel_values.diesel") },
                    { value: "Hybrid", label: t("marketplace.fuel_values.hybrid") },
                    { value: "Electric", label: t("marketplace.fuel_values.electric") },
                  ]}
                  onChange={(value) => handleInputChange("fuel_type", value)}
                />
                <SelectField
                  label={t("marketplace.labels.transmission")}
                  value={form.transmission}
                  options={[
                    { value: "Automatic", label: t("marketplace.transmission_values.automatic") },
                    { value: "Manual", label: t("marketplace.transmission_values.manual") },
                    { value: "CVT", label: t("marketplace.transmission_values.cvt") },
                  ]}
                  onChange={(value) => handleInputChange("transmission", value)}
                />
                <SelectField
                  label={t("marketplace.labels.condition")}
                  value={form.condition}
                  options={[
                    { value: "Used", label: t("marketplace.condition_values.used") },
                    { value: "Reconditioned", label: t("marketplace.condition_values.reconditioned") },
                    { value: "Brand New", label: t("marketplace.condition_values.brand_new") },
                  ]}
                  onChange={(value) => handleInputChange("condition", value)}
                />
                <InputField
                  label={t("marketplace.labels.price_lkr")}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.price}
                  onChange={(value) => handleInputChange("price", value)}
                  placeholder="7200000"
                />
              </div>

              <div className="grid gap-4">
                <div className="rounded-[24px] border border-slate-800/80 bg-slate-950/45 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">{t("marketplace.labels.vehicle_location")}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Choose the district first, then select the city where buyers can view the vehicle.
                      </p>
                    </div>
                    {publishVehicleLocation && (
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                        {publishVehicleLocation}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <SelectField
                      label={t("marketplace.labels.location_area", { defaultValue: "District" })}
                      value={publishLocation.district}
                      options={publishDistrictOptions}
                      onChange={(value) =>
                        setPublishLocation({
                          district: value,
                          city: "",
                        })
                      }
                    />
                    <SelectField
                      label={t("marketplace.labels.location_city", { defaultValue: "City" })}
                      value={publishLocation.city}
                      options={publishCityOptions}
                      onChange={(value) =>
                        setPublishLocation((current) => ({
                          ...current,
                          city: value,
                        }))
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <DistrictCityPicker
                      regions={sriLankaLocationRegions}
                      selectedRegionKey={publishLocation.district || ALL_LOCATION_REGIONS}
                      selectedCity={publishLocation.city || ALL_LOCATION_CITIES}
                      allowAll={false}
                      onSelectDistrict={(value) =>
                        setPublishLocation({
                          district: value === ALL_LOCATION_REGIONS ? "" : value,
                          city: "",
                        })
                      }
                      onSelectCity={(value) =>
                        setPublishLocation((current) => ({
                          ...current,
                          city: value === ALL_LOCATION_CITIES ? "" : value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="marketplace-field block">
                  <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="block text-sm font-medium text-slate-300">
                        {t("marketplace.labels.vehicle_description")}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">
                        Write your own description, or generate one from the vehicle details.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={descriptionState.generating || submitState.saving}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {descriptionState.generating ? (
                          <>
                            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Generating
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            {form.vehicle_description.trim() ? "Regenerate" : "Generate with AI"}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((current) => ({ ...current, vehicle_description: "" }));
                          setDescriptionState((current) => ({ ...current, error: "", source: "" }));
                        }}
                        disabled={descriptionState.generating || submitState.saving || !form.vehicle_description.trim()}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:border-slate-500/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Write manually
                      </button>
                    </div>
                  </div>
                  <TextareaField
                    label=""
                    value={form.vehicle_description}
                    onChange={(value) => handleInputChange("vehicle_description", value)}
                    placeholder={t("marketplace.placeholders.vehicle_description")}
                    hideLabel
                  />
                  {descriptionState.error && (
                    <p className="mt-2 text-sm text-rose-300">{descriptionState.error}</p>
                  )}
                  {descriptionState.source && !descriptionState.error && (
                    <p className="mt-2 text-xs text-slate-500">
                      Description ready. You can edit it before publishing.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-slate-300">{t("marketplace.labels.vehicle_images")}</span>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {Array.from({ length: 5 }, (_, index) => (
                    <ImageUploadSlot
                      key={index}
                      slotIndex={index}
                      file={selectedImages[index] || null}
                      onChange={handleImageChange}
                      onRemove={handleRemoveImage}
                      t={t}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {t("marketplace.publish.image_help")}
                </p>
              </div>

              <div className="rounded-[26px] border border-slate-700/60 bg-slate-950/50 p-4 md:p-5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    {t("marketplace.boost.title", { defaultValue: "Boost Your Ad" })}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {t("marketplace.boost.description", {
                      defaultValue: "Choose premium placement options to help your vehicle get more attention.",
                    })}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {boostOptions.map((option) => {
                    const Icon = option.icon;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={option.toggle}
                        className={`marketplace-boost-card ${option.accentClassName} ${
                          option.selected ? "marketplace-boost-card-active" : ""
                        }`}
                        aria-pressed={option.selected}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="marketplace-boost-card__icon">
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200">
                            {formatCurrency(option.price, locale)}
                          </span>
                        </div>
                        <div className="mt-4 text-left">
                          <h4 className="text-base font-semibold text-white">{option.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-400">{option.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-3">
                  <span className="text-sm font-medium text-slate-300">
                    {t("marketplace.boost.total", { defaultValue: "Total to Pay" })}
                  </span>
                  <span className="text-lg font-semibold text-white">{formatCurrency(totalBoostPrice, locale)}</span>
                </div>
              </div>

              {submitState.error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {submitState.error}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  disabled={submitState.saving}
                  className="rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("marketplace.common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitState.saving}
                  className="marketplace-primary-button rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8 0%, #0284c7 55%, #0f766e 100%)",
                    color: "#ffffff",
                    borderColor: "rgba(29, 78, 216, 0.42)",
                    boxShadow:
                      "0 18px 34px rgba(29, 78, 216, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
                  }}
                >
                  {submitState.saving
                    ? t("marketplace.publish.submitting")
                    : hasPremiumSelection
                      ? t("marketplace.publish.pay_and_submit", { defaultValue: "Pay & Publish" })
                      : t("marketplace.publish.submit")}
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body
      )}

    </div>
  );
}

function DistrictCityPicker({
  regions,
  selectedRegionKey,
  selectedCity,
  onSelectDistrict,
  onSelectCity,
  allowAll = true,
}) {
  const selectedRegion = regions.find((region) => region.key === selectedRegionKey) || null;
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const districtLayerRef = useRef(null);
  const cityMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const bounds = L.latLngBounds(
      [sriLankaMapBounds.south, sriLankaMapBounds.west],
      [sriLankaMapBounds.north, sriLankaMapBounds.east]
    );
    const map = L.map(mapContainerRef.current, {
      center: [7.8731, 80.7718],
      zoom: 7,
      minZoom: 7,
      maxZoom: 10,
      maxBounds: bounds,
      maxBoundsViscosity: 0.85,
      zoomControl: true,
      attributionControl: true,
    });

    mapRef.current = map;
    map.fitBounds(bounds, { padding: [18, 18] });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 10,
    }).addTo(map);

    const districtLayer = L.layerGroup().addTo(map);
    districtLayerRef.current = districtLayer;

    regions.forEach((region) => {
      const marker = L.circleMarker(region.center, {
        radius: 7,
        weight: 2,
        color: "#e0f2fe",
        fillColor: "#0f172a",
        fillOpacity: 0.95,
      }).addTo(districtLayer);

      marker.bindTooltip(region.label, {
        direction: "top",
        offset: [0, -8],
        opacity: 0.95,
      });
      marker.on("click", () => onSelectDistrict(region.key));
    });

    map.on("click", (event) => {
      const clicked = event.latlng;
      const nearestRegion = regions.reduce((nearest, region) => {
        const distance = clicked.distanceTo(L.latLng(region.center));
        return !nearest || distance < nearest.distance ? { region, distance } : nearest;
      }, null);

      if (nearestRegion?.region) {
        onSelectDistrict(nearestRegion.region.key);
      }
    });

    return () => {
      cityMarkerRef.current?.remove();
      cityMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      districtLayerRef.current = null;
    };
  }, [onSelectDistrict, regions]);

  useEffect(() => {
    if (!districtLayerRef.current) return;

    districtLayerRef.current.eachLayer((layer) => {
      const matchingRegion = regions.find((region) => {
        const layerLatLng = layer.getLatLng?.();
        return layerLatLng && layerLatLng.lat === region.center[0] && layerLatLng.lng === region.center[1];
      });

      if (!matchingRegion || !layer.setStyle) return;

      const isSelected = matchingRegion.key === selectedRegionKey;
      layer.setStyle({
        radius: isSelected ? 10 : 7,
        fillColor: isSelected ? "#06b6d4" : "#0f172a",
        color: isSelected ? "#ffffff" : "#e0f2fe",
      });

      if (isSelected) {
        layer.bringToFront?.();
      }
    });
  }, [regions, selectedRegionKey]);

  useEffect(() => {
    if (!mapRef.current) return;

    cityMarkerRef.current?.remove();
    cityMarkerRef.current = null;

    if (!selectedRegion) return;

    const cityPosition = getCityMapPosition(selectedRegion, selectedCity);
    if (!cityPosition) return;

    cityMarkerRef.current = L.circleMarker(cityPosition, {
      radius: 11,
      weight: 3,
      color: "#ffffff",
      fillColor: "#0ea5e9",
      fillOpacity: 1,
      pane: "markerPane",
    })
      .bindTooltip(selectedCity, {
        permanent: true,
        direction: "top",
        offset: [0, -12],
        className: "marketplace-city-map-tooltip",
      })
      .addTo(mapRef.current);

    cityMarkerRef.current.bringToFront?.();

    mapRef.current.panTo(cityPosition, { animate: true });
  }, [selectedCity, selectedRegion]);

  return (
    <section className="marketplace-district-picker rounded-[24px] border border-slate-800/80 bg-slate-950/55 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("marketplace.location_filter.map_eyebrow")}</p>
          <h3 className="mt-1 text-base font-semibold text-white">{t("marketplace.location_filter.map_title")}</h3>
        </div>
        {allowAll && (
          <button
            type="button"
            onClick={() => onSelectDistrict(ALL_LOCATION_REGIONS)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              selectedRegionKey === ALL_LOCATION_REGIONS
                ? "border-cyan-300/40 bg-cyan-500/15 text-cyan-100"
                : "border-slate-700/70 bg-slate-900/80 text-slate-300 hover:border-slate-500/80 hover:text-white"
            }`}
          >
            All Sri Lanka
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_minmax(16rem,0.82fr)]">
        <div className="marketplace-map-shell overflow-hidden rounded-[22px] border border-slate-800/80 bg-slate-900/75">
          <div ref={mapContainerRef} className="h-[28rem] w-full" />
        </div>

        <div className="rounded-[22px] border border-slate-800/80 bg-slate-900/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {selectedRegion ? `${selectedRegion.label} cities` : "Cities"}
          </p>
          <div className="mt-3 grid max-h-[24rem] gap-2 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onSelectCity(ALL_LOCATION_CITIES)}
              disabled={!selectedRegion || !allowAll}
              className={`rounded-2xl border px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedCity === ALL_LOCATION_CITIES
                  ? "border-cyan-300/40 bg-cyan-500/15 text-cyan-100"
                  : "border-slate-800/80 bg-slate-950/50 text-slate-300 hover:border-slate-600/90 hover:text-white"
              }`}
            >
              {selectedRegion ? `Everywhere in ${selectedRegion.label} District` : "Choose a district first"}
            </button>

            {(selectedRegion?.cities || []).map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => onSelectCity(city)}
                className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                  selectedCity === city
                    ? "border-cyan-300/40 bg-cyan-500/15 text-cyan-100"
                    : "border-slate-800/80 bg-slate-950/50 text-slate-300 hover:border-slate-600/90 hover:text-white"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LocationPickerButton({ label, value, onClick, hideLabel = false, compact = false }) {
  return (
    <label className={`marketplace-field block ${compact ? "marketplace-compact-location" : ""}`}>
      {!hideLabel && <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>}
      <button
        type="button"
        onClick={onClick}
        className="marketplace-location-trigger flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-left text-sm text-white outline-none transition duration-200 hover:border-slate-500/80 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
      >
        <span className="truncate">{value}</span>
        <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
      </button>
    </label>
  );
}

function FilterSelect({ label, value, options, onChange, hideLabel = false, className = "" }) {
  return (
    <AppDropdown
      label={hideLabel ? "" : label}
      value={value}
      options={options}
      onChange={onChange}
      className={className}
    />
  );
}

function SelectField({ label, value, options, onChange }) {
  return <FilterSelect label={label} value={value} options={options} onChange={onChange} />;
}

function InputField({ label, value, onChange, placeholder, type = "text", inputMode, pattern }) {
  return (
    <label className="marketplace-field block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition duration-200 hover:border-slate-500/80 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
      />
    </label>
  );
}

function TextareaField({ label, value, onChange, placeholder, hideLabel = false }) {
  return (
    <label className="marketplace-field block">
      {!hideLabel && <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        required
        className="w-full resize-none rounded-2xl border border-slate-700/70 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none transition duration-200 hover:border-slate-500/80 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
      />
    </label>
  );
}

function ImageUploadSlot({ slotIndex, file, onChange, onRemove, t }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleRemoveClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onRemove(slotIndex);
  };

  const handleOpenFilePicker = (event) => {
    event.preventDefault();
    event.stopPropagation();
    inputRef.current?.click();
  };

  return (
    <div className="marketplace-upload-slot group relative overflow-hidden rounded-[24px] border border-dashed border-slate-600 bg-slate-900/70">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => onChange(slotIndex, event)}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleOpenFilePicker}
        className="block w-full cursor-pointer text-left"
      >
        <div className="relative flex h-44 items-center justify-center overflow-hidden">
          {file && previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt={t("marketplace.upload.preview_alt", { index: slotIndex + 1 })}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent px-4 pb-3 pt-8">
                <p className="truncate text-xs font-medium text-white">{file.name}</p>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-slate-500 transition group-hover:bg-white/[0.02]">
              <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 p-3 text-cyan-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 16.5V7.5m0 0l-3.75 3.75M12 7.5l3.75 3.75M3.75 15v2.25A2.25 2.25 0 006 19.5h12a2.25 2.25 0 002.25-2.25V15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{t("marketplace.upload.image_label", { index: slotIndex + 1 })}</p>
                <p className="mt-1 text-xs text-slate-500">{t("marketplace.upload.click_to_add")}</p>
              </div>
            </div>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-slate-800/80 px-4 py-3">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {t("marketplace.upload.slot_label", { index: slotIndex + 1 })}
        </span>
        {file ? (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={handleRemoveClick}
            className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
          >
            {t("marketplace.common.remove")}
          </button>
        ) : (
          <span className="text-xs text-slate-600">{t("marketplace.common.optional")}</span>
        )}
      </div>
    </div>
  );
}

function MarketplaceMeta({ icon, label, value }) {
  return (
    <div className="marketplace-meta rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

export default Marketplace;
