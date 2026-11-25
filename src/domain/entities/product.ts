/**
 * Product domain entities, mirroring the backend's 3-step flow:
 *   Step 1 — POST /api/v1/admin/products/            (info)
 *   Step 2 — POST /api/v1/productvarientvalues/{id}/ (attribute palette + prices)
 *   Step 3 — POST /api/v1/productvarientimages/{id}/ (per-value images)
 */

export type ProductGender = 'NONE' | 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS' | 'BABY';

export const PRODUCT_GENDERS: Array<{ value: ProductGender; label: string }> = [
  { value: 'NONE', label: 'None' },
  { value: 'MEN', label: 'Men' },
  { value: 'WOMEN', label: 'Women' },
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'KIDS', label: 'Kids' },
  { value: 'BABY', label: 'Baby' },
];

/** Where the product is intended to be used. */
export type UsageLocation = 'INSIDE' | 'OUTSIDE' | 'BOTH';

export const USAGE_LOCATIONS: Array<{ value: UsageLocation; label: string }> = [
  { value: 'INSIDE', label: 'Inside' },
  { value: 'OUTSIDE', label: 'Outside' },
  { value: 'BOTH', label: 'Both' },
];

/** Sole material (optional enum). */
export type SoleType = 'LEATHER' | 'RUBBER';

export const SOLE_OPTIONS: Array<{ value: SoleType; label: string }> = [
  { value: 'LEATHER', label: 'Leather' },
  { value: 'RUBBER', label: 'Rubber' },
];

export interface ProductRef {
  id: string;
  name: string;
  slug?: string;
}

/** Key feature row: { title, value } — e.g. Material / 100% Wool Felt. */
export interface KeyFeature {
  title: string;
  value: string;
}

/** Lean product row returned by the admin products endpoints. */
/** Server-side filters for the products list (query params on GET /admin/products/). */
export interface ProductFilters {
  category?: string;
  gender?: ProductGender;
  usage_location?: UsageLocation;
  sole_type?: SoleType;
  is_active?: boolean;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  ordering?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  gender?: ProductGender;
  usage_location: UsageLocation | '';
  sole: SoleType | '';
  description: string;
  general_information: string;
  materials_used: string;
  is_featured: boolean;
  featureImageUrl: string | null;
  /** Variant price span from the list payload, e.g. "452.00" – "5457.00". */
  priceRange: { min: string; max: string } | null;
  key_features: KeyFeature[];
  category: ProductRef | null;
  model: ProductRef | null;
}

/**
 * Step 1 write payload. Category/model accept a UUID or slug.
 * Submitted as multipart/form-data; `feature_image` is a binary file part.
 */
export interface ProductInput {
  name: string;
  category: string;
  model?: string;
  gender?: ProductGender;
  usage_location?: UsageLocation;
  sole?: SoleType;
  description?: string;
  general_information?: string;
  materials_used?: string;
  is_featured?: boolean;
  key_features?: KeyFeature[];
  feature_image?: File | null;
}

/** An attribute value as listed by the public attributes endpoint. */
export interface AttributeValueOption {
  id: string;
  name: string;
  attribute_id: string;
  attribute_name: string;
}

/** Palette entry for step 2: which attribute, which value UUIDs. */
export interface PaletteEntry {
  attribute: string; // attribute UUID or name
  options: string[]; // attribute-value UUIDs
}

/** One generated variant (row of the variant grid) for step 2. */
export interface GeneratedVariant {
  optionIds: string[]; // attribute-value UUIDs in this combination
  attributes: Array<{ attributeId: string; attributeValues: string[] }>;
  price: string;
  name?: string;
  is_active?: boolean;
  is_special_edition?: boolean;
}

/** Step 2 write payload (product id is supplied by the caller). */
export interface VariantPaletteInput {
  attributes: PaletteEntry[];
  generatedVarients: GeneratedVariant[];
}

/** A single attribute value row in the step 3 image listing. */
export interface VariantImageValue {
  id: string; // product attribute-value row id
  label: string; // display name
  featureImageUrl: string | null;
  gallery: Array<{ id: string; url: string | null }>;
}

/** Step 3 image listing grouped by attribute. */
export interface VariantImageGroup {
  attribute: string;
  values: VariantImageValue[];
}

/** Rich product detail (public GET /api/v1/products/{slug}/) used for
 *  prefilling the wizard on edit and for the read-only view modal. */
export interface ProductDetailValue {
  id: string;
  name: string;
  featureImageUrl: string | null;
  gallery: Array<{ id: string; url: string | null }>;
}

export interface ProductDetailAttribute {
  id: string;
  attribute: string;
  values: ProductDetailValue[];
}

export interface ProductVariantOptionRef {
  product_attribute_value: string;
  attribute: string;
  attributeId?: string;
  value: string;
}

export interface ProductVariantDetail {
  id: string;
  name: string;
  sku: string;
  price: string;
  is_active: boolean;
  is_special_edition: boolean;
  optionIds: string[];
  options: ProductVariantOptionRef[];
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  gender?: ProductGender;
  usage_location: UsageLocation | '';
  sole: SoleType | '';
  description: string;
  general_information: string;
  materials_used: string;
  is_featured: boolean;
  category: ProductRef | null;
  model: ProductRef | null;
  key_features: KeyFeature[];
  featureImageUrl: string | null;
  attributes: ProductDetailAttribute[];
  variants: ProductVariantDetail[];
}
