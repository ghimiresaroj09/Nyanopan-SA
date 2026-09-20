/**
 * API-backed adapters for https://nyanopan.onrender.com implementing the
 * domain repository contracts. Backend envelope: { success, message, data }.
 */
import type {
  AnalyticsRepository,
  AttributeRepository,
  CategoryRepository,
  ModelRepository,
} from '../../domain/repositories';
import type { Attribute, AttributeInput, Category, Model, ModelInput } from '../../domain/entities/catalog';
import type { CmsStatusRow, DashboardSnapshot, MetricSummary } from '../../domain/entities/analytics';
import type {
  AttributeValueOption,
  KeyFeature,
  Product,
  ProductDetail,
  ProductFilters,
  ProductGender,
  ProductInput,
  ProductRef,
  ProductVariantDetail,
  SoleType,
  UsageLocation,
  VariantImageGroup,
  VariantPaletteInput,
} from '../../domain/entities/product';
import { PRODUCT_GENDERS } from '../../domain/entities/product';
import type {
  ContentPage,
  SimpleSection,
  StoryData,
  SubsectionRow,
  SustainabilityData,
  TeamMember,
  TeamMemberInput,
} from '../../domain/entities/story';
import type {
  CollectionRow,
  HomepageCollectionsData,
  HomepageData,
  HomepageSection1,
  HomepageSection2,
  HomepageSection3,
} from '../../domain/entities/homepage';
import type { Subscription, SubscriptionFilters } from '../../domain/entities/subscription';
import type {
  ContactMessage,
  ContactMessageFilters,
  ContactMessageUpdate,
} from '../../domain/entities/contact';
import type {
  ConfigurationRepository,
  ContactMessageRepository,
  HomepageCollectionsRepository,
  HomepageRepository,
  ImageUploadRepository,
  MakersRepository,
  PolicyRepository,
  ProductRepository,
  StoryRepository,
  SubscriptionRepository,
  SustainabilityRepository,
} from '../../domain/repositories';
import type { SiteConfiguration, SocialLinks } from '../../domain/entities/configuration';
import type { Policy, PolicyInput } from '../../domain/entities/policy';
import { apiRequest, type ApiAdminUser, type StoredAuth } from './client';

interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

async function listAll<T>(path: string): Promise<T[]> {
  const sep = path.includes('?') ? '&' : '?';
  const first = await apiRequest<Page<T>>(`${path}${sep}page_size=100`);
  const out = [...first.results];
  let next = first.next;
  while (next) {
    const page = await apiRequest<Page<T>>(next);
    out.push(...page.results);
    next = page.next;
  }
  return out;
}

/* ---------------- Auth ---------------- */

export interface LoginResponse {
  access: string;
  refresh: string;
  user: ApiAdminUser;
}

export const authApi = {
  login(email: string, password: string): Promise<StoredAuth> {
    return apiRequest<LoginResponse>('/api/v1/admin/auth/login/', {
      method: 'POST',
      json: { email, password },
      auth: false,
    });
  },
  logout(): Promise<unknown> {
    return apiRequest('/api/v1/admin/auth/logout/', { method: 'POST' }).catch(() => null);
  },
  /** Current admin profile — keeps the stored session fresh. */
  me(): Promise<ApiAdminUser> {
    return apiRequest<ApiAdminUser>('/api/v1/admin/auth/me/');
  },
  changePassword(oldPassword: string, newPassword: string): Promise<unknown> {
    return apiRequest('/api/v1/admin/auth/change-password/', {
      method: 'POST',
      json: {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPassword,
      },
    });
  },
};

/* ---------------- Categories ---------------- */

interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  image?: { url?: string } | null;
  product_count?: number;
  created_at?: string;
}

function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug ?? '',
    description: dto.description ?? '',
    image: dto.image?.url ?? '',
    status: dto.is_active === false ? 'inactive' : 'active',
    createdAt: dto.created_at ?? new Date(0).toISOString(),
  };
}

function categoryBody(form: FormData): FormData {
  const body = new FormData();
  body.append('name', String(form.get('name') ?? ''));
  body.append('description', String(form.get('description') ?? ''));
  body.append('is_active', form.get('status') === 'inactive' ? 'false' : 'true');
  const image = form.get('image');
  if (image instanceof File && image.size > 0) body.append('image', image, image.name);
  return body;
}

export class ApiCategoryRepository implements CategoryRepository {
  async list(): Promise<Category[]> {
    const items = await listAll<CategoryDto>('/api/v1/admin/categories/');
    return items.map(toCategory);
  }

  async create(input: FormData): Promise<Category> {
    const dto = await apiRequest<CategoryDto>('/api/v1/admin/categories/', {
      method: 'POST',
      body: categoryBody(input),
    });
    return toCategory(dto);
  }

  async update(id: string, input: FormData): Promise<Category> {
    const dto = await apiRequest<CategoryDto>(`/api/v1/admin/categories/${id}/`, {
      method: 'PATCH',
      body: categoryBody(input),
    });
    return toCategory(dto);
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/api/v1/admin/categories/${id}/`, { method: 'DELETE' });
  }
}

/* ---------------- Attributes ---------------- */

interface AttributeDto {
  id: string;
  name: string;
  values?: string[];
  values_count?: number;
  is_active?: boolean;
  created_at?: string;
}

function toAttribute(dto: AttributeDto): Attribute {
  return {
    id: dto.id,
    name: dto.name,
    value: dto.values ?? [],
    createdAt: dto.created_at ?? new Date(0).toISOString(),
  };
}

export class ApiAttributeRepository implements AttributeRepository {
  async list(): Promise<Attribute[]> {
    const items = await listAll<AttributeDto>('/api/v1/admin/attributes/');
    return items.map(toAttribute);
  }

  async create(input: AttributeInput): Promise<Attribute> {
    const dto = await apiRequest<AttributeDto>('/api/v1/admin/attributes/', {
      method: 'POST',
      json: { name: input.name, value: input.value, is_active: true },
    });
    return toAttribute(dto);
  }

  async update(id: string, patch: Partial<AttributeInput>): Promise<Attribute> {
    const dto = await apiRequest<AttributeDto>(`/api/v1/admin/attributes/${id}/`, {
      method: 'PATCH',
      json: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.value !== undefined ? { value: patch.value } : {}),
      },
    });
    return toAttribute(dto);
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/api/v1/admin/attributes/${id}/`, { method: 'DELETE' });
  }
}

