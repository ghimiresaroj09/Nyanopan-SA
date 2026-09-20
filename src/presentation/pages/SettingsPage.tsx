import { useState } from 'react';
import { MessageCircle, Save } from 'lucide-react';
import { useLocalStorage } from '../../application/hooks/useLocalStorage';
import { useToast } from '../../application/toast/ToastProvider';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';

interface StoreSettings {
  storeName: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  whatsappNumber: string;
  checkoutNote: string;
  notifyLowStock: boolean;
  notifyDigest: boolean;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Nyanopan',
  supportEmail: 'support@nyanopan.shop',
  currency: 'NPR',
  timezone: 'Asia/Kathmandu',
  whatsappNumber: '+977 980-123-456',
  checkoutNote: 'Thank you for shopping with Nyanopan! We will confirm availability shortly.',
  notifyLowStock: true,
  notifyDigest: false,
};

function waLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function SettingsPage() {
  const [stored, setStored] = useLocalStorage<StoreSettings>(
    'nyanopan.settings',
    DEFAULT_SETTINGS,
  );
  const [draft, setDraft] = useState<StoreSettings>({ ...DEFAULT_SETTINGS, ...stored });
  const toast = useToast();

  const patch = (partial: Partial<StoreSettings>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  const save = () => {
    setStored(draft);
    toast.success('Settings saved');
  };

  const resetDemo = () => {
    window.localStorage.clear();
    toast.info('Reloading with fresh demo data…');
    window.setTimeout(() => window.location.reload(), 600);
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Store profile, WhatsApp checkout and workspace">
        <Button onClick={save}>
          <Save size={15} /> Save changes
        </Button>
      </PageHeader>

      <div className="stack">
        <Card>
          <CardHeader title="Store profile" subtitle="How your store appears to shoppers" />
          <CardBody>
            <div className="form-grid">
              <Field label="Store name">
                <Input
                  value={draft.storeName}
                  onChange={(e) => patch({ storeName: e.target.value })}
                />
              </Field>
              <Field label="Support email">
                <Input
                  type="email"
                  value={draft.supportEmail}
                  onChange={(e) => patch({ supportEmail: e.target.value })}
                />
              </Field>
              <Field label="Store currency">
                <Select
                  options={[
                    { value: 'NPR', label: 'NPR — Nepalese Rupee' },
                    { value: 'USD', label: 'USD — US Dollar' },
                    { value: 'INR', label: 'INR — Indian Rupee' },
                    { value: 'EUR', label: 'EUR — Euro' },
                  ]}
                  value={draft.currency}
                  onChange={(e) => patch({ currency: e.target.value })}
                />
              </Field>
              <Field label="Timezone">
                <Select
                  options={[
                    { value: 'Asia/Kathmandu', label: 'Asia/Kathmandu (UTC+5:45)' },
                    { value: 'UTC', label: 'UTC' },
                    { value: 'America/New_York', label: 'America/New_York' },
                    { value: 'Europe/London', label: 'Europe/London' },
                  ]}
                  value={draft.timezone}
                  onChange={(e) => patch({ timezone: e.target.value })}
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="WhatsApp checkout"
            subtitle="The storefront composes the order in the cart and redirects shoppers here — orders are never stored"
          />
          <CardBody>
            <div className="form-grid">
              <Field
                label="WhatsApp business number"
                hint="With country code — checkout opens a wa.me chat to this number."
              >
                <Input
                  value={draft.whatsappNumber}
                  onChange={(e) => patch({ whatsappNumber: e.target.value })}
                  placeholder="+977 980-000-000"
                />
              </Field>
              <div className="span-2">
                <Field
                  label="Checkout note"
                  hint="Appended to every order message the storefront sends."
                >
                  <Input
                    value={draft.checkoutNote}
                    onChange={(e) => patch({ checkoutNote: e.target.value })}
                    placeholder="e.g. Delivery inside the valley within 24 hours."
                  />
                </Field>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                onClick={() =>
                  window.open(
                    waLink(draft.whatsappNumber, `Nyanopan test order — ${draft.checkoutNote}`),
                    '_blank',
                    'noopener',
                  )
                }
              >
                <MessageCircle size={15} /> Open test chat
              </Button>
              <span className="field-hint" style={{ wordBreak: 'break-all' }}>
                {waLink(draft.whatsappNumber, '…')}
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notifications" subtitle="What the super-admin inbox receives" />
          <CardBody>
            <div className="settings-row">
              <div className="settings-row-meta">
                <h4>Low stock warnings</h4>
                <p>Alert when any product drops below 12 units.</p>
              </div>
              <Switch
                checked={draft.notifyLowStock}
                onChange={(next) => patch({ notifyLowStock: next })}
                label="Low stock warnings"
              />
            </div>
            <div className="settings-row">
              <div className="settings-row-meta">
                <h4>Weekly summary digest</h4>
                <p>A Monday-morning recap of catalog changes.</p>
              </div>
              <Switch
                checked={draft.notifyDigest}
                onChange={(next) => patch({ notifyDigest: next })}
                label="Weekly summary digest"
              />
            </div>
          </CardBody>
        </Card>

        <Card className="danger-zone">
          <CardHeader title="Danger zone" subtitle="Irreversible workspace actions" />
          <CardBody>
            <div className="settings-row">
              <div className="settings-row-meta">
                <h4>Reset demo data</h4>
                <p>Clears local changes and reloads the seeded dataset.</p>
              </div>
              <Button variant="danger" onClick={resetDemo}>
                Reset data
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
