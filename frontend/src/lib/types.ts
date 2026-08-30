export type Me = {
  id: string;
  email: string;
  name: string | null;
  alias: string;
  avatarColor: string;
  role: "MEMBER" | "COMMUNITY_ADMIN" | "SUPER_ADMIN";
  onboarded: boolean;
  ratingAvg: number;
  ratingCount: number;
  community: { id: string; domain: string; displayName: string };
  ban: {
    id: string;
    banPosting: boolean;
    banChat: boolean;
    expiresAt: string;
    untilLabel: string;
  } | null;
};

export type ListingCard = {
  publicId: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  coverImage: string | null;
  sellerAlias: string;
  sellerColor: string;
  sellerRating: number;
  owner: boolean;
};

export type ListingDetail = {
  publicId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  soldAt: string | null;
  seller: { alias: string; avatarColor: string; ratingAvg: number; ratingCount: number };
  images: string[];
  owner: boolean;
  communityName: string;
};

export type ChatSummary = {
  id: string;
  listingPublicId: string;
  listingTitle: string;
  counterpartLabel: string;
  myRole: "BUYER" | "SELLER";
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  roleLabel: "BUYER" | "SELLER" | "SYSTEM";
  body: string | null;
  imageUrl: string | null;
  system: boolean;
  createdAt: string;
  mine: boolean;
};

export const CATEGORIES = [
  "ELECTRONICS",
  "FURNITURE",
  "CLOTHING",
  "BOOKS",
  "VEHICLES",
  "SPORTS",
  "HOME",
  "OTHER",
] as const;

export const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"] as const;

export const REPORT_REASONS = ["SPAM", "SCAM", "OFFENSIVE", "FAKE_LISTING", "OTHER"] as const;