/* ---------------- Models (product-models) ---------------- */

interface ModelDto {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
  product_count?: number;
  created_at?: string;
}

function toModel(dto: ModelDto): Model {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug ?? '',
    description: dto.description ?? '',
    status: dto.is_active === false ? 'inactive' : 'active',
    productCount: dto.product_count ?? 0,
    createdAt: dto.created_at ?? new Date(0).toISOString(),
  };
}

export class ApiModelRepository implements ModelRepository {
  async list(): Promise<Model[]> {
    const items = await listAll<ModelDto>('/api/v1/admin/product-models/');
    return items.map(toModel);
  }

  async create(input: ModelInput): Promise<Model> {
    const dto = await apiRequest<ModelDto>('/api/v1/admin/product-models/', {
      method: 'POST',
      json: {
        name: input.name,
        description: input.description,
        is_active: input.status !== 'inactive',
      },
    });
    return toModel(dto);
  }

  async update(id: string, patch: Partial<ModelInput>): Promise<Model> {
    const dto = await apiRequest<ModelDto>(`/api/v1/admin/product-models/${id}/`, {
      method: 'PATCH',
      json: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.status !== undefined ? { is_active: patch.status !== 'inactive' } : {}),
      },
    });
    return toModel(dto);
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/api/v1/admin/product-models/${id}/`, { method: 'DELETE' });
  }
}

/* ---------------- Products (3-step flow) ---------------- */

const USAGE_VALUES: ReadonlyArray<string> = ['INSIDE', 'OUTSIDE', 'BOTH'];

function toUsage(value: string | undefined): UsageLocation | '' {
  return value && USAGE_VALUES.includes(value) ? (value as UsageLocation) : '';
}

const SOLE_VALUES: ReadonlyArray<string> = ['LEATHER', 'RUBBER'];

function toSole(value: string | undefined): SoleType | '' {
  const upper = (value ?? '').trim().toUpperCase();
  return upper && SOLE_VALUES.includes(upper) ? (upper as SoleType) : '';
}

interface ProductDto {
  id: string;
  name: string;
  slug?: string;
  gender?: ProductGender;
  usage_location?: string;
  sole?: string;
  sole_type?: string;
  description?: string;
  general_information?: string;
  materials_used?: string;
  is_featured?: boolean;
  is_active?: boolean;
  feature_image?: { url?: string | null } | string | null;
  primary_image?: { url?: string | null } | string | null;
  price_range?: { min_price?: string | null; max_price?: string | null } | null;
  key_features?: unknown;
  category?: { id: string; name: string; slug?: string } | string | null;
  model?: { id: string; name: string; slug?: string } | string | null;
}

function toRef(
  value: { id?: string; name?: string; slug?: string } | string | null | undefined,
): ProductRef | null {
  if (!value) return null;
  // Some detail payloads serialize refs as plain strings (name/slug).
  if (typeof value === 'string') return { id: value, name: value, slug: value };
  if (!value.id && !value.name) return null;
  return { id: value.id ?? '', name: value.name ?? '', slug: value.slug ?? '' };
}

function toKeyFeatures(raw: unknown): KeyFeature[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): KeyFeature | null => {
      if (typeof item === 'string') return { title: item, value: '' };
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        return { title: String(obj.title ?? ''), value: String(obj.value ?? '') };
      }
      return null;
    })
    .filter((feature): feature is KeyFeature => feature !== null);
}

const imageUrl = (value: { url?: string | null } | string | null | undefined): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.url ?? null;
};

function toProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug ?? '',
    gender: dto.gender,
    usage_location: toUsage(dto.usage_location),
    sole: toSole(dto.sole_type ?? dto.sole),
    description: dto.description ?? '',
    general_information: dto.general_information ?? '',
    materials_used: dto.materials_used ?? '',
    is_featured: Boolean(dto.is_featured),
    featureImageUrl: imageUrl(dto.primary_image) ?? imageUrl(dto.feature_image),
    priceRange: dto.price_range
      ? { min: dto.price_range.min_price ?? '', max: dto.price_range.max_price ?? '' }
      : null,
    key_features: toKeyFeatures(dto.key_features),
    category: toRef(dto.category),
    model: toRef(dto.model),
  };
}

/**
 * Step 1 goes out as multipart/form-data: scalar fields as form parts,
 * key_features JSON-encoded, feature_image as a binary file part
 * (omitted entirely when unchanged so the backend keeps the current one).
 */
function productBody(input: Partial<ProductInput>, full: boolean): FormData {
  const body = new FormData();
  if (full || input.name !== undefined) body.append('name', input.name ?? '');
  if (full || input.category !== undefined) body.append('category', input.category ?? '');
  if (full || input.model !== undefined) body.append('model', input.model ?? '');
  if (full || input.gender !== undefined) body.append('gender', input.gender ?? 'NONE');
  if (input.usage_location) body.append('usage_location', input.usage_location);
  if (input.sole) body.append('sole_type', input.sole);
  if (full || input.description !== undefined) body.append('description', input.description ?? '');
  if (full || input.general_information !== undefined) {
    body.append('general_information', input.general_information ?? '');
  }
  if (full || input.materials_used !== undefined) body.append('materials_used', input.materials_used ?? '');
  if (full || input.is_featured !== undefined) {
    body.append('is_featured', input.is_featured ? 'true' : 'false');
  }
  if (full || input.key_features !== undefined) {
    body.append('key_features', JSON.stringify(input.key_features ?? []));
  }
  if (input.feature_image) body.append('feature_image', input.feature_image, input.feature_image.name);
  return body;
}

/**
 * Full product GET shape (attributes / product_varient_values / images
 * included, camelCase image keys) as returned by the admin endpoints.
 */
interface ProductFullDto {
  id: string;
  name: string;
  slug?: string;
  gender?: ProductGender;
  usage_location?: string;
  sole?: string;
  description?: string;
  general_information?: string;
  materials_used?: string;
  is_active?: boolean;
  is_featured?: boolean;
  sole_type?: string;
  category?: { id?: string; name?: string; slug?: string } | string | null;
  model?: { id?: string; name?: string; slug?: string } | string | null;
  key_features?: unknown;
  feature_image?: { url?: string | null } | string | null;
  attributes?: Array<{
    attribute?: { id?: string; name?: string } | string;
    attributeValues?: Array<{
      id?: string;
      name?: string;
      featureImage?: { url?: string | null } | null;
      additionalImages?: Array<{ url?: string | null }>;
    }>;
  }>;
  product_varient_values?: Array<{
    id?: string;
    name?: string;
    sku?: string;
    price?: string | number;
    isActive?: boolean;
    isSpecialEdition?: boolean;
    optionIds?: string[];
    attributes?: Array<{
      attribute?: { id?: string; name?: string } | string;
      attributeValues?: Array<{ id?: string; name?: string }>;
    }>;
  }>;
}

/** The admin detail endpoint serializes some nested collections as JSON
 *  strings (SerializerMethodFields) while the public one returns objects —
 *  accept both. */
function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text.startsWith('[') && !text.startsWith('{')) return value;
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

interface RawImageRef {
  url?: string | null;
}

interface RawValueRef {
  id?: string;
  name?: string;
  featureImage?: RawImageRef | string | null;
  additionalImages?: Array<RawImageRef | string>;
}

interface RawAttributeGroup {
  id?: string;
  attribute?: { id?: string; name?: string } | string;
  attributeValues?: RawValueRef[];
  values?: RawValueRef[];
}

interface RawVariant {
  id?: string;
  name?: string;
  sku?: string;
  price?: string | number;
  isActive?: boolean;
  is_active?: boolean;
  isSpecialEdition?: boolean;
  is_special_edition?: boolean;
  optionIds?: string[];
  options?: Array<{ product_attribute_value?: string; id?: string }>;
  attributes?: RawAttributeGroup[];
}

function toProductDetail(dto: ProductFullDto): ProductDetail {
  const attrName = (value: { id?: string; name?: string } | string | undefined, fallback = 'Attribute') =>
    typeof value === 'object' ? value?.name ?? fallback : value ?? fallback;

  const parsedAttributes = parseMaybeJson(dto.attributes);
  const attributeGroups: RawAttributeGroup[] = Array.isArray(parsedAttributes)
    ? (parsedAttributes as RawAttributeGroup[])
    : [];

  const parsedVariants = parseMaybeJson(dto.product_varient_values);
  const variantRows: RawVariant[] = Array.isArray(parsedVariants)
    ? (parsedVariants as RawVariant[])
    : [];

  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug ?? '',
    gender: dto.gender,
    usage_location: toUsage(dto.usage_location),
    sole: toSole(dto.sole_type ?? dto.sole),
    description: dto.description ?? '',
    general_information: dto.general_information ?? '',
    materials_used: dto.materials_used ?? '',
    is_featured: Boolean(dto.is_featured),
    category: toRef(dto.category ?? null),
    model: toRef(dto.model ?? null),
    key_features: toKeyFeatures(parseMaybeJson(dto.key_features)),
    featureImageUrl: imageUrl(dto.feature_image),
    attributes: attributeGroups.map((group) => ({
      id:
        typeof group.attribute === 'object'
          ? group.attribute?.id ?? ''
          : group.attribute ?? group.id ?? '',
      attribute: attrName(group.attribute),
      values: (group.attributeValues ?? group.values ?? []).map((value) => ({
        id: value.id ?? '',
        name: value.name ?? '',
        featureImageUrl: imageUrl(value.featureImage),
        gallery: (value.additionalImages ?? []).map((img, index) => ({
          id: typeof img === 'string' ? img : img?.url ?? String(index),
          url: typeof img === 'string' ? img : img?.url ?? null,
        })),
      })),
    })),
    variants: variantRows.map((variant) => {
      const idsFromOptions = (variant.options ?? [])
        .map((option) => option.product_attribute_value ?? option.id ?? '')
        .filter(Boolean);
      const idsFromAttributes = (variant.attributes ?? []).flatMap((group) =>
        (group.attributeValues ?? []).map((value) => value.id ?? ''),
      );
      return {
        id: variant.id ?? '',
        name: variant.name ?? '',
        sku: variant.sku ?? '',
        price: variant.price != null ? String(variant.price) : '',
        is_active: variant.isActive ?? variant.is_active ?? true,
        is_special_edition: Boolean(variant.isSpecialEdition ?? variant.is_special_edition),
        optionIds:
          variant.optionIds ??
          (idsFromOptions.length > 0 ? idsFromOptions : idsFromAttributes),
        options: (variant.attributes ?? []).flatMap((group) =>
          (group.attributeValues ?? []).map((value) => ({
            product_attribute_value: value.id ?? '',
            attribute: attrName(group.attribute),
            value: value.name ?? '',
          })),
        ),
      };
    }),
  };
}

interface AttributeValueDto {
  id: string;
  name?: string;
  /** Per-product rows expose the value under these keys instead. */
  value_name?: string;
  attribute_value?: string;
  attribute?: string;
  attribute_name?: string;
  is_active?: boolean;
}

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
  }
  return undefined;
}

export class ApiProductRepository implements ProductRepository {
  async list(filters: ProductFilters = {}): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.usage_location) params.set('usage_location', filters.usage_location);
    if (filters.sole_type) params.set('sole_type', filters.sole_type);
    if (filters.is_active !== undefined) params.set('is_active', String(filters.is_active));
    if (filters.is_featured !== undefined) params.set('is_featured', String(filters.is_featured));
    if (filters.min_price !== undefined) params.set('min_price', String(filters.min_price));
    if (filters.max_price !== undefined) params.set('max_price', String(filters.max_price));
    if (filters.search) params.set('search', filters.search);
    if (filters.ordering) params.set('ordering', filters.ordering);
    const qs = params.toString();
    const items = await listAll<ProductDto>(`/api/v1/admin/products/${qs ? `?${qs}` : ''}`);
    return items.map(toProduct);
  }

  async create(input: ProductInput): Promise<Product> {
    const dto = await apiRequest<ProductDto>('/api/v1/admin/products/', {
      method: 'POST',
      body: productBody(input, true),
    });
    return toProduct(dto);
  }

  async update(id: string, patch: Partial<ProductInput>): Promise<Product> {
    const dto = await apiRequest<ProductDto>(`/api/v1/admin/products/${id}/`, {
      method: 'PATCH',
      body: productBody(patch, false),
    });
    return toProduct(dto);
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/api/v1/admin/products/${id}/`, { method: 'DELETE' });
  }

  async listAttributeValues(): Promise<AttributeValueOption[]> {
    const items = await listAll<AttributeValueDto>('/api/v1/admin/attribute-values/');
    return items.map((dto) => ({
      id: dto.attribute_value ?? dto.id,
      name: dto.name ?? dto.value_name ?? '',
      attribute_id: dto.attribute ?? '',
      attribute_name: dto.attribute_name ?? '',
    }));
  }

  async createAttributeValue(attribute: string, name: string): Promise<AttributeValueOption> {
    const dto = await apiRequest<AttributeValueDto>('/api/v1/admin/attribute-values/', {
      method: 'POST',
      json: { attribute, name, is_active: true },
    });
    return {
      id: dto.attribute_value ?? dto.id,
      name: dto.name ?? dto.value_name ?? name,
      attribute_id: dto.attribute ?? attribute,
      attribute_name: dto.attribute_name ?? '',
    };
  }

  /** Existing per-product variant rows (used to clear stale combos before re-saving). */
  async listProductVariantRows(productId: string): Promise<Array<{ id: string }>> {
    return listAll<{ id: string }>(`/api/v1/admin/variants/?product=${encodeURIComponent(productId)}`);
  }

  async deleteVariantRow(variantId: string): Promise<void> {
    await apiRequest(`/api/v1/admin/variants/${variantId}/`, { method: 'DELETE' });
  }

  /** All variant rows of a product — INCLUDING inactive ones, which the
   *  product detail payload may omit. Used to prefill step 2 on edit. */
  async listProductVariants(productId: string): Promise<ProductVariantDetail[]> {
    const rows = await listAll<Record<string, unknown>>(
      `/api/v1/admin/variants/?product=${encodeURIComponent(productId)}&page_size=100`,
    );
    return rows.map((row) => {
      const options = Array.isArray(row.options_detail)
        ? (row.options_detail as Array<Record<string, unknown>>)
        : [];
      return {
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        sku: String(row.sku ?? ''),
        price: String(row.price ?? ''),
        is_active: row.is_active !== false,
        is_special_edition: Boolean(row.is_special_edition),
        optionIds: [] as string[],
        options: options.map((option) => ({
          product_attribute_value: String(option.product_attribute_value ?? ''),
          attribute: String(option.attribute ?? ''),
          value: String(option.value ?? ''),
        })),
      };
    });
  }

  async saveVariants(productId: string, input: VariantPaletteInput): Promise<void> {
    // The backend upserts variants by SKU, but rows created before SKUs existed
    // carry an empty SKU — reposting the same combinations then fails the
    // uniqueness check. Clear the product's existing rows first, then recreate
    // them with deterministic unique SKUs.
    const existing = await this.listProductVariantRows(productId);
    for (const row of existing) {
      await this.deleteVariantRow(row.id);
    }
    // Prune per-product attribute values that are no longer in the palette
    // (otherwise removed attributes/values reappear on the next visit). Rows
    // that stay keep their step-3 images; the POST re-creates any missing ones.
    const keep = new Map<string, Set<string>>();
    for (const entry of input.attributes) {
      keep.set(entry.attribute, new Set(entry.options));
    }
    const pavRows = await listAll<
      Record<string, unknown> & { id: string; attribute?: unknown; attribute_value?: unknown }
    >(`/api/v1/admin/product-attribute-values/?product=${encodeURIComponent(productId)}`);
    const refId = (raw: unknown) =>
      typeof raw === 'object' && raw !== null
        ? String((raw as { id?: unknown }).id ?? '')
        : String(raw ?? '');
    for (const row of pavRows) {
      const attributeId = refId(row.attribute);
      const valueId = refId(row.attribute_value);
      if (!keep.get(attributeId)?.has(valueId)) {
        await apiRequest(`/api/v1/admin/product-attribute-values/${row.id}/`, {
          method: 'DELETE',
        });
      }
    }
    const slugify = (text: string) =>
      text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    await apiRequest(`/api/v1/productvarientvalues/${productId}/`, {
      method: 'POST',
      json: {
        attributes: input.attributes,
        generatedVarients: input.generatedVarients.map((variant) => {
          const name = variant.name ?? '';
          return {
            sku: `${productId.slice(0, 8)}-${slugify(name)}`.slice(0, 100),
            name,
            price: variant.price,
            is_active: variant.is_active ?? true,
            is_special_edition: Boolean(variant.is_special_edition),
            optionIds: variant.optionIds,
            attributes: variant.attributes,
            product: productId,
          };
        }),
      },
    });
  }

  async getVariantImages(productId: string): Promise<VariantImageGroup[]> {
    const data = await apiRequest<Record<string, unknown>>(
      `/api/v1/productvarientimages/${productId}/`,
    );
    const attributes = (data?.attributes ?? []) as Array<Record<string, unknown>>;
    return attributes.map((group) => {
      const attributeRaw = group.attribute as
        | { name?: string }
        | string
        | undefined;
      const values = (group.values ?? []) as Array<Record<string, unknown>>;
      return {
        attribute:
          (typeof attributeRaw === 'object' ? attributeRaw?.name : attributeRaw) ??
          'Attribute',
        values: values.map((valueRow) => {
          const valueRaw = pick<{ name?: string } | string>(valueRow, 'value');
          const feature = pick<{ url?: string } | null>(valueRow, 'feature_image');
          const additional = (pick<Array<Record<string, unknown>>>(
            valueRow,
            'additional_images',
          ) ?? []) as Array<{ id?: string; url?: string | null }>;
          return {
            id: String(valueRow.id ?? ''),
            label: typeof valueRaw === 'object' ? valueRaw?.name ?? '' : valueRaw ?? '',
            featureImageUrl: feature?.url ?? null,
            gallery: additional.map((image) => ({
              id: String(image.id ?? ''),
              url: image.url ?? null,
            })),
          };
        }),
      };
    });
  }

  async getProductDetail(productId: string): Promise<ProductDetail | null> {
    const dto = await apiRequest<ProductFullDto | null>(`/api/v1/admin/products/${productId}/`);
    if (!dto) return null;
    return toProductDetail(dto);
  }

  async saveVariantImages(
    productId: string,
    valueId: string,
    featureImage: File | null,
    gallery: File[],
  ): Promise<void> {
    const body = new FormData();
    body.append('value', valueId);
    if (featureImage) body.append('feature_image', featureImage, featureImage.name);
    for (const file of gallery) body.append('additional_images', file, file.name);
    await apiRequest(`/api/v1/productvarientimages/${productId}/`, {
      method: 'POST',
      body,
    });
  }
}

