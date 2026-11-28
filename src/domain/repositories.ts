/**
 * Repository contracts (ports). The application layer depends only on these
 * interfaces; the data layer provides API-backed adapters for the configured
 * Nyanopan backend.
 *
 * Order data is read from the admin API; checkout creation remains storefront-owned.
 */
import type {
  Attribute,
  AttributeInput,
  Category,
  Model,
  ModelInput,
} from './entities/catalog';
import type {
  AttributeValueOption,
  Product,
  ProductDetail,
  ProductFilters,
  ProductInput,
  ProductVariantDetail,
  VariantImageGroup,
  VariantPaletteInput,
} from './entities/product';
import type { DashboardData } from './entities/analytics';
import type { SiteConfiguration } from './entities/configuration';
import type { Policy, PolicyInput } from './entities/policy';
import type { Faq, FaqCategory, FaqCategoryInput, FaqInput } from './entities/faq';
import type { Blog, BlogCategory, BlogCategoryInput, BlogInput } from './entities/blog';
import type {
  HeroSectionData,
  HomepageCollectionsData,
  HomepageData,
} from './entities/homepage';
import type { Subscription, SubscriptionFilters } from './entities/subscription';
import type {
  ContactMessage,
  ContactMessageFilters,
  ContactMessageUpdate,
} from './entities/contact';
import type {
  ContentPage,
  StoryData,
  SustainabilityData,
  TeamMember,
  TeamMemberInput,
} from './entities/story';

/**
 * Categories are submitted as multipart/form-data
 * (fields: name, description, status, optional image file).
 */
export interface CategoryRepository {
  list(): Promise<Category[]>;
  create(input: FormData): Promise<Category>;
  update(id: string, input: FormData): Promise<Category>;
  remove(id: string): Promise<void>;
}

export interface CrudRepository<T, I> {
  list(): Promise<T[]>;
  create(input: I): Promise<T>;
  update(id: string, patch: Partial<I>): Promise<T>;
  remove(id: string): Promise<void>;
}

export type AttributeRepository = CrudRepository<Attribute, AttributeInput>;
export type ModelRepository = CrudRepository<Model, ModelInput>;
export type FaqCategoryRepository = CrudRepository<FaqCategory, FaqCategoryInput>;
export type FaqRepository = CrudRepository<Faq, FaqInput>;
export type BlogCategoryRepository = CrudRepository<BlogCategory, BlogCategoryInput>;
export interface BlogRepository extends CrudRepository<Blog, BlogInput> {
  get(id: string): Promise<Blog>;
}

/**
 * Products follow the backend's 3-step flow: info → attribute palette &
 * prices → per-value images. Steps 2 and 3 key off the product id from step 1.
 */
export interface ProductRepository extends CrudRepository<Product, ProductInput> {
  /** List products, optionally narrowed with backend query-param filters. */
  list(filters?: ProductFilters): Promise<Product[]>;
  /** Attribute values (with UUIDs) for building the variant palette. */
  listAttributeValues(): Promise<AttributeValueOption[]>;
  /** Step 2 — attach the attribute palette and set each variant's price. */
  saveVariants(
    productId: string,
    input: VariantPaletteInput,
    existingVariants: ProductVariantDetail[],
  ): Promise<void>;
  /** Saved variants from the product's step-2 endpoint, including inactive rows. */
  listProductVariants(productId: string): Promise<ProductVariantDetail[]>;
  /** Step 3 — list the product's values with their current images. */
  getVariantImages(productId: string): Promise<VariantImageGroup[]>;
  /** Rich detail (attributes, variants, images) for prefill and view modal. */
  getProductDetail(productId: string): Promise<ProductDetail | null>;
  /** Step 3 — upload the featured image / gallery for one value. */
  saveVariantImages(
    productId: string,
    valueId: string,
    featureImage: File | null,
    gallery: File[],
  ): Promise<void>;
}

export interface AnalyticsRepository {
  dashboard(days: 7 | 30 | 90): Promise<DashboardData>;
}

/** Singleton company profile powering the storefront's contact sections. */
export interface ConfigurationRepository {
  get(): Promise<SiteConfiguration>;
  update(input: SiteConfiguration): Promise<SiteConfiguration>;
}

/** Storefront policy documents (terms, privacy, returns, shipping). */
export interface PolicyRepository {
  list(): Promise<Policy[]>;
  create(input: PolicyInput): Promise<Policy>;
  update(id: string, patch: Partial<PolicyInput>): Promise<Policy>;
}

