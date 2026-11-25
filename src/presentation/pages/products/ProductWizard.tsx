/**
 * 3-step product wizard, mirroring the backend flow:
 *   Tab 1 — Product Information → POST/PATCH /api/v1/admin/products/
 *   Tab 2 — Product Variants    → GET/POST/PATCH/DELETE /api/v1/productvarientvalues/{product_id}
 *   Tab 3 — Product Images      → POST /api/v1/productvarientimages/{product_id}/ (per value)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ImagePlus, Plus, Save, Star, Upload, X } from 'lucide-react';
import type {
  AttributeValueOption,
  KeyFeature,
  Product,
  ProductGender,
  ProductRef,
  ProductVariantDetail,
  SoleType,
  UsageLocation,
  VariantImageGroup,
} from '../../../domain/entities/product';
import { PRODUCT_GENDERS, SOLE_OPTIONS, USAGE_LOCATIONS } from '../../../domain/entities/product';
import { repositories } from '../../../data/repositories';
import { useAsync } from '../../../application/hooks/useAsync';
import { useToast } from '../../../application/toast/ToastProvider';
import { cn } from '../../../shared/format';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

type Step = 1 | 2 | 3;

/** Map a detail ref (id may be a UUID, slug or name) to the option's UUID. */
function resolveRef(
  current: string,
  ref: ProductRef | null,
  opts: Array<{ id: string; name: string; slug?: string }>,
): string {
  if (!ref) return current;
  if (current && opts.some((o) => o.id === current)) return current;
  const byId = ref.id ? opts.find((o) => o.id === ref.id) : undefined;
  if (byId) return byId.id;
  const bySlug = opts.find((o) => o.slug === ref.slug || o.slug === ref.id || o.id === ref.slug);
  if (bySlug) return bySlug.id;
  const byName = opts.find((o) => o.name.toLowerCase() === (ref.name || '').toLowerCase());
  if (byName) return byName.id;
  return current || ref.id;
}

/* ---------------- Tab 1 · Product Information ---------------- */

