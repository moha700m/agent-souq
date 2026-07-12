export const PRICE_TYPES = ["free", "one_time", "subscription"] as const;
export type PriceType = (typeof PRICE_TYPES)[number];
export type AgentStatus = "draft" | "published" | "archived";
export type UserRole = "member" | "creator" | "admin";
export interface Category { id: string; slug: string; name: string; description: string; icon: string; agentCount: number }
export interface Creator { id: string; username: string; fullName: string; avatarUrl: string | null; isVerified: boolean }
export interface Profile extends Creator { bio: string | null; websiteUrl: string | null; role: UserRole; onboardingCompleted: boolean; createdAt: string }
export interface Review { id: string; agentId: string; rating: number; title: string; body: string; reviewer: Creator; createdAt: string; updatedAt: string }
export interface Agent {
  id: string; slug: string; name: string; tagline: string; description: string; instructions: string;
  category: Pick<Category, "id" | "slug" | "name" | "icon">; creator: Creator; tags: string[]; capabilities: string[];
  priceType: PriceType; priceCents: number; currency: "USD"; thumbnailUrl: string | null; galleryUrls: string[];
  demoUrl: string | null; version: string; status: AgentStatus; averageRating: number; reviewCount: number;
  favoriteCount: number; installCount: number; viewCount: number; publishedAt: string | null; updatedAt: string; reviews: Review[];
}
export interface MarketplaceQuery { q?: string; category?: string; pricing?: PriceType; sort: "popular" | "newest" | "rating" | "price-low" | "price-high"; page: number; pageSize: number }
export interface PageResult<T> { items: T[]; total: number; page: number; pageSize: number; pageCount: number }
export interface InteractionState { isFavorite: boolean; isInstalled: boolean; canReview: boolean; ownReviewId: string | null }
export interface DashboardData { profile: Profile; favorites: Agent[]; recent: Agent[]; installations: Agent[]; reviews: Review[]; readOnly: boolean }
export interface CreatorData { profile: Profile; listings: Agent[]; readOnly: boolean; totals: { listings: number; published: number; views: number; favorites: number; installs: number; reviews: number } }