/** Our Story singleton — sections nested in the payload, one PUT to save. */
export interface StoryRepository {
  get(): Promise<StoryData>;
  save(data: StoryData): Promise<StoryData>;
}

/** Sustainability singleton — sections nested in the payload, one PUT. */
export interface SustainabilityRepository {
  get(): Promise<SustainabilityData>;
  save(data: SustainabilityData): Promise<SustainabilityData>;
}

/** Our Makers — head block PATCH + team-members CRUD (binary photo parts). */
export interface MakersRepository {
  getHead(): Promise<ContentPage>;
  saveHead(head: ContentPage): Promise<ContentPage>;
  listMembers(): Promise<TeamMember[]>;
  createMember(input: TeamMemberInput): Promise<TeamMember>;
  updateMember(id: string, patch: Partial<TeamMemberInput>): Promise<TeamMember>;
  removeMember(id: string): Promise<void>;
}

/** Direct image upload → Cloudinary URL (for section images). */
export interface ImageUploadRepository {
  upload(file: File): Promise<string>;
}

/** Storefront Home page singleton — three nested sections, one PUT. */
export interface HomepageRepository {
  get(): Promise<HomepageData>;
  save(data: HomepageData): Promise<HomepageData>;
}

/** Home page collections block — head fields + nested rows, one PUT. */
export interface HomepageCollectionsRepository {
  get(): Promise<HomepageCollectionsData>;
  save(data: HomepageCollectionsData): Promise<HomepageCollectionsData>;
}

/** Home page hero singleton — copy and ordered images, one PATCH. */
export interface HeroSectionRepository {
  get(): Promise<HeroSectionData>;
  save(data: HeroSectionData): Promise<HeroSectionData>;
}

/** Newsletter subscribers (storefront-owned; admin is read-only). */
export interface SubscriptionRepository {
  list(filters?: SubscriptionFilters): Promise<Subscription[]>;
}

/** Contact-us inquiries: list + status/notes triage. */
export interface ContactMessageRepository {
  list(filters?: ContactMessageFilters): Promise<ContactMessage[]>;
  get(id: string): Promise<ContactMessage>;
  update(id: string, patch: ContactMessageUpdate): Promise<ContactMessage>;
  reply(id: string, reply: string): Promise<{ id: string; email: string; subject: string }>;
}

export interface DeliveryLocation {
  id: string;
  name: string;
  delivery_charge: string;
  is_free: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryLocationInput {
  name: string;
  delivery_charge: string;
  is_free: boolean;
  is_active: boolean;
}

export interface DeliveryLocationRepository {
  list(): Promise<DeliveryLocation[]>;
  create(input: DeliveryLocationInput): Promise<DeliveryLocation>;
  update(id: string, input: DeliveryLocationInput): Promise<DeliveryLocation>;
  remove(id: string): Promise<void>;
}

export interface OrderItem {
  product_name: string;
  product_image?: {
    url?: string;
    title?: string;
    caption?: string;
    alt?: string;
  } | null;
  variant_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface OrderStatusTimelineEntry {
  id: string;
  from_status: string;
  to_status: string;
  note: string;
  changed_by_name: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  status: string;
  customer_name: string;
  email: string;
  phone: string;
  alternate_phone: string;
  notes: string;
  company_name: string;
  pan_vat_number: string;
  city_district: string;
  delivery_location: string;
  delivery_location_name: string;
  product_subtotal: string;
  delivery_charge: string;
  subtotal: string;
  address: string;
  landmark: string;
  currency: string;
  items: OrderItem[];
  status_timeline: OrderStatusTimelineEntry[];
  created_at: string;
}

export interface OrderRepository {
  list(): Promise<Order[]>;
  get(id: string): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  timeline(id: string): Promise<OrderStatusTimelineEntry[]>;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Repositories {
  categories: CategoryRepository;
  attributes: AttributeRepository;
  models: ModelRepository;
  products: ProductRepository;
  configuration: ConfigurationRepository;
  policies: PolicyRepository;
  faqCategories: FaqCategoryRepository;
  faqs: FaqRepository;
  blogCategories: BlogCategoryRepository;
  blogs: BlogRepository;
  analytics: AnalyticsRepository;
  story: StoryRepository;
  sustainability: SustainabilityRepository;
  makers: MakersRepository;
  imageUpload: ImageUploadRepository;
  homepage: HomepageRepository;
  homepageCollections: HomepageCollectionsRepository;
  heroSection: HeroSectionRepository;
  subscriptions: SubscriptionRepository;
  contactMessages: ContactMessageRepository;
  deliveryLocations: DeliveryLocationRepository;
  orders: OrderRepository;
}