function InfoStep({
  product,
  productId,
  onPersisted,
}: {
  product: Product | null;
  productId: string | null;
  onPersisted: (id: string) => void;
}) {
  const toast = useToast();
  const categories = useAsync(() => repositories.categories.list(), []);
  const models = useAsync(() => repositories.models.list(), []);

  // The list row is lean now — edit mode prefills from GET /admin/products/{id}/.
  const detail = useAsync(
    () => (product ? repositories.products.getProductDetail(product.id) : Promise.resolve(null)),
    [product?.id ?? 'new'],
  );

  const [name, setName] = useState(product?.name ?? '');
  const [gender, setGender] = useState<ProductGender>(product?.gender ?? 'NONE');
  const [usage, setUsage] = useState<UsageLocation | ''>(product?.usage_location ?? 'INSIDE');
  const [sole, setSole] = useState<SoleType | ''>(product?.sole ?? '');
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? '');
  const [modelId, setModelId] = useState(product?.model?.id ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [generalInfo, setGeneralInfo] = useState(product?.general_information ?? '');
  const [materials, setMaterials] = useState(product?.materials_used ?? '');
  const [keyFeatures, setKeyFeatures] = useState<KeyFeature[]>(product?.key_features ?? []);
  const [featured, setFeatured] = useState(product?.is_featured ?? false);
  const [featureFile, setFeatureFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seeded = useRef(false);
  useEffect(() => {
    const src = detail.data;
    if (!src || seeded.current) return;
    seeded.current = true;
    setName(src.name || name);
    setGender(src.gender || 'NONE');
    if (src.usage_location) setUsage(src.usage_location);
    if (src.sole) setSole(src.sole);
    setDescription(src.description || description);
    setGeneralInfo(src.general_information || generalInfo);
    setMaterials(src.materials_used || materials);
    if (src.key_features.length) setKeyFeatures(src.key_features);
    setFeatured(src.is_featured);
    if (src.category) setCategoryId(src.category.id || src.category.name);
    if (src.model) setModelId(src.model.id || src.model.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.data]);

  // Detail payloads may identify category/model by slug/name — map to UUIDs
  // once the option lists arrive.
  useEffect(() => {
    const src = detail.data;
    if (src?.category && categories.data) {
      setCategoryId((current) => resolveRef(current, src.category, categories.data ?? []));
    }
  }, [detail.data, categories.data]);
  useEffect(() => {
    const src = detail.data;
    if (src?.model && models.data) {
      setModelId((current) => resolveRef(current, src.model, models.data ?? []));
    }
  }, [detail.data, models.data]);

  const currentImageUrl = detail.data?.featureImageUrl ?? product?.featureImageUrl ?? null;

  const previewUrl = useMemo(
    () => (featureFile ? URL.createObjectURL(featureFile) : null),
    [featureFile],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const save = async () => {
    if (!name.trim()) return setError('Product name is required.');
    if (!categoryId) return setError('Choose a category.');
    setError(null);
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        category: categoryId,
        model: modelId || undefined,
        gender: gender !== 'NONE' ? gender : undefined,
        usage_location: (usage || undefined) as UsageLocation | undefined,
        sole: (sole || undefined) as SoleType | undefined,
        description: description.trim(),
        general_information: generalInfo.trim(),
        materials_used: materials.trim(),
        is_featured: featured,
        key_features: keyFeatures
          .map((feature) => ({ title: feature.title.trim(), value: feature.value.trim() }))
          .filter((feature) => feature.title || feature.value),
        feature_image: featureFile,
      };
      const saved = productId
        ? await repositories.products.update(productId, input)
        : await repositories.products.create(input);
      
      // Update form state with the saved product data to reflect backend response
      setName(saved.name);
      setGender(saved.gender ?? 'NONE');
      setUsage(saved.usage_location);
      setSole(saved.sole);
      setDescription(saved.description);
      setGeneralInfo(saved.general_information);
      setMaterials(saved.materials_used);
      setFeatured(saved.is_featured);
      setKeyFeatures(saved.key_features);
      if (saved.category) setCategoryId(saved.category.id);
      if (saved.model) setModelId(saved.model.id);
      
      toast.success(productId ? 'Product info updated' : 'Product created — continue to variants');
      onPersisted(saved.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save product info.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <div className="form-grid">
        <div className="span-2">
          <Field label="Product name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Classic Slipper — Grey" />
          </Field>
        </div>
        <Field label="Gender">
          <Select
            options={PRODUCT_GENDERS}
            value={gender}
            onChange={(e) => setGender(e.target.value as ProductGender)}
          />
        </Field>
        <Field label="Usage location">
          <Select
            options={[{ value: '', label: 'Not specified' }, ...USAGE_LOCATIONS]}
            value={usage}
            onChange={(e) => setUsage(e.target.value as UsageLocation | '')}
          />
        </Field>
        <Field label="Sole (optional)">
          <Select
            options={[{ value: '', label: 'Not specified' }, ...SOLE_OPTIONS]}
            value={sole}
            onChange={(e) => setSole(e.target.value as SoleType | '')}
          />
        </Field>
        <Field label="Category *">
          <Select
            options={[
              { value: '', label: categories.loading ? 'Loading…' : 'Select category' },
              ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
        </Field>
        <Field label="Model (optional)">
          <Select
            options={[
              { value: '', label: models.loading ? 'Loading…' : 'Select model' },
              ...(models.data ?? []).map((m) => ({ value: m.id, label: m.name })),
            ]}
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          />
        </Field>
        <Field label="Featured on storefront">
          <div className="switch-row">
            <Switch checked={featured} onChange={setFeatured} label="Featured" />
            <span className="cell-sub">{featured ? 'Shown in featured sections' : 'Not featured'}</span>
          </div>
        </Field>
        <div className="span-2">
          <Field label="Description">
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown in the storefront"
            />
          </Field>
        </div>
        <div className="span-2">
          <Field label="General information (optional)">
            <textarea
              className="input"
              rows={2}
              value={generalInfo}
              onChange={(e) => setGeneralInfo(e.target.value)}
              placeholder="e.g. Comfy, warm and breathable"
            />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Materials used (optional)">
            <Input
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="e.g. Wool"
            />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Feature image (optional)">
            <div className="img-picker">
              <span className="img-thumb img-thumb-lg">
                {previewUrl ? (
                  <img src={previewUrl} alt="Feature preview" />
                ) : currentImageUrl ? (
                  <img src={currentImageUrl} alt="Current feature image" />
                ) : (
                  <ImagePlus size={18} />
                )}
              </span>
              <label className="file-drop file-drop-sm">
                <ImagePlus size={15} />
                {featureFile
                  ? featureFile.name
                  : currentImageUrl
                    ? 'Replace feature image'
                    : 'Choose image'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setFeatureFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {featureFile && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setFeatureFile(null)}>
                  <X size={14} /> Remove
                </Button>
              )}
            </div>
          </Field>
        </div>
        <div className="span-2">
          <Field label="Key features (optional)">
            <div className="value-editor">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="value-editor-row">
                  <Input
                    value={feature.title}
                    onChange={(e) =>
                      setKeyFeatures((rows) =>
                        rows.map((row, i) => (i === index ? { ...row, title: e.target.value } : row)),
                      )
                    }
                    placeholder="Title (e.g. Material)"
                  />
                  <Input
                    value={feature.value}
                    onChange={(e) =>
                      setKeyFeatures((rows) =>
                        rows.map((row, i) => (i === index ? { ...row, value: e.target.value } : row)),
                      )
                    }
                    placeholder="Value (e.g. 100% Wool Felt)"
                  />
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Remove feature"
                    onClick={() => setKeyFeatures((rows) => rows.filter((_, i) => i !== index))}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setKeyFeatures((rows) => [...rows, { title: '', value: '' }])}
              >
                <Plus size={14} /> Add feature
              </Button>
            </div>
          </Field>
        </div>
      </div>

      {error && (
        <div className="form-error">
          <X size={15} /> {error}
        </div>
      )}

      <div className="step-actions">
        <Button onClick={save} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving…' : productId ? 'Save info & continue' : 'Create & continue'}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Tab 2 · Product Variants ---------------- */

interface AttributeGroup {
  key: string; // attribute UUID (falls back to name)
  label: string;
  values: AttributeValueOption[];
}

interface VariantRow {
  id: number;
  attributeId: string;
  optionIds: string[];
}

interface VariantDraft {
  name: string;
  price: string;
  active: boolean;
  special: boolean;
}

const EMPTY_DRAFT: VariantDraft = { name: '', price: '', active: true, special: false };

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]],
  );
}

function AttributesStep({ productId, onDone }: { productId: string; onDone: () => void }) {
  const toast = useToast();
  const values = useAsync(() => repositories.products.listAttributeValues(), []);
  const detail = useAsync(() => repositories.products.getProductDetail(productId), [productId]);
  const savedVariants = useAsync(
    () =>
      productId
        ? repositories.products.listProductVariants(productId)
        : Promise.resolve([] as ProductVariantDetail[]),
    [productId],
  );
  const nextRowId = useRef(2);
  const prefilled = useRef(false);
  const adminPrefilled = useRef(false);

  const [rows, setRows] = useState<VariantRow[]>([{ id: 1, attributeId: '', optionIds: [] }]);
  const [drafts, setDrafts] = useState<Record<string, VariantDraft>>({});
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
  const [savedComboKeys, setSavedComboKeys] = useState<Set<string> | null>(null);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo<AttributeGroup[]>(() => {
    const map = new Map<string, AttributeGroup>();
    const ensure = (key: string, label: string) => {
      if (!map.has(key)) map.set(key, { key, label: label || 'Attribute', values: [] });
      return map.get(key)!;
    };
    const lowered = (text: string) => text.trim().toLowerCase();
    // Global attribute values first — their ids are the only ones the backend
    // accepts when saving variants.
    for (const value of values.data ?? []) {
      const key = value.attribute_id || value.attribute_name;
      ensure(key, value.attribute_name).values.push(value);
    }
    // Fold in saved values the product has (display); dedupe by id or name so
    // we never list the same option twice.
    for (const attr of detail.data?.attributes ?? []) {
      const group =
        [...map.values()].find((g) => lowered(g.label) === lowered(attr.attribute)) ??
        ensure(attr.id, attr.attribute);
      for (const value of attr.values) {
        const known = group.values.some(
          (existing) =>
            existing.id === value.id || lowered(existing.name) === lowered(value.name),
        );
        if (!known) {
          group.values.push({
            id: value.id,
            name: value.name,
            attribute_id: group.key,
            attribute_name: group.label,
          });
        }
      }
    }
    return [...map.values()];
  }, [values.data, detail.data]);

  /* Fallback prefill from product detail. The product variant endpoint takes
   * precedence once its response has loaded. */
  useEffect(() => {
    if (prefilled.current || !detail.data || adminPrefilled.current) return;
    const lowered = (text: string) => text.trim().toLowerCase();
    const source = detail.data;

    const newRows: VariantRow[] = [];
    // The detail's attributeValues[].id are per-product rows; the backend only
    // accepts global attribute-value UUIDs, so map detail id → global id.
    const toGlobalId = new Map<string, string>();
    for (const attr of source.attributes) {
      const group =
        groups.find((g) => g.key === attr.id) ??
        groups.find((g) => lowered(g.label) === lowered(attr.attribute));
      if (!group) continue;
      const optionIds: string[] = [];
      for (const value of attr.values) {
        const global =
          group.values.find((gv) => gv.id === value.id) ??
          group.values.find((gv) => lowered(gv.name) === lowered(value.name));
        if (global) {
          toGlobalId.set(value.id, global.id);
          if (!optionIds.includes(global.id)) optionIds.push(global.id);
        }
      }
      if (optionIds.length > 0) {
        newRows.push({ id: nextRowId.current++, attributeId: group.key, optionIds });
      }
    }

    const newDrafts: Record<string, VariantDraft> = {};
    for (const variant of source.variants) {
      const globalIds = variant.optionIds
        .map((id) => toGlobalId.get(id) ?? id)
        .filter(Boolean);
      if (globalIds.length === 0) continue;
      newDrafts[[...globalIds].sort().join('|')] = {
        name: variant.name,
        price: variant.price,
        active: variant.is_active,
        special: variant.is_special_edition,
      };
    }

    if (newRows.length > 0) setRows(newRows);
    // Merge so drafts from the authoritative product variant response survive
    // whichever prefill effect resolves first.
    setDrafts((prev) => ({ ...newDrafts, ...prev }));
    setGenerated(newRows.length > 0 && source.variants.length > 0);
    prefilled.current = true;
  }, [detail.data, values.data, groups]);

  /* The product variant endpoint is the source of truth for step 2 on edit.
   * Keep only combinations actually returned by the API; a cartesian rebuild
   * from the remaining palette would reintroduce variants the user removed. */
  useEffect(() => {
    const saved = savedVariants.data;
    if (!saved || adminPrefilled.current || values.loading || groups.length === 0) return;
    adminPrefilled.current = true;
    if (saved.length === 0) {
      setGenerated(false);
      setSavedComboKeys(new Set());
      return;
    }
    const lowered = (text: string) => text.trim().toLowerCase();
    const optionsByAttr = new Map<string, string[]>();
    const newDrafts: Record<string, VariantDraft> = {};
    let validVariantCount = 0;
    for (const variant of saved) {
      const ids: string[] = [];
      for (const option of variant.options) {
        const group =
          groups.find((g) => g.key === option.attribute) ??
          groups.find((g) => lowered(g.label) === lowered(option.attribute));
        const value = group?.values.find((v) => lowered(v.name) === lowered(option.value));
        if (!value) continue;
        const existing = optionsByAttr.get(group!.key) ?? [];
        if (!existing.includes(value.id)) existing.push(value.id);
        optionsByAttr.set(group!.key, existing);
        ids.push(value.id);
      }
      if (ids.length === 0) continue;
      validVariantCount += 1;
      newDrafts[[...ids].sort().join('|')] = {
        name: variant.name,
        price: variant.price,
        active: variant.is_active,
        special: variant.is_special_edition,
      };
    }
    // A detail response can contain stale/inactive variant rows without usable
    // option details. They must not make the edit grid appear generated.
    if (optionsByAttr.size === 0 || validVariantCount === 0) {
      setGenerated(false);
      setSavedComboKeys(new Set());
      return;
    }
    setRows(
      [...optionsByAttr.entries()].map(([attributeId, optionIds]) => ({
        id: nextRowId.current++,
        attributeId,
        optionIds,
      })),
    );
    setDrafts((prev) => ({ ...prev, ...newDrafts }));
    setRemovedKeys(new Set());
    setSavedComboKeys(new Set(Object.keys(newDrafts)));
    setGenerated(validVariantCount > 0);
  }, [savedVariants.data, groups, values.loading]);

  const optionsFor = (attributeId: string) =>
    groups.find((g) => g.key === attributeId)?.values ?? [];

  const addRow = () =>
    setRows((prev) => [...prev, { id: nextRowId.current++, attributeId: '', optionIds: [] }]);

  const removeRow = (rowId: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rowId) : prev));

  const setRowAttribute = (rowId: number, attributeId: string) =>
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, attributeId, optionIds: [] } : r)),
    );

  const toggleOption = (rowId: number, valueId: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              optionIds: r.optionIds.includes(valueId)
                ? r.optionIds.filter((id) => id !== valueId)
                : [...r.optionIds, valueId],
            }
          : r,
      ),
    );

  const activeRows = rows.filter((r) => r.attributeId && r.optionIds.length > 0);

  const combos = useMemo(() => {
    if (!generated || activeRows.length === 0) return [];
    return cartesian(
      activeRows.map((row) =>
        row.optionIds.map((id) => optionsFor(row.attributeId).find((v) => v.id === id)!).filter(Boolean),
      ),
    ).filter(
      (combo) =>
        savedComboKeys === null ||
        savedComboKeys.has(combo.map((value) => value.id).sort().join('|')),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generated, rows, groups, savedComboKeys]);

  const comboKey = (rowValues: AttributeValueOption[]) =>
    rowValues.map((v) => v.id).sort().join('|');

  /* Combinations the user has struck out before saving. */
  const visibleCombos = useMemo(
    () => combos.filter((row) => !removedKeys.has(comboKey(row))),
    [combos, removedKeys],
  );

  const removeCombo = (rowValues: AttributeValueOption[]) =>
    setRemovedKeys((prev) => new Set(prev).add(comboKey(rowValues)));

  const restoreCombos = () => setRemovedKeys(new Set());

  const generate = () => {
    const incomplete = rows.find((r) => r.attributeId && r.optionIds.length === 0);
    if (incomplete) return setError('Every attribute row needs at least one option.');
    const configured = rows.filter((r) => r.attributeId);
    if (configured.length === 0) return setError('Pick an attribute first.');
    const duplicated = new Set<string>();
    for (const row of configured) {
      if (duplicated.has(row.attributeId)) {
        return setError('Each attribute can only be used once.');
      }
      duplicated.add(row.attributeId);
    }
    setError(null);
    setRemovedKeys(new Set());
    setSavedComboKeys(null);
    setGenerated(true);
  };

  const draftFor = (key: string): VariantDraft => drafts[key] ?? EMPTY_DRAFT;

  const updateDraft = (key: string, patch: Partial<VariantDraft>) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] ?? EMPTY_DRAFT), ...patch } }));

  const saveVariants = async () => {
    if (combos.length === 0) return setError('Generate variants first.');
    const missing = visibleCombos.find((row) => !draftFor(comboKey(row)).price.trim());
    if (missing) return setError(`Set a price for: ${missing.map((v) => v.name).join(' · ')}`);
    setError(null);
    setSaving(true);
    try {
      await repositories.products.saveVariants(productId, {
        attributes: activeRows.map((row) => ({
          attribute: row.attributeId,
          options: row.optionIds,
        })),
        generatedVarients: visibleCombos.map((row) => {
          const draft = draftFor(comboKey(row));
          return {
            name: draft.name.trim() || row.map((v) => v.name).join(' · '),
            price: draft.price.trim(),
            is_active: draft.active,
            is_special_edition: draft.special,
            optionIds: row.map((v) => v.id),
            attributes: row.map((value) => ({
              attributeId: value.attribute_id,
              attributeValues: [value.id],
            })),
          };
        }),
      });
      toast.success('Variants & prices saved');
      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save variants.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (values.loading) return <Skeleton style={{ height: 240 }} />;

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No attributes yet"
        description="Create attributes with values first — the palette is built from them."
      />
    );
  }

  return (
    <div className="stack">
      <div className="variant-builder">
        <div className="variant-cols-head">
          <div className="col-head">
            <span className="req-label">
              Attribute <span className="req">*</span>
            </span>
          </div>
          <div className="col-head">
            <span className="req-label">
              Options <span className="req">*</span>
            </span>
          </div>
          <span aria-hidden />
        </div>

        {rows.map((row) => (
          <div key={row.id} className="variant-row">
            <div className="variant-row-field">
              <Select
                options={[
                  { value: '', label: 'Select Attribute' },
                  ...groups.map((g) => ({ value: g.key, label: g.label })),
                ]}
                value={row.attributeId}
                onChange={(e) => setRowAttribute(row.id, e.target.value)}
              />
            </div>
            <div className="variant-row-field">
              {row.attributeId ? (
                <div className="chip-row">
                  {optionsFor(row.attributeId).map((value) => (
                    <button
                      key={value.id}
                      type="button"
                      className={cn('pick-chip', row.optionIds.includes(value.id) && 'active')}
                      onClick={() => toggleOption(row.id, value.id)}
                    >
                      {value.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="options-placeholder">Select Options</div>
              )}
            </div>
            <div className="variant-row-side">
              <button
                type="button"
                className="icon-btn danger"
                title="Remove row"
                onClick={() => removeRow(row.id)}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}

        <div className="variant-builder-actions">
          <Button type="button" variant="ghost" onClick={addRow}>
            <Plus size={14} /> Add More Variants
          </Button>
          <Button type="button" onClick={generate}>
            Generate Variants
          </Button>
        </div>
      </div>

      {generated && combos.length > 0 && (
        <div className="variant-table-wrap">
          <table className="variant-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>SN</th>
                <th>Variant</th>
                <th style={{ minWidth: 180 }}>Name</th>
                <th style={{ width: 140 }}>Price</th>
                <th style={{ width: 84 }}>Active</th>
                <th style={{ width: 110 }}>Special</th>
                <th style={{ width: 60 }} aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {visibleCombos.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '18px', opacity: 0.6 }}>
                    All combinations removed — restore one below to save.
                  </td>
                </tr>
              )}
              {visibleCombos.map((row, index) => {
                const key = comboKey(row);
                const draft = draftFor(key);
                const comboLabel = row.map((v) => v.name).join(' · ');
                return (
                  <tr key={key}>
                    <td style={{ opacity: 0.65 }}>{index + 1}</td>
                    <td>{comboLabel}</td>
                    <td>
                      <Input
                        value={draft.name}
                        placeholder={comboLabel}
                        onChange={(e) => updateDraft(key, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={draft.price}
                        onChange={(e) => updateDraft(key, { price: e.target.value })}
                      />
                    </td>
                    <td className="cell-center">
                      <Switch
                        checked={draft.active}
                        onChange={(next) => updateDraft(key, { active: next })}
                        label={`Active for ${comboLabel}`}
                      />
                    </td>
                    <td className="cell-center">
                      <Switch
                        checked={draft.special}
                        onChange={(next) => updateDraft(key, { special: next })}
                        label={`Special edition for ${comboLabel}`}
                      />
                    </td>
                    <td className="cell-center">
                      <button
                        type="button"
                        className="icon-btn danger"
                        title={`Remove ${comboLabel} from this save`}
                        onClick={() => removeCombo(row)}
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {removedKeys.size > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(92, 125, 108, 0.08)',
                border: '1px solid rgba(92, 125, 108, 0.25)',
                fontSize: 13,
              }}
            >
              <span style={{ opacity: 0.85 }}>
                {removedKeys.size} combination{removedKeys.size > 1 ? 's' : ''} removed from this
                save.
              </span>
              <button
                type="button"
                onClick={restoreCombos}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  padding: 0,
                }}
              >
                Restore all
              </button>
            </div>
          )}
        </div>
      )}

      {detail.error && (
        <div className="form-error">
          <X size={15} /> Could not load the saved product detail: {detail.error}
        </div>
      )}

      {error && (
        <div className="form-error">
          <X size={15} /> {error}
        </div>
      )}

      {generated && combos.length > 0 && (
        <div className="step-actions">
          <Button onClick={saveVariants} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save variants & continue'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Tab 3 · Product Images ---------------- */

function ValueImageCard({
  productId,
  groupLabel,
  value,
  onUploaded,
}: {
  productId: string;
  groupLabel: string;
  value: VariantImageGroup['values'][number];
  onUploaded: () => void;
}) {
  const toast = useToast();
  const [featureFile, setFeatureFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const hasNewFiles = Boolean(featureFile) || galleryFiles.length > 0;

  const upload = async () => {
    if (!hasNewFiles) return;
    setBusy(true);
    try {
      await repositories.products.saveVariantImages(productId, value.id, featureFile, galleryFiles);
      toast.success(`Images saved for ${value.label || groupLabel}`);
      setFeatureFile(null);
      setGalleryFiles([]);
      onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="img-card">
      <div className="img-card-head">
        <span className="cell-main">{value.label || 'Value'}</span>
        <span className="cell-sub">{groupLabel}</span>
      </div>

      {(value.featureImageUrl || value.gallery.length > 0) && (
        <div className="img-thumbs">
          {value.featureImageUrl && (
            <span className="img-thumb" title="Featured image">
              <Star size={12} className="img-thumb-star" />
              <img src={value.featureImageUrl} alt={value.label} />
            </span>
          )}
          {value.gallery.map((image) => (
            <span key={image.id} className="img-thumb">
              {image.url ? <img src={image.url} alt={`${value.label} gallery`} /> : null}
            </span>
          ))}
        </div>
      )}

      <div className="img-card-controls">
        <label className="file-drop file-drop-sm">
          <ImagePlus size={15} />
          {featureFile ? featureFile.name : value.featureImageUrl ? 'Replace feature image' : 'Feature image'}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setFeatureFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="file-drop file-drop-sm">
          <ImagePlus size={15} />
          {galleryFiles.length > 0
            ? `${galleryFiles.length} gallery file${galleryFiles.length > 1 ? 's' : ''} picked`
            : 'Gallery images'}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => setGalleryFiles([...(e.target.files ?? [])])}
          />
        </label>
        <Button size="sm" onClick={upload} disabled={busy || !hasNewFiles}>
          <Upload size={14} /> {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}

function ImagesStep({ productId }: { productId: string }) {
  const { data, loading, reload } = useAsync(
    () => repositories.products.getVariantImages(productId),
    [productId],
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (tick > 0) void reload();
  }, [tick, reload]);

  if (loading && !data) return <Skeleton style={{ height: 220 }} />;

  const groups = data ?? [];
  if (groups.length === 0) {
    return (
      <EmptyState
        title="No values to illustrate yet"
        description="Generate variants in step 2 first — each value then gets its own image slots here."
      />
    );
  }

  return (
    <div className="stack">
      <p className="step-note">
        Upload a featured image and optional gallery for every value. Each upload is saved
        instantly.
      </p>
      {groups.map((group) =>
        group.values.map((value) => (
          <ValueImageCard
            key={value.id}
            productId={productId}
            groupLabel={group.attribute}
            value={value}
            onUploaded={() => setTick((t) => t + 1)}
          />
        )),
      )}
    </div>
  );
}

/* ---------------- Wizard shell ---------------- */

const STEP_LABELS: Record<Step, string> = {
  1: 'Product Information',
  2: 'Product Variants',
  3: 'Product Images',
};

export function ProductWizard({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setProductId(product?.id ?? null);
    }
  }, [open, product]);

  const finish = () => {
    if (step === 3 && productId) toast.success('Product saved');
    onClose();
  };

  const steps: Step[] = [1, 2, 3];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? `Edit product — ${product.name}` : 'Add product'}
      width={880}
      footer={
        <>
          <Button variant="ghost" onClick={finish}>
            {step === 3 ? 'Finish' : 'Cancel'}
          </Button>
        </>
      }
    >
      <div className="wizard-tabs" role="tablist">
        {steps.map((id) => {
          const locked = id > 1 && !productId;
          const done = Boolean(productId) && id < step;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={step === id}
              className={cn('wizard-tab', step === id && 'active', locked && 'locked')}
              disabled={locked}
              onClick={() => setStep(id)}
              title={locked ? 'Save product information to unlock' : STEP_LABELS[id]}
            >
              <span className="wizard-step-num">{done ? <Check size={13} /> : id}</span>
              <span className="wizard-step-label">{STEP_LABELS[id]}</span>
            </button>
          );
        })}
      </div>

      {step === 1 && (
        <InfoStep
          key={product?.id ?? 'new'}
          product={product}
          productId={productId}
          onPersisted={(id) => {
            const isNew = !productId;
            setProductId(id);
            onSaved();
            if (isNew) setStep(2);
          }}
        />
      )}
      {step === 2 && productId && <AttributesStep productId={productId} onDone={() => setStep(3)} />}
      {step === 3 && productId && <ImagesStep productId={productId} />}
    </Modal>
  );
}
