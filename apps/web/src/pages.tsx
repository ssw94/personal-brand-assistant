import { useQuery } from '@tanstack/react-query';
import { getHealth } from './lib/api';
import { EmptyState } from './components/EmptyState';

const pageCopy = {
  Profile: ['Your professional profile', 'Keep your experience, skills, projects and goals in one place.', 'Add your first profile details'],
  Resume: ['Resume builder', 'Create tailored resume versions from the profile you control.', 'Create a resume'],
  Jobs: ['Job search', 'Collect and evaluate opportunities that match the direction you want to take.', 'Add a job'],
  Applications: ['Application tracker', 'See every application, next step and follow-up in one calm workspace.', 'Track an application'],
  Settings: ['Settings', 'Manage your preferences, data and integrations.', undefined],
} as const;

export function Dashboard() { const health = useQuery({ queryKey: ['health'], queryFn: getHealth, retry: false }); return <><PageHeading title="Good to have you here" description="Your professional operating system starts with a clear foundation."/><div className="grid gap-4 md:grid-cols-3"><Metric label="Profile completeness" value="—" detail="Add your profile to get started"/><Metric label="Active applications" value="—" detail="No applications tracked yet"/><Metric label="Upcoming follow-ups" value="—" detail="Nothing scheduled"/></div><div className="mt-8"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Workspace status</h2><span className={`text-xs font-semibold ${health.isError ? 'text-rose-600' : 'text-emerald-600'}`}>{health.isPending ? 'Checking API…' : health.isError ? 'API unavailable' : 'All systems operational'}</span></div><EmptyState title="Your workspace is ready when you are" description="No sample data has been added. Build an accurate professional profile first, then use it to create resumes and manage your search." action="Set up your profile"/></div></>; }
function Metric({label,value,detail}:{label:string;value:string;detail:string}) { return <div className="card p-5"><p className="muted">{label}</p><p className="mt-4 text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div>; }
export function Placeholder({ name }: { name: keyof typeof pageCopy }) { const [title, description, action] = pageCopy[name]; return <><PageHeading title={title} description={description}/><EmptyState title={`${name} is ready for your data`} description="This area is intentionally empty until you add your own information. We will never invent jobs, companies, qualifications or career history." action={action}/></>; }
function PageHeading({ title, description }: { title:string; description:string }) { return <div className="mb-8"><h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1><p className="muted mt-2 max-w-2xl">{description}</p></div>; }
