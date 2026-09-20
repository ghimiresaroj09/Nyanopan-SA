import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  FileText,
  Home,
  Layers,
  Leaf,
  Package,
  Settings2,
  Shapes,
  SlidersHorizontal,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { CmsStatusRow } from '../../domain/entities/analytics';
import { useAnalytics } from '../../application/hooks/useAnalytics';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { BarChart } from '../components/charts/BarChart';
import { DonutChart } from '../components/charts/DonutChart';

const STAT_ICONS: Record<string, LucideIcon> = {
  products: Package,
  categories: Tags,
  models: Shapes,
  attributes: SlidersHorizontal,
  makers: Users,
  collections: Layers,
  policies: FileText,
  story: BookOpen,
};

const CMS_ICONS: Record<CmsStatusRow['key'], LucideIcon> = {
  configuration: Settings2,
  policies: FileText,
  homepage: Home,
  collections: Layers,
  story: BookOpen,
  makers: Users,
  sustainability: Leaf,
};

function DashboardSkeleton() {
  return (
    <div className="stack">
      <div className="grid g-stats">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={{ height: 128 }} />
        ))}
      </div>
      <div className="grid g-half">
        <Skeleton style={{ height: 320 }} />
        <Skeleton style={{ height: 320 }} />
      </div>
      <Skeleton style={{ height: 280 }} />
    </div>
  );
}

export function DashboardPage() {
  const { snapshot, loading } = useAnalytics();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting} — catalog and storefront content at a glance.`}
      />

      {loading || !snapshot ? (
        <DashboardSkeleton />
      ) : (
        <div className="stack">
          <div className="grid g-stats">
            {snapshot.metrics.slice(0, 4).map((metric) => {
              const Icon = STAT_ICONS[metric.key] ?? Package;
              return (
                <StatCard
                  key={metric.key}
                  label={metric.label}
                  value={metric.value}
                  format={metric.format}
                  footnote={metric.footnote}
                  icon={<Icon size={18} />}
                />
              );
            })}
          </div>
          <div className="grid g-stats">
            {snapshot.metrics.slice(4).map((metric) => {
              const Icon = STAT_ICONS[metric.key] ?? Package;
              return (
                <StatCard
                  key={metric.key}
                  label={metric.label}
                  value={metric.value}
                  format={metric.format}
                  footnote={metric.footnote}
                  icon={<Icon size={18} />}
                />
              );
            })}
          </div>

          <div className="grid g-half">
            <Card>
              <CardHeader title="Products by category" subtitle="Live product counts" />
              <CardBody>
                {snapshot.productsByCategory.length === 0 ? (
                  <EmptyState title="No categories yet" description="Add categories to see the split." />
                ) : (
                  <DonutChart data={snapshot.productsByCategory} centerLabel="Products" />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Products by gender" subtitle="Who the catalog is for" />
              <CardBody>
                {snapshot.productsByGender.length === 0 ? (
                  <EmptyState title="No products yet" description="Add products to see the split." />
                ) : (
                  <BarChart data={snapshot.productsByGender} height={240} />
                )}
              </CardBody>
            </Card>
          </div>

          <div className="grid g-half">
            <Card>
              <CardHeader title="Values by attribute" subtitle="Option breadth per attribute" />
              <CardBody>
                {snapshot.valuesByAttribute.length === 0 ? (
                  <EmptyState title="No attributes yet" description="Add attributes to see the split." />
                ) : (
                  <BarChart data={snapshot.valuesByAttribute} height={240} />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Models"
                subtitle="Product models ordered by catalog size"
                actions={
                  <Link to="/models" className="btn btn-ghost btn-sm">
                    Manage models
                  </Link>
                }
              />
              <CardBody>
                {snapshot.models.length === 0 ? (
                  <EmptyState title="No models yet" description="Create models to group your products." />
                ) : (
                  <div className="top-list">
                    {snapshot.models.map((model, index) => (
                      <div key={model.id} className="top-item">
                        <span className="top-rank">{index + 1}</span>
                        <div className="top-info">
                          <div className="top-name">{model.name}</div>
                          <div className="top-cat">{model.slug}</div>
                        </div>
                        <div className="top-revenue">
                          {model.productCount} product{model.productCount === 1 ? '' : 's'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Storefront content"
              subtitle="What shoppers will see — tap through to edit"
            />
            <CardBody>
              {snapshot.cms.map((row) => {
                const Icon = CMS_ICONS[row.key];
                return (
                  <div key={row.key} className="content-row">
                    <span className="stat-icon" style={{ flex: 'none' }}>
                      <Icon size={16} />
                    </span>
                    <div className="cell-stack">
                      <span className="cell-main">{row.label}</span>
                      <span className="cell-sub">{row.detail}</span>
                    </div>
                    <Badge tone={row.configured ? 'success' : 'warning'}>
                      {row.configured ? 'Configured' : 'Needs content'}
                    </Badge>
                    <Link to={row.to} className="btn btn-ghost btn-sm">
                      Open <ArrowRight size={13} />
                    </Link>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