/* ---------------- Site configuration (CMS) ---------------- */

interface ConfigurationDto {
  company_intro?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  map_url?: string;
  social?: Partial<SocialLinks>;
}

function toConfiguration(dto: ConfigurationDto): SiteConfiguration {
  return {
    company_intro: dto.company_intro ?? '',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    whatsapp: dto.whatsapp ?? '',
    address: dto.address ?? '',
    map_url: dto.map_url ?? '',
    social: {
      facebook: dto.social?.facebook ?? '',
      instagram: dto.social?.instagram ?? '',
      tiktok: dto.social?.tiktok ?? '',
      pinterest: dto.social?.pinterest ?? '',
    },
  };
}

export class ApiConfigurationRepository implements ConfigurationRepository {
  async get(): Promise<SiteConfiguration> {
    const dto = await apiRequest<ConfigurationDto>('/api/v1/admin/configuration/');
    return toConfiguration(dto);
  }

  async update(input: SiteConfiguration): Promise<SiteConfiguration> {
    const dto = await apiRequest<ConfigurationDto>('/api/v1/admin/configuration/', {
      method: 'PATCH',
      json: input,
    });
    return toConfiguration(dto);
  }
}

/* ---------------- Policies (CMS) ---------------- */

interface PolicyDto {
  id: string;
  type: Policy['type'];
  type_display?: string;
  title?: string;
  content?: string;
  is_active?: boolean;
  updated_at?: string;
}

