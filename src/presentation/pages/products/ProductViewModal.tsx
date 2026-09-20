import { Star } from 'lucide-react';
import type { Product } from '../../../domain/entities/product';
import { PRODUCT_GENDERS, SOLE_OPTIONS, USAGE_LOCATIONS } from '../../../domain/entities/product';
import { repositories } from '../../../data/repositories';
import { useAsync } from '../../../application/hooks/useAsync';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export function ProductViewModal({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}) {
  const detail = useAsync(
    () => (open && product ? repositories.products.getProductDetail(product.id) : Promise.resolve(null)),
    [open, product],
  );

  const data = detail.data;

  const genderLabel =
    PRODUCT_GENDERS.find((g) => g.value === product?.gender)?.label ?? product?.gender ?? '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? `Product — ${product.name}` : 'Product'}
      width={780}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {detail.loading && !data ? (
        <Skeleton style={{ height: 320 }} />
      ) : !data ? (
        <EmptyState
          title="No detail available"
          description="This product has not been published to the storefront yet."
        />
      ) : (
        <div className="stack">
          <div className="view-grid">
            <div>
              <div className="view-label">Category</div>
              <div className="view-value">{data.category?.name ?? '—'}</div>
            </div>
            <div>
              <div className="view-label">Model</div>
              <div className="view-value">{data.model?.name ?? '—'}</div>
            </div>
            <div>
              <div className="view-label">Gender</div>
              <div className="view-value">{genderLabel}</div>
            </div>
            <div>
              <div className="view-label">Usage</div>
              <div className="view-value">
                {USAGE_LOCATIONS.find((u) => u.value === data.usage_location)?.label ?? '—'}
              </div>
            </div>
            <div>
              <div className="view-label">Sole</div>
              <div className="view-value">
                {SOLE_OPTIONS.find((s) => s.value === data.sole)?.label ?? '—'}
              </div>
            </div>
            <div>
              <div className="view-label">Slug</div>
              <div className="view-value">
                <span className="slug-chip">{data.slug}</span>
              </div>
            </div>
            <div>
              <div className="view-label">Featured</div>
              <div className="view-value">
                {data.name && product?.is_featured ? (
                  <Badge tone="sage" dot={false}>
                    <Star size={12} style={{ marginRight: 4 }} /> Featured
                  </Badge>
                ) : (
                  '—'
                )}
              </div>
            </div>
          </div>

          {data.featureImageUrl && (
            <div className="view-section">
              <h4>Feature image</h4>
              <span className="img-thumb img-thumb-lg">
                <img src={data.featureImageUrl} alt={data.name} />
              </span>
            </div>
          )}

          {data.description && (
            <div className="view-section">
              <h4>Description</h4>
              <p>{data.description}</p>
            </div>
          )}
          {(data.general_information || data.materials_used) && (
            <div className="view-section">
              <h4>Details</h4>
              {data.general_information && <p>{data.general_information}</p>}
              {data.materials_used && (
                <p>
                  <strong>Materials:</strong> {data.materials_used}
                </p>
              )}
            </div>
          )}

          {data.key_features.length > 0 && (
            <div className="view-section">
              <h4>Key features</h4>
              <div className="feature-list">
                {data.key_features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span className="feature-title">{feature.title}</span>
                    <span className="feature-value">{feature.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.attributes.length > 0 && (
            <div className="view-section">
              <h4>Attributes & values</h4>
              {data.attributes.map((attr) => (
                <div key={attr.id || attr.attribute} className="palette-card view-palette">
                  <div className="palette-head">
                    <span className="cell-main">{attr.attribute}</span>
                  </div>
                  <div className="chip-row">
                    {attr.values.map((value) => (
                      <span key={value.id} className="pick-chip active">
                        {value.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.variants.length > 0 && (
            <div className="view-section">
              <h4>Variants</h4>
              <div className="variant-table-wrap">
                <table className="variant-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Variant</th>
                      <th style={{ width: 110 }}>Price</th>
                      <th style={{ width: 90 }}>Special</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.variants.map((variant) => (
                      <tr key={variant.id}>
                        <td className="cell-sub">{variant.sku || '—'}</td>
                        <td>
                          {variant.name || variant.options.map((opt) => opt.value).join(' · ')}
                        </td>
                        <td>{variant.price}</td>
                        <td className="cell-center">
                          {variant.is_special_edition ? <Badge tone="warning" dot={false}>Special</Badge> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.attributes.some((attr) =>
            attr.values.some((value) => value.featureImageUrl || value.gallery.length > 0),
          ) && (
            <div className="view-section">
              <h4>Images</h4>
              {data.attributes.map((attr) =>
                attr.values
                  .filter((value) => value.featureImageUrl || value.gallery.length > 0)
                  .map((value) => (
                    <div key={value.id} className="img-card" style={{ marginBottom: 8 }}>
                      <div className="img-card-head">
                        <span className="cell-main">{value.name}</span>
                        <span className="cell-sub">{attr.attribute}</span>
                      </div>
                      <div className="img-thumbs">
                        {value.featureImageUrl && (
                          <span className="img-thumb" title="Featured image">
                            <Star size={12} className="img-thumb-star" />
                            <img src={value.featureImageUrl} alt={value.name} />
                          </span>
                        )}
                        {value.gallery.map((image) => (
                          <span key={image.id} className="img-thumb">
                            {image.url ? <img src={image.url} alt={`${value.name} gallery`} /> : null}
                          </span>
                        ))}
                      </div>
                    </div>
                  )),
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
