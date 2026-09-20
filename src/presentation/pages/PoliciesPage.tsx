import { useMemo, useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import type { PolicyType } from '../../domain/entities/policy';
import { POLICY_TABS } from '../../domain/entities/policy';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { useToast } from '../../application/toast/ToastProvider';
import { sanitizeHtml } from '../../shared/sanitize';
import { formatDate } from '../../shared/format';
import { cn } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Skeleton } from '../components/ui/Skeleton';
import { RichTextEditor } from '../components/ui/RichTextEditor';

interface Draft {
  title: string;
  content: string;
  active: boolean;
}

export function PoliciesPage() {
  const toast = useToast();
  const { data: policies, loading, reload } = useAsync(() => repositories.policies.list(), []);
  const [tab, setTab] = useState<PolicyType>(POLICY_TABS[0].type);
  const [drafts, setDrafts] = useState<Partial<Record<PolicyType, Draft>>>({});
  const [saving, setSaving] = useState(false);

  const existing = useMemo(
    () => (policies ?? []).find((policy) => policy.type === tab) ?? null,
    [policies, tab],
  );

  const defaultTitle = POLICY_TABS.find((entry) => entry.type === tab)?.label ?? '';

  const draft: Draft =
    drafts[tab] ??
    (existing
      ? { title: existing.title, content: existing.content, active: existing.is_active }
      : { title: defaultTitle, content: '', active: true });

  const setDraft = (patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [tab]: { ...draft, ...patch } }));

  const dirty =
    !existing ||
    draft.title !== existing.title ||
    draft.content !== existing.content ||
    draft.active !== existing.is_active;

  const save = async () => {
    if (!draft.title.trim()) {
      toast.error('Policy title is required');
      return;
    }
    if (!sanitizeHtml(draft.content).trim() && !draft.content.trim()) {
      toast.error('Policy content is required');
      return;
    }
    setSaving(true);
    try {
      const sanitized = sanitizeHtml(draft.content);
      if (existing) {
        await repositories.policies.update(existing.id, {
          title: draft.title.trim(),
          content: sanitized,
          is_active: draft.active,
        });
      } else {
        await repositories.policies.create({
          type: tab,
          title: draft.title.trim(),
          content: sanitized,
          is_active: draft.active,
        });
      }
      toast.success(`${defaultTitle} saved`);
      setDrafts((prev) => ({ ...prev, [tab]: undefined }));
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save policy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Policies"
        subtitle="Storefront policy pages — content is sanitized before it reaches the backend."
      >
        <Button onClick={save} disabled={saving || !dirty}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save policy'}
        </Button>
      </PageHeader>

      <div className="wizard-tabs" role="tablist" style={{ maxWidth: 720 }}>
        {POLICY_TABS.map((entry) => (
          <button
            key={entry.type}
            type="button"
            role="tab"
            aria-selected={tab === entry.type}
            className={cn('wizard-tab', tab === entry.type && 'active')}
            onClick={() => setTab(entry.type)}
          >
            <span className="wizard-step-label">{entry.label}</span>
          </button>
        ))}
      </div>

      {loading && !policies ? (
        <Skeleton style={{ height: 420 }} />
      ) : (
        <Card>
          <CardBody>
            <div className="stack">
              <div className="policy-meta">
                <div className="switch-row">
                  <Switch
                    checked={draft.active}
                    onChange={(next) => setDraft({ active: next })}
                    label="Active on storefront"
                  />
                  <span className="cell-sub">
                    {draft.active ? 'Visible on the storefront' : 'Hidden from the storefront'}
                  </span>
                </div>
                {existing?.updated_at && (
                  <span className="cell-sub">Last updated {formatDate(existing.updated_at)}</span>
                )}
              </div>

              <Field label="Title">
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ title: e.target.value })}
                  placeholder={defaultTitle}
                />
              </Field>

              <Field label="Content">
                <RichTextEditor
                  key={tab}
                  value={draft.content}
                  onChange={(html) => setDraft({ content: html })}
                />
              </Field>

              <p className="step-note">
                <ShieldCheck size={14} style={{ verticalAlign: -2 }} /> Only safe formatting
                (headings, lists, links, emphasis) is kept — scripts, styles and inline handlers
                are stripped on save.
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
