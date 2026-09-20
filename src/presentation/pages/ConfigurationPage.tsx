import { useState } from 'react';
import { Building2, Save, Share2 } from 'lucide-react';
import type { SiteConfiguration, SocialLinks } from '../../domain/entities/configuration';
import { EMPTY_CONFIGURATION } from '../../domain/entities/configuration';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { useToast } from '../../application/toast/ToastProvider';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';

const SOCIAL_FIELDS: Array<{ key: keyof SocialLinks; label: string }> = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'pinterest', label: 'Pinterest' },
];

export function ConfigurationPage() {
  const toast = useToast();
  const { data, loading, reload } = useAsync(() => repositories.configuration.get(), []);
  const [form, setForm] = useState<SiteConfiguration | null>(null);
  const [saving, setSaving] = useState(false);

  const current = form ?? data ?? null;

  const set = <K extends keyof SiteConfiguration>(key: K, value: SiteConfiguration[K]) =>
    setForm((prev) => ({ ...(prev ?? data ?? EMPTY_CONFIGURATION), [key]: value }));

  const setSocial = (key: keyof SocialLinks, value: string) =>
    setForm((prev) => {
      const base = prev ?? data ?? EMPTY_CONFIGURATION;
      return { ...base, social: { ...base.social, [key]: value } };
    });

  const save = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await repositories.configuration.update(current);
      toast.success('Configuration saved');
      setForm(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Configuration"
        subtitle="Company profile shown across the storefront's contact sections."
      >
        <Button onClick={save} disabled={saving || !current}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </PageHeader>

      {loading && !data ? (
        <div className="stack">
          <Skeleton style={{ height: 280 }} />
          <Skeleton style={{ height: 220 }} />
        </div>
      ) : !current ? (
        <Card>
          <CardBody>
            <p className="step-note">Could not load the site configuration.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="stack">
          <Card>
            <CardHeader
              title="Company"
              subtitle="Intro and contact details"
              actions={<Building2 size={16} className="cell-sub" />}
            />
            <CardBody>
              <div className="form-grid">
                <div className="span-2">
                  <Field label="Company intro">
                    <textarea
                      className="input"
                      rows={4}
                      value={current.company_intro}
                      onChange={(e) => set('company_intro', e.target.value)}
                      placeholder="Who you are, what you make…"
                    />
                  </Field>
                </div>
                <Field label="Email">
                  <Input
                    type="email"
                    value={current.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="hello@nyanopan.shop"
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={current.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+977 …"
                  />
                </Field>
                <Field label="WhatsApp">
                  <Input
                    value={current.whatsapp}
                    onChange={(e) => set('whatsapp', e.target.value)}
                    placeholder="+977 … (checkout redirects here)"
                  />
                </Field>
                <Field label="Map URL">
                  <Input
                    type="url"
                    value={current.map_url}
                    onChange={(e) => set('map_url', e.target.value)}
                    placeholder="https://maps.app.goo.gl/…"
                  />
                </Field>
                <div className="span-2">
                  <Field label="Address">
                    <Input
                      value={current.address}
                      onChange={(e) => set('address', e.target.value)}
                      placeholder="Street, city, country"
                    />
                  </Field>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Social links"
              subtitle="Storefront footer & contact page"
              actions={<Share2 size={16} className="cell-sub" />}
            />
            <CardBody>
              <div className="form-grid">
                {SOCIAL_FIELDS.map(({ key, label }) => (
                  <Field key={key} label={label}>
                    <Input
                      type="url"
                      value={current.social[key]}
                      onChange={(e) => setSocial(key, e.target.value)}
                      placeholder={`https://${key === 'facebook' ? 'facebook.com' : key === 'instagram' ? 'instagram.com' : key === 'tiktok' ? 'tiktok.com' : 'pinterest.com'}/…`}
                    />
                  </Field>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