function toPolicy(dto: PolicyDto): Policy {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title ?? '',
    content: dto.content ?? '',
    is_active: dto.is_active ?? true,
    updated_at: dto.updated_at ?? '',
  };
}

export class ApiPolicyRepository implements PolicyRepository {
  async list(): Promise<Policy[]> {
    const items = await listAll<PolicyDto>('/api/v1/admin/policies/');
    return items.map(toPolicy);
  }

  async create(input: PolicyInput): Promise<Policy> {
    const dto = await apiRequest<PolicyDto>('/api/v1/admin/policies/', {
      method: 'POST',
      json: {
        type: input.type,
        title: input.title,
        content: input.content,
        is_active: input.is_active ?? true,
      },
    });
    return toPolicy(dto);
  }

  async update(id: string, patch: Partial<PolicyInput>): Promise<Policy> {
    const dto = await apiRequest<PolicyDto>(`/api/v1/admin/policies/${id}/`, {
      method: 'PATCH',
      json: patch,
    });
    return toPolicy(dto);
  }
}

/* ---------------- Analytics ---------------- */

/** Never let one optional CMS endpoint sink the whole dashboard. */
async function soft<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export class ApiAnalyticsRepository implements AnalyticsRepository {
  async snapshot(): Promise<DashboardSnapshot> {
    const [
      categories,
      attributes,
      models,
      products,
      members,
      collectionsPage,
      policies,
      configuration,
      story,
      sustainability,
      homepage,
    ] = await Promise.all([
      listAll<CategoryDto>('/api/v1/admin/categories/'),
      listAll<AttributeDto>('/api/v1/admin/attributes/'),
      listAll<ModelDto>('/api/v1/admin/product-models/'),
      listAll<ProductDto>('/api/v1/admin/products/'),
      soft(listAll<TeamMemberDto>('/api/v1/admin/team-members/'), []),
      soft(apiRequest<HomepageCollectionsDto | null>('/api/v1/admin/homepage/collections/'), null),
      soft(listAll<PolicyDto>('/api/v1/admin/policies/'), []),
      soft(apiRequest<ConfigurationDto | null>('/api/v1/admin/configuration/'), null),
      soft(apiRequest<StoryDto | null>('/api/v1/admin/our-story/'), null),
      soft(apiRequest<SustainabilityDto | null>('/api/v1/admin/our-sustainability/'), null),
      soft(apiRequest<HomepageDto | null>('/api/v1/admin/homepage/'), null),
    ]);

    const totalValues = attributes.reduce((sum, a) => sum + (a.values_count ?? a.values?.length ?? 0), 0);
    const activeCategories = categories.filter((c) => c.is_active !== false).length;
    const featured = products.filter((p) => p.is_featured).length;
    const visibleMakers = members.filter((m) => m.is_active !== false).length;

    const categoryCount = new Map<string, number>();
    for (const p of products) {
      const name = typeof p.category === 'object' ? p.category?.name ?? 'Uncategorized' : 'Uncategorized';
      categoryCount.set(name, (categoryCount.get(name) ?? 0) + 1);
    }

    const genderCount = new Map<string, number>();
    for (const p of products) {
      const label = PRODUCT_GENDERS.find((g) => g.value === p.gender)?.label ?? p.gender ?? 'None';
      genderCount.set(label, (genderCount.get(label) ?? 0) + 1);
    }

    const policiesFilled = policies.filter((p) => (p.content ?? '').trim().length > 0).length;

    const collections = collectionsPage?.collections ?? [];
    const storySubsections = story?.section3?.subsections ?? [];
    const sustainabilitySections = sustainability?.sections ?? [];
    const homepageFilled = Boolean(
      homepage &&
        [homepage.section1, homepage.section2, homepage.section3].some(
          (s) => (s?.title ?? '') || (s?.image ?? ''),
        ),
    );
    const configurationFilled = Boolean(
      configuration &&
        [
          configuration.company_intro,
          configuration.email,
          configuration.phone,
          configuration.whatsapp,
          configuration.address,
        ].some((v) => (v ?? '').trim().length > 0),
    );

    const metrics: MetricSummary[] = [
      {
        key: 'products',
        label: 'Products',
        value: products.length,
        format: 'number',
        footnote: `${featured} featured`,
      },
      {
        key: 'categories',
        label: 'Categories',
        value: categories.length,
        format: 'number',
        footnote: `${activeCategories} active`,
      },
      {
        key: 'models',
        label: 'Models',
        value: models.length,
        format: 'number',
        footnote: 'product model groups',
      },
      {
        key: 'attributes',
        label: 'Attributes',
        value: attributes.length,
        format: 'number',
        footnote: `${totalValues} values`,
      },
      {
        key: 'makers',
        label: 'Team members',
        value: members.length,
        format: 'number',
        footnote: `${visibleMakers} visible`,
      },
      {
        key: 'collections',
        label: 'Collections',
        value: collections.length,
        format: 'number',
        footnote: 'home page blocks',
      },
      {
        key: 'policies',
        label: 'Policies',
        value: policiesFilled,
        format: 'number',
        footnote: 'of 4 published',
      },
      {
        key: 'story',
        label: 'Story rows',
        value: storySubsections.length + sustainabilitySections.length,
        format: 'number',
        footnote: 'story + sustainability',
      },
    ];

    const cms: CmsStatusRow[] = [
      {
        key: 'configuration',
        label: 'Configuration',
        to: '/configuration',
        configured: configurationFilled,
        detail: configurationFilled
          ? configuration?.email || 'Company profile set'
          : 'Company profile empty',
      },
      {
        key: 'policies',
        label: 'Policies',
        to: '/policies',
        configured: policiesFilled === 4,
        detail: `${policiesFilled} of 4 published`,
      },
      {
        key: 'homepage',
        label: 'Home page',
        to: '/home-page',
        configured: homepageFilled,
        detail: homepageFilled ? 'Sections have content' : 'Sections empty',
      },
      {
        key: 'collections',
        label: 'Collections',
        to: '/home-page',
        configured: collections.length > 0,
        detail: `${collections.length} collection${collections.length === 1 ? '' : 's'}`,
      },
      {
        key: 'story',
        label: 'Our Story',
        to: '/story',
        configured: storySubsections.length > 0 || Boolean(story?.description),
        detail: `${storySubsections.length} subsection${storySubsections.length === 1 ? '' : 's'}`,
      },
      {
        key: 'makers',
        label: 'Our Makers',
        to: '/story',
        configured: members.length > 0,
        detail: `${members.length} maker${members.length === 1 ? '' : 's'}`,
      },
      {
        key: 'sustainability',
        label: 'Sustainability',
        to: '/story',
        configured: sustainabilitySections.length > 0,
        detail: `${sustainabilitySections.length} section${sustainabilitySections.length === 1 ? '' : 's'}`,
      },
    ];

    return {
      metrics,
      productsByCategory: [...categoryCount.entries()].map(([label, value]) => ({ label, value })),
      productsByGender: PRODUCT_GENDERS.map((g) => ({
        label: g.label,
        value: genderCount.get(g.label) ?? 0,
      })).filter((point) => point.value > 0),
      valuesByAttribute: attributes.map((a) => ({
        label: a.name,
        value: a.values_count ?? a.values?.length ?? 0,
      })),
      models: [...models]
        .sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0))
        .slice(0, 6)
        .map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug ?? '',
          productCount: m.product_count ?? 0,
        })),
      cms,
    };
  }
}

