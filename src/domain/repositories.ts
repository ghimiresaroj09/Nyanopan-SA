/**
 * Repository contracts (ports). The application layer depends only on these
 * interfaces; the data layer provides API-backed adapters for
 * https://nyanopan.onrender.com.
 *
 * There are intentionally NO order/customer repositories — checkout is owned
 * by the storefront (WhatsApp redirect) and nothing order-related persists.
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
import type { DashboardSnapshot } from './entities/analytics';
import type { SiteConfiguration } from './entities/configuration';
import type { Policy, PolicyInput } from './entities/policy';
import type { HomepageCollectionsData, HomepageData } from './entities/homepage';
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

/**
 * Products follow the backend's 3-step flow: info → attribute palette &
 * prices → per-value images. Steps 2 and 3 key off the product id from step 1.
 */
export interface ProductRepository extends CrudRepository<Product, ProductInput> {
  /** List products, optionally narrowed with backend query-param filters. */
  list(filters?: ProductFilters): Promise<Product[]>;
  /** All attribute values (with UUIDs) for building the variant palette. */
  listAttributeValues(): Promise<AttributeValueOption[]>;
  /** Create a brand-new value under an attribute (the "+ Add Option" action). */
  createAttributeValue(attribute: string, name: string): Promise<AttributeValueOption>;
  /** Step 2 — attach the attribute palette and set each variant's price. */
  saveVariants(productId: string, input: VariantPaletteInput): Promise<void>;
  /** All saved variants of a product, including inactive (detail may omit them). */
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
  snapshot(): Promise<DashboardSnapshot>;
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

/** Newsletter subscribers (storefront-owned; admin is read-only). */
export interface SubscriptionRepository {
  list(filters?: SubscriptionFilters): Promise<Subscription[]>;
}

/** Contact-us inquiries: list + status/notes triage. */
export interface ContactMessageRepository {
  list(filters?: ContactMessageFilters): Promise<ContactMessage[]>;
  update(id: string, patch: ContactMessageUpdate): Promise<ContactMessage>;
}

export interface Repositories {
  categories: CategoryRepository;
  attributes: AttributeRepository;
  models: ModelRepository;
  products: ProductRepository;
  configuration: ConfigurationRepository;
  policies: PolicyRepository;
  analytics: AnalyticsRepository;
  story: StoryRepository;
  sustainability: SustainabilityRepository;
  makers: MakersRepository;
  imageUpload: ImageUploadRepository;
  homepage: HomepageRepository;
  homepageCollections: HomepageCollectionsRepository;
  subscriptions: SubscriptionRepository;
  contactMessages: ContactMessageRepository;
}
