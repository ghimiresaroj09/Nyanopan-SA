import { useEffect, useMemo, useState } from 'react';
import { Eye, FilterX, Package, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import type { Product, ProductFilters } from '../../domain/entities/product';
import { PRODUCT_GENDERS, SOLE_OPTIONS, USAGE_LOCATIONS } from '../../domain/entities/product';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { useDebounce } from '../../application/hooks/useDebounce';
import { useToast } from '../../application/toast/ToastProvider';
import { ApiError } from '../../data/api/client';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { DataTable, type Column } from '../components/table/DataTable';
import { ProductWizard } from './products/ProductWizard';
import { ProductViewModal } from './products/ProductViewModal';

function genderLabel(gender: Product['gender']): string {
  return PRODUCT_GENDERS.find((g) => g.value === gender)?.label ?? gender;
}

export function ProductsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState<ProductFilters>({});
  const filterKey = JSON.stringify(filters);
  const list = useAsync(() => repositories.products.list(filters), [filterKey]);
  const categories = useAsync(() => repositories.categories.list(), []);
  const items = list.data ?? [];
  const loading = list.loading;
  const reload = list.reload;

  const [saving, setSaving] = useState(false);
  const remove = async (id: string) => {
    setSaving(true);
    try {
      await repositories.products.remove(id);
      toast.success('Product deleted');
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete product');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Filter bar state (prices are debounced before hitting the backend) ---- */
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const debouncedPrices = useDebounce(`${minPrice}|${maxPrice}`, 400);
  useEffect(() => {
    const [mn, mx] = debouncedPrices.split('|');
    const toNumber = (raw: string) => {
      const n = Number(raw);
      return raw.trim() !== '' && !Number.isNaN(n) ? n : undefined;
    };
    setFilters((prev) => ({ ...prev, min_price: toNumber(mn), max_price: toNumber(mx) }));
  }, [debouncedPrices]);

  const patchFilters = (patch: Partial<ProductFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const activeFilterCount = [
    filters.category,
    filters.gender,
    filters.usage_location,
    filters.sole_type,
    filters.is_active,
    filters.is_featured,
    filters.min_price,
    filters.max_price,
  ].filter((v) => v !== undefined).length;

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setFilters({});
  };

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const columns = useMemo<Array<Column<Product>>>(
    () => [
      {
        key: 'name',
        header: 'Product',
        sortValue: (p) => p.name.toLowerCase(),
        render: (p) => <span className="cell-main">{p.name}</span>,
      },
      {
        key: 'image',
        header: 'Image',
        sortValue: (p) => (p.featureImageUrl ? 1 : 0),
        render: (p) => (
          <span className="row-thumb">
            {p.featureImageUrl ? (
              <img src={p.featureImageUrl} alt="" />
            ) : (
              <Package size={16} className="row-thumb-fallback" />
            )}
          </span>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        sortValue: (p) => p.category?.name ?? '',
        render: (p) => p.category?.name ?? '—',
      },
      {
        key: 'model',
        header: 'Model',
        sortValue: (p) => p.model?.name ?? '',
        render: (p) => p.model?.name ?? '—',
      },
      {
        key: 'gender',
        header: 'Gender',
        sortValue: (p) => p.gender,
        render: (p) => <Badge tone="neutral" dot={false}>{genderLabel(p.gender)}</Badge>,
      },
      {
        key: 'slug',
        header: 'Slug',
        sortValue: (p) => p.slug,
        render: (p) => <span className="cell-sub">{p.slug}</span>,
      },
      {
        key: 'featured',
        header: 'Featured',
        sortValue: (p) => (p.is_featured ? 1 : 0),
        render: (p) =>
          p.is_featured ? (
            <Badge tone="sage" dot={false}>
              <Star size={12} style={{ marginRight: 4 }} /> Featured
            </Badge>
          ) : (
            <span className="cell-sub">—</span>
          ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (p) => (
          <div className="row-actions">
            <button
              className="icon-btn"
              title="View product"
              onClick={(e) => {
                e.stopPropagation();
                setViewing(p);
              }}
            >
              <Eye size={15} />
            </button>
            <button
              className="icon-btn"
              title="Edit product (3-step flow)"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(p);
                setWizardOpen(true);
              }}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn danger"
              title="Delete product"
              onClick={(e) => {
                e.stopPropagation();
                setDeleting(p);
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${items.length} products${activeFilterCount ? ' (filtered)' : ''} · created through the 3-step flow (info → variants → images)`}
      >
        <Button
          onClick={() => {
            setEditing(null);
            setWizardOpen(true);
          }}
        >
          <Plus size={15} /> Add product
        </Button>
      </PageHeader>

      <Card>
        <CardBody>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <Field label="Category">
              <Select
                style={{ width: 160 }}
                value={filters.category ?? ''}
                onChange={(e) => patchFilters({ category: e.target.value || undefined })}
                options={[
                  { value: '', label: 'All categories' },
                  ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </Field>
            <Field label="Gender">
              <Select
                style={{ width: 130 }}
                value={filters.gender ?? ''}
                onChange={(e) =>
                  patchFilters({ gender: (e.target.value || undefined) as ProductFilters['gender'] })
                }
                options={[{ value: '', label: 'All genders' }, ...PRODUCT_GENDERS]}
              />
            </Field>
            <Field label="Usage">
              <Select
                style={{ width: 130 }}
                value={filters.usage_location ?? ''}
                onChange={(e) =>
                  patchFilters({
                    usage_location: (e.target.value || undefined) as ProductFilters['usage_location'],
                  })
                }
                options={[{ value: '', label: 'Any usage' }, ...USAGE_LOCATIONS]}
              />
            </Field>
            <Field label="Sole">
              <Select
                style={{ width: 130 }}
                value={filters.sole_type ?? ''}
                onChange={(e) =>
                  patchFilters({ sole_type: (e.target.value || undefined) as ProductFilters['sole_type'] })
                }
                options={[{ value: '', label: 'Any sole' }, ...SOLE_OPTIONS]}
              />
            </Field>
            <Field label="Status">
              <Select
                style={{ width: 120 }}
                value={filters.is_active === undefined ? '' : String(filters.is_active)}
                onChange={(e) =>
                  patchFilters({
                    is_active: e.target.value === '' ? undefined : e.target.value === 'true',
                  })
                }
                options={[
                  { value: '', label: 'Any status' },
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
              />
            </Field>
            <Field label="Featured">
              <Select
                style={{ width: 130 }}
                value={filters.is_featured === undefined ? '' : String(filters.is_featured)}
                onChange={(e) =>
                  patchFilters({
                    is_featured: e.target.value === '' ? undefined : e.target.value === 'true',
                  })
                }
                options={[
                  { value: '', label: 'All products' },
                  { value: 'true', label: 'Featured' },
                  { value: 'false', label: 'Standard' },
                ]}
              />
            </Field>
            <Field label="Min price">
              <Input
                style={{ width: 110 }}
                type="number"
                min={0}
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </Field>
            <Field label="Max price">
              <Input
                style={{ width: 110 }}
                type="number"
                min={0}
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </Field>
            <Button variant="ghost" size="sm" disabled={activeFilterCount === 0} onClick={clearFilters}>
              <FilterX size={15} /> Clear filters
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <DataTable
          data={items}
          columns={columns}
          getRowId={(p) => p.id}
          getSearchText={(p) =>
            `${p.name} ${p.category?.name ?? ''} ${p.model?.name ?? ''} ${genderLabel(p.gender)}`
          }
          searchPlaceholder="Search products…"
          loading={loading}
          pageSize={9}
          emptyTitle="No products yet"
          emptyDescription="Add your first product — it takes three quick steps."
        />
      </Card>

      <ProductViewModal open={Boolean(viewing)} product={viewing} onClose={() => setViewing(null)} />

      <ProductWizard
        open={wizardOpen}
        product={editing}
        onClose={() => setWizardOpen(false)}
        onSaved={() => void reload()}
      />

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        itemName={deleting?.name ?? ''}
        saving={saving}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove(deleting.id);
          setDeleting(null);
        }}
      />
    </>
  );
}