/* ---------------- Our Story & Sustainability ---------------- */

interface SimpleSectionDto {
  title?: string | null;
  description?: string | null;
  image?: string | null;
}

interface SubsectionDto {
  id?: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
}

interface StoryDto {
  title?: string | null;
  description?: string | null;
  section1?: SimpleSectionDto | null;
  section2?: SimpleSectionDto | null;
  section3?: { title?: string | null; subsections?: SubsectionDto[] | null } | null;
}

interface SustainabilityDto {
  title?: string | null;
  description?: string | null;
  sections?: SubsectionDto[] | null;
}

interface TeamMemberDto {
  id?: string;
  name?: string | null;
  role?: string | null;
  intro?: string | null;
  image?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
}

const toSimpleSection = (dto?: SimpleSectionDto | null): SimpleSection => ({
  title: dto?.title ?? '',
  description: dto?.description ?? '',
  image: dto?.image ?? '',
});

const toSubsectionRow = (dto: SubsectionDto, index: number): SubsectionRow => ({
  id: dto.id,
  title: dto.title ?? '',
  description: dto.description ?? '',
  image: dto.image ?? '',
  sort_order: dto.sort_order ?? index,
  is_active: dto.is_active ?? true,
});

const subsectionBody = (row: SubsectionRow) => ({
  title: row.title,
  description: row.description,
  image: row.image,
  sort_order: row.sort_order,
  is_active: row.is_active,
});

