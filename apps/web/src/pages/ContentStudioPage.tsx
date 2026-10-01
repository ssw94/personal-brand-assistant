import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Lightbulb,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { FormField, SelectField, TextAreaField } from '../components/FormField';
import {
  createIdea,
  critiqueDraft,
  generateDraft,
  getStrategy,
  listDrafts,
  listIdeas,
  listPillars,
  publishDraft,
  saveStrategy,
  scheduleDraft,
  transformDraft,
  updateDraft,
  type Draft,
} from '../lib/contentApi';

type Mode = 'studio' | 'ideas' | 'calendar' | 'drafts' | 'scheduled' | 'published' | 'strategy';
const modes: Record<string, Mode> = {
  '/content': 'studio',
  '/content/ideas': 'ideas',
  '/content/calendar': 'calendar',
  '/content/drafts': 'drafts',
  '/content/scheduled': 'scheduled',
  '/content/published': 'published',
  '/content/strategy': 'strategy',
};
const emptyStrategy = {
  targetAudience: '',
  writingVoice: '',
  postingFrequency: '',
  recurringThemes: [] as string[],
};
export function ContentStudioPage() {
  const mode = modes[useLocation().pathname] ?? 'studio';
  const client = useQueryClient();
  const drafts = useQuery({ queryKey: ['content-drafts'], queryFn: listDrafts, retry: false });
  const ideas = useQuery({ queryKey: ['content-ideas'], queryFn: listIdeas, retry: false });
  const pillars = useQuery({ queryKey: ['content-pillars'], queryFn: listPillars, retry: false });
  const strategy = useQuery({ queryKey: ['content-strategy'], queryFn: getStrategy, retry: false });
  const [selected, setSelected] = useState<Draft>();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['content-drafts'] });
    void client.invalidateQueries({ queryKey: ['content-ideas'] });
  };
  if (!import.meta.env.VITE_USER_ID && !localStorage.getItem('pba.auth.token'))
    return (
      <EmptyState
        title="Sign in to use Content Studio"
        description="Create and review content from your authenticated workspace."
      />
    );
  if (drafts.isPending || ideas.isPending || pillars.isPending || strategy.isPending)
    return (
      <div aria-label="Loading content studio" className="card h-96 animate-pulse bg-slate-100" />
    );
  if (drafts.isError || ideas.isError || pillars.isError || strategy.isError)
    return (
      <EmptyState
        title="Content Studio could not be loaded"
        description={
          (drafts.error ?? ideas.error ?? pillars.error ?? strategy.error)?.message ??
          'Try again later.'
        }
      />
    );
  const filtered =
    mode === 'scheduled'
      ? drafts.data.drafts.filter((d) => d.status === 'SCHEDULED')
      : mode === 'published'
        ? drafts.data.drafts.filter(
            (d) => d.status === 'PUBLISHED' || d.status === 'PUBLISH_FAILED',
          )
        : mode === 'drafts'
          ? drafts.data.drafts.filter(
              (d) => d.status === 'DRAFT' || d.status === 'REVIEW' || d.status === 'APPROVED',
            )
          : drafts.data.drafts;
  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Personal Brand</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
            {mode === 'studio' ? 'Content Studio' : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </h1>
          <p className="muted mt-2 max-w-2xl">
            Create useful, truthful LinkedIn content from your professional experience. AI output
            stays editable and requires your approval.
          </p>
        </div>
        <CreatePost
          pillars={pillars.data.pillars}
          onCreated={(id) => {
            refresh();
            const draft = drafts.data.drafts.find((item) => item.id === id);
            if (draft) setSelected(draft);
          }}
        />
      </header>
      {mode === 'strategy' ? (
        <Strategy
          initial={strategy.data.strategy ?? emptyStrategy}
          onSaved={() => void client.invalidateQueries({ queryKey: ['content-strategy'] })}
        />
      ) : mode === 'ideas' ? (
        <Ideas ideas={ideas.data.ideas} onCreated={refresh} />
      ) : mode === 'calendar' ? (
        <Calendar drafts={drafts.data.drafts} onOpen={setSelected} />
      ) : (
        <DraftList drafts={filtered} onOpen={setSelected} />
      )}{' '}
      {selected && (
        <DraftEditor
          draft={selected}
          close={() => setSelected(undefined)}
          onChanged={(draft) => {
            setSelected(draft);
            refresh();
          }}
        />
      )}
    </div>
  );
}
function CreatePost({
  pillars,
  onCreated,
}: {
  pillars: Array<{ id: string; name: string }>;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    topic: '',
    title: 'LinkedIn draft',
    pillarId: '',
    audience: '',
    style: '',
    context: '',
  });
  const mutation = useMutation({
    mutationFn: () =>
      generateDraft({
        title: form.title,
        topic: `${form.topic}${form.audience ? ` Audience: ${form.audience}.` : ''}${form.style ? ` Style: ${form.style}.` : ''}${form.context ? ` Context: ${form.context}.` : ''}`,
        sourceIdeaId: null,
      }),
    onSuccess: (result) => {
      setOpen(false);
      setForm({ ...form, topic: '' });
      onCreated(result.id);
    },
  });
  return (
    <>
      {
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={17} /> Create LinkedIn Post
        </button>
      }
      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/30 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold">Create LinkedIn Post</h2>
            <p className="muted mt-1">
              Give the provider enough context to draft a useful starting point.
            </p>
            <div className="mt-5 space-y-4">
              <FormField
                label="Topic"
                required
                minLength={10}
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
              <SelectField
                label="Content pillar"
                value={form.pillarId}
                onChange={(e) => setForm({ ...form, pillarId: e.target.value })}
              >
                <option value="">Choose a pillar</option>
                {pillars.map((pillar) => (
                  <option key={pillar.id} value={pillar.id}>
                    {pillar.name}
                  </option>
                ))}
              </SelectField>
              <FormField
                label="Target audience"
                placeholder="e.g. frontend engineering leads"
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
              />
              <FormField
                label="Writing style"
                placeholder="practical and concise"
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
              />
              <TextAreaField
                label="Additional context (optional)"
                value={form.context}
                onChange={(e) => setForm({ ...form, context: e.target.value })}
              />
            </div>
            {mutation.isError && (
              <p role="alert" className="mt-3 text-sm text-rose-600">
                {mutation.error.message}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={mutation.isPending || form.topic.trim().length < 10}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Sparkles size={16} />
                {mutation.isPending ? 'Generating…' : 'Generate Post'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
function DraftList({ drafts, onOpen }: { drafts: Draft[]; onOpen: (draft: Draft) => void }) {
  if (!drafts.length)
    return (
      <EmptyState
        title="No posts in this view"
        description="Create a LinkedIn post to start your review workflow."
      />
    );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {drafts.map((draft) => (
        <button
          type="button"
          key={draft.id}
          onClick={() => onOpen(draft)}
          className="card p-5 text-left hover:border-indigo-300"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{draft.title}</span>
            <Status status={draft.status} />
          </div>
          <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{draft.body}</p>
          <p className="mt-4 text-xs text-slate-400">
            Updated {new Date(draft.updatedAt).toLocaleDateString()}
          </p>
        </button>
      ))}
    </div>
  );
}
function Calendar({ drafts, onOpen }: { drafts: Draft[]; onOpen: (draft: Draft) => void }) {
  const items = drafts.filter(
    (draft) =>
      draft.scheduledAt || draft.status === 'PUBLISHED' || draft.status === 'PUBLISH_FAILED',
  );
  return (
    <section className="card p-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="text-indigo-600" size={20} />
        <h2 className="font-semibold">Content calendar</h2>
      </div>
      {!items.length ? (
        <EmptyState
          title="Your calendar is clear"
          description="Approve a draft, then schedule it from the editor."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((draft) => (
            <button
              type="button"
              key={draft.id}
              onClick={() => onOpen(draft)}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-300"
            >
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
                <CalendarDays size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{draft.title}</p>
                <p className="muted mt-1">
                  {draft.scheduledAt
                    ? new Date(draft.scheduledAt).toLocaleString()
                    : draft.publishedAt
                      ? `Published ${new Date(draft.publishedAt).toLocaleString()}`
                      : 'Publishing failed'}
                </p>
              </div>
              <Status status={draft.status} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
function Strategy({ initial, onSaved }: { initial: typeof emptyStrategy; onSaved: () => void }) {
  const [form, setForm] = useState(initial);
  const mutation = useMutation({ mutationFn: () => saveStrategy(form), onSuccess: onSaved });
  return (
    <section className="card max-w-2xl p-5">
      <h2 className="font-semibold">Content strategy</h2>
      <p className="muted mt-1">
        Guardrails for future generation. Nothing here is a claim about your background.
      </p>
      <div className="mt-5 space-y-4">
        <TextAreaField
          label="Target audience"
          value={form.targetAudience}
          onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
        />
        <TextAreaField
          label="Writing style"
          value={form.writingVoice}
          onChange={(e) => setForm({ ...form, writingVoice: e.target.value })}
        />
        <FormField
          label="Posting frequency"
          value={form.postingFrequency}
          onChange={(e) => setForm({ ...form, postingFrequency: e.target.value })}
        />
        <FormField
          label="Recurring themes (comma separated)"
          value={form.recurringThemes.join(', ')}
          onChange={(e) =>
            setForm({
              ...form,
              recurringThemes: e.target.value
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean),
            })
          }
        />
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          {mutation.isPending ? 'Saving…' : 'Save strategy'}
        </button>
        {mutation.isError && <p className="text-sm text-rose-600">{mutation.error.message}</p>}
      </div>
    </section>
  );
}
function Ideas({
  ideas,
  onCreated,
}: {
  ideas: Array<{ id: string; title: string; prompt: string; status: string }>;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const mutation = useMutation({
    mutationFn: () => createIdea({ title, prompt }),
    onSuccess: () => {
      setTitle('');
      setPrompt('');
      onCreated();
    },
  });
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <div className="card p-5">
        <h2 className="font-semibold">Idea backlog</h2>
        {ideas.length ? (
          <div className="mt-4 space-y-3">
            {ideas.map((idea) => (
              <div key={idea.id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-medium">{idea.title}</p>
                  <span className="text-xs text-slate-500">{idea.status}</span>
                </div>
                <p className="muted mt-2">{idea.prompt}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No ideas yet" description="Capture an angle before you draft." />
        )}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
        className="card p-5"
      >
        <h2 className="font-semibold">Add an idea</h2>
        <div className="mt-4 space-y-4">
          <FormField
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextAreaField
            label="Prompt or angle"
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            disabled={mutation.isPending || !title.trim() || prompt.trim().length < 10}
            className="rounded-lg border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700"
          >
            Add idea
          </button>
        </div>
      </form>
    </section>
  );
}
function DraftEditor({
  draft,
  close,
  onChanged,
}: {
  draft: Draft;
  close: () => void;
  onChanged: (draft: Draft) => void;
}) {
  const [body, setBody] = useState(draft.body);
  const [scheduledAt, setScheduledAt] = useState('');
  const [critique, setCritique] = useState(draft.critiques[0]);
  const save = useMutation({
    mutationFn: () => updateDraft(draft.id, { body }),
    onSuccess: (result) => onChanged(result.draft),
  });
  const critiqueMutation = useMutation({
    mutationFn: () => critiqueDraft(draft.id),
    onSuccess: (result) => setCritique(result.critique),
  });
  const transform = useMutation({
    mutationFn: (action: string) => transformDraft(draft.id, action),
    onSuccess: (result) => {
      setBody(result.draft.body);
      onChanged(result.draft);
    },
  });
  const schedule = useMutation({
    mutationFn: () => scheduleDraft(draft.id, new Date(scheduledAt).toISOString()),
    onSuccess: (result) => onChanged(result.draft),
  });
  const publish = useMutation({
    mutationFn: () => publishDraft(draft.id),
    onSuccess: (result) => onChanged(result.draft),
  });
  const transition = (status: string) =>
    updateDraft(draft.id, { status })
      .then((result) => onChanged(result.draft))
      .catch(() => undefined);
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{draft.title}</h2>
            <p className="muted mt-1">{draft.topic}</p>
            <div className="mt-3">
              <Status status={draft.status} />
            </div>
          </div>
          <button type="button" onClick={close} className="text-sm font-semibold text-slate-500">
            Close
          </button>
        </div>
        <div className="mt-5">
          <TextAreaField label="Post body" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
          >
            {save.isPending ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={() => critiqueMutation.mutate()}
            disabled={critiqueMutation.isPending}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            {critiqueMutation.isPending ? 'Critiquing…' : 'Critique'}
          </button>
          <button
            type="button"
            onClick={() => transform.mutate('improve_hook')}
            disabled={transform.isPending}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Improve Post
          </button>
          <button
            type="button"
            onClick={() => transform.mutate('regenerate')}
            disabled={transform.isPending}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Regenerate
          </button>
          <button
            type="button"
            disabled={draft.status !== 'DRAFT'}
            onClick={() => transition('REVIEW')}
            className="rounded-lg border border-amber-200 px-3 py-2 text-sm text-amber-700"
          >
            Submit for review
          </button>
          <button
            type="button"
            disabled={draft.status !== 'REVIEW'}
            onClick={() => transition('APPROVED')}
            className="rounded-lg border border-emerald-200 px-3 py-2 text-sm text-emerald-700"
          >
            Approve for Publishing
          </button>
        </div>
        {critique && (
          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm">
            <p className="font-semibold">
              AI critique <span className="font-normal text-amber-700">(critique-only)</span>
            </p>
            <p className="mt-2">{critique.summary}</p>
            <p className="mt-3 font-medium">Suggested improvements</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {critique.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}{' '}
        {draft.status === 'APPROVED' && (
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="font-semibold">Approved publishing actions</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-sm font-medium">
                Schedule
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                disabled={!scheduledAt || schedule.isPending}
                onClick={() => schedule.mutate()}
                className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700"
              >
                {schedule.isPending ? 'Scheduling…' : 'Schedule'}
              </button>
              <button
                type="button"
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
              >
                <Send size={15} />
                {publish.isPending ? 'Publishing…' : 'Publish Now'}
              </button>
            </div>
            <p className="mt-3 text-xs text-indigo-700">
              Development mode uses the safe mock provider and never contacts LinkedIn.
            </p>
          </div>
        )}{' '}
        {(save.isError ||
          critiqueMutation.isError ||
          transform.isError ||
          schedule.isError ||
          publish.isError) && (
          <p role="alert" className="mt-3 text-sm text-rose-600">
            {
              (
                save.error ??
                critiqueMutation.error ??
                transform.error ??
                schedule.error ??
                publish.error
              )?.message
            }
          </p>
        )}
        {draft.status === 'PUBLISH_FAILED' && (
          <p className="mt-3 flex items-center gap-2 text-sm text-rose-600">
            <CircleAlert size={16} />
            {draft.failureReason ?? 'Publishing failed.'}
          </p>
        )}
      </div>
    </div>
  );
}
function Status({ status }: { status: string }) {
  const icon =
    status === 'PUBLISHED' ? (
      <CheckCircle2 size={14} />
    ) : status === 'SCHEDULED' ? (
      <Clock3 size={14} />
    ) : status === 'PUBLISH_FAILED' ? (
      <CircleAlert size={14} />
    ) : (
      <Lightbulb size={14} />
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {icon}
      {status}
    </span>
  );
}