const toStory = (dto: StoryDto): StoryData => ({
  title: dto.title ?? '',
  description: dto.description ?? '',
  section1: toSimpleSection(dto.section1),
  section2: toSimpleSection(dto.section2),
  section3: {
    title: dto.section3?.title ?? '',
    subsections: (dto.section3?.subsections ?? []).map(toSubsectionRow),
  },
});

const toSustainability = (dto: SustainabilityDto): SustainabilityData => ({
  title: dto.title ?? '',
  description: dto.description ?? '',
  sections: (dto.sections ?? []).map(toSubsectionRow),
});

export class ApiStoryRepository implements StoryRepository {
  async get(): Promise<StoryData> {
    return toStory(await apiRequest<StoryDto>('/api/v1/admin/our-story/'));
  }

  async save(data: StoryData): Promise<StoryData> {
    // Sections ride as nested JSON objects (multipart can't carry them).
    // Images are Cloudinary URLs from /admin/images/upload/.
    return toStory(
      await apiRequest<StoryDto>('/api/v1/admin/our-story/', {
        method: 'PUT',
        json: {
          title: data.title,
          description: data.description,
          section1: data.section1,
          section2: data.section2,
          section3: {
            title: data.section3.title,
            subsections: data.section3.subsections.map(subsectionBody),
          },
        },
      }),
    );
  }
}

export class ApiSustainabilityRepository implements SustainabilityRepository {
  async get(): Promise<SustainabilityData> {
    return toSustainability(await apiRequest<SustainabilityDto>('/api/v1/admin/our-sustainability/'));
  }

  async save(data: SustainabilityData): Promise<SustainabilityData> {
    return toSustainability(
      await apiRequest<SustainabilityDto>('/api/v1/admin/our-sustainability/', {
        method: 'PUT',
        json: {
          title: data.title,
          description: data.description,
          sections: data.sections.map(subsectionBody),
        },
      }),
    );
  }
}

const toTeamMember = (dto: TeamMemberDto): TeamMember => ({
  id: dto.id ?? '',
  name: dto.name ?? '',
  role: dto.role ?? '',
  intro: dto.intro ?? '',
  image: dto.image ?? '',
  sort_order: dto.sort_order ?? 0,
  is_active: dto.is_active ?? true,
});

/**
 * Builds the member request body. Photos are Cloudinary URLs (uploaded via
 * /admin/images/upload/), so members are plain JSON like every other block.
 */
function memberPayload(input: Partial<TeamMemberInput>): { json: Record<string, unknown> } {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null) fields[key] = value;
  }
  return { json: fields };
}

export class ApiMakersRepository implements MakersRepository {
  async getHead(): Promise<ContentPage> {
    const dto = await apiRequest<{ title?: string; description?: string }>('/api/v1/admin/our-makers/');
    return { title: dto.title ?? '', description: dto.description ?? '' };
  }

  async saveHead(head: ContentPage): Promise<ContentPage> {
    const dto = await apiRequest<{ title?: string; description?: string }>('/api/v1/admin/our-makers/', {
      method: 'PATCH',
      json: head,
    });
    return { title: dto.title ?? '', description: dto.description ?? '' };
  }

  async listMembers(): Promise<TeamMember[]> {
    const items = await listAll<TeamMemberDto>('/api/v1/admin/team-members/');
    return items.map(toTeamMember).sort((a, b) => a.sort_order - b.sort_order);
  }

  async createMember(input: TeamMemberInput): Promise<TeamMember> {
    const dto = await apiRequest<TeamMemberDto>('/api/v1/admin/team-members/', {
      method: 'POST',
      ...memberPayload(input),
    });
    return toTeamMember(dto);
  }

  async updateMember(id: string, patch: Partial<TeamMemberInput>): Promise<TeamMember> {
    const dto = await apiRequest<TeamMemberDto>(`/api/v1/admin/team-members/${id}/`, {
      method: 'PATCH',
      ...memberPayload(patch),
    });
    return toTeamMember(dto);
  }

  async removeMember(id: string): Promise<void> {
    await apiRequest(`/api/v1/admin/team-members/${id}/`, { method: 'DELETE' });
  }
}

export class ApiImageUploadRepository implements ImageUploadRepository {
  async upload(file: File): Promise<string> {
    const form = new FormData();
    form.append('image', file);
    const dto = await apiRequest<{ url?: string }>('/api/v1/admin/images/upload/', {
      method: 'POST',
      body: form,
    });
    if (!dto.url) throw new Error('Upload succeeded but no image URL was returned.');
    return dto.url;
  }
}

/* ---------------- Home page ---------------- */

interface HomepageDto {
  section1?: Partial<HomepageSection1> | null;
  section2?: (Partial<Omit<HomepageSection2, 'feature'>> & {
    feature?: { title?: string | null; intro?: string | null }[] | null;
  }) | null;
  section3?: Partial<HomepageSection3> | null;
}

const toHomepage = (dto: HomepageDto): HomepageData => ({
  section1: {
    tag: dto.section1?.tag ?? '',
    image: dto.section1?.image ?? '',
    title: dto.section1?.title ?? '',
    description: dto.section1?.description ?? '',
    quote: dto.section1?.quote ?? '',
  },
  section2: {
    tag: dto.section2?.tag ?? '',
    title: dto.section2?.title ?? '',
    description: dto.section2?.description ?? '',
    image: dto.section2?.image ?? '',
    feature: (dto.section2?.feature ?? []).map((f) => ({
      title: f.title ?? '',
      intro: f.intro ?? '',
    })),
  },
  section3: {
    tag: dto.section3?.tag ?? '',
    title: dto.section3?.title ?? '',
    image: dto.section3?.image ?? '',
    description: dto.section3?.description ?? '',
  },
});

export class ApiHomepageRepository implements HomepageRepository {
  async get(): Promise<HomepageData> {
    return toHomepage(await apiRequest<HomepageDto>('/api/v1/admin/homepage/'));
  }

  async save(data: HomepageData): Promise<HomepageData> {
    return toHomepage(
      await apiRequest<HomepageDto>('/api/v1/admin/homepage/', {
        method: 'PUT',
        json: {
          section1: {
            tag: data.section1.tag,
            image: data.section1.image,
            title: data.section1.title,
            description: data.section1.description,
            quote: data.section1.quote,
          },
          section2: {
            tag: data.section2.tag,
            title: data.section2.title,
            description: data.section2.description,
            image: data.section2.image,
            feature: data.section2.feature.map((f) => ({ title: f.title, intro: f.intro })),
          },
          section3: {
            tag: data.section3.tag,
            title: data.section3.title,
            image: data.section3.image,
            description: data.section3.description,
          },
        },
      }),
    );
  }
}

interface CollectionDto {
  id?: string;
  name?: string | null;
  intro?: string | null;
  link?: string | null;
  image?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
}

interface HomepageCollectionsDto {
  tag?: string | null;
  title?: string | null;
  description?: string | null;
  collections?: CollectionDto[] | null;
}

const toCollectionRow = (dto: CollectionDto, index: number): CollectionRow => ({
  id: dto.id,
  name: dto.name ?? '',
  intro: dto.intro ?? '',
  link: dto.link ?? '',
  image: dto.image ?? '',
  sort_order: dto.sort_order ?? index,
  is_active: dto.is_active ?? true,
});

const collectionBody = (row: CollectionRow) => ({
  name: row.name,
  intro: row.intro,
  link: row.link,
  image: row.image,
  sort_order: row.sort_order,
  is_active: row.is_active,
});

export class ApiHomepageCollectionsRepository implements HomepageCollectionsRepository {
  async get(): Promise<HomepageCollectionsData> {
    const dto = await apiRequest<HomepageCollectionsDto>('/api/v1/admin/homepage/collections/');
    return {
      tag: dto.tag ?? '',
      title: dto.title ?? '',
      description: dto.description ?? '',
      collections: (dto.collections ?? []).map(toCollectionRow),
    };
  }

  async save(data: HomepageCollectionsData): Promise<HomepageCollectionsData> {
    const dto = await apiRequest<HomepageCollectionsDto>('/api/v1/admin/homepage/collections/', {
      method: 'PUT',
      json: {
        tag: data.tag,
        title: data.title,
        description: data.description,
        collections: data.collections.map(collectionBody),
      },
    });
    return {
      tag: dto.tag ?? '',
      title: dto.title ?? '',
      description: dto.description ?? '',
      collections: (dto.collections ?? []).map(toCollectionRow),
    };
  }
}

/* ---------------- Subscriptions ---------------- */

interface SubscriptionDto {
  id?: string;
  email?: string;
  is_active?: boolean;
  subscribed_at?: string;
  created_at?: string;
}

export class ApiSubscriptionRepository implements SubscriptionRepository {
  async list(filters: SubscriptionFilters = {}): Promise<Subscription[]> {
    const params = new URLSearchParams();
    if (filters.is_active !== undefined) params.set('is_active', String(filters.is_active));
    const qs = params.toString();
    const items = await listAll<SubscriptionDto>(
      `/api/v1/admin/subscriptions/${qs ? `?${qs}` : ''}`,
    );
    return items.map((dto) => ({
      id: dto.id ?? '',
      email: dto.email ?? '',
      is_active: dto.is_active ?? true,
      subscribed_at: dto.subscribed_at ?? '',
      created_at: dto.created_at ?? '',
    }));
  }
}

/* ---------------- Contact messages ---------------- */

interface ContactMessageDto {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message?: string | null;
  status?: string | null;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

const toContactMessage = (dto: ContactMessageDto): ContactMessage => ({
  id: dto.id ?? '',
  name: dto.name ?? '',
  email: dto.email ?? '',
  phone: dto.phone ?? '',
  subject: dto.subject ?? '',
  message: dto.message ?? '',
  status: (dto.status as ContactMessage['status']) ?? 'NEW',
  admin_notes: dto.admin_notes ?? '',
  created_at: dto.created_at ?? '',
  updated_at: dto.updated_at ?? '',
});

export class ApiContactMessageRepository implements ContactMessageRepository {
  async list(filters: ContactMessageFilters = {}): Promise<ContactMessage[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    const qs = params.toString();
    const items = await listAll<ContactMessageDto>(
      `/api/v1/admin/contact-messages/${qs ? `?${qs}` : ''}`,
    );
    return items
      .map(toContactMessage)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  async update(id: string, patch: ContactMessageUpdate): Promise<ContactMessage> {
    const dto = await apiRequest<ContactMessageDto>(`/api/v1/admin/contact-messages/${id}/`, {
      method: 'PATCH',
      json: patch,
    });
    return toContactMessage(dto);
  }
}
