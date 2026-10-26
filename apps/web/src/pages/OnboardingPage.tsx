import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, Container, Stack, Typography } from '@mui/material';
import { FormField, TextAreaField } from '../components/FormField';
import { saveProfile } from '../lib/profileApi';
import { getSessionUser } from '../lib/session';
import { saveStrategy } from '../lib/contentApi';
import { completeOnboarding } from '../lib/authApi';
export function OnboardingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', professionalTitle: '', yearsOfExperience: '0', skills: '', audience: '', voice: '', frequency: 'Weekly' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError('');
    try {
      await saveProfile({ firstName: form.firstName, lastName: form.lastName, professionalTitle: form.professionalTitle, location: '', phone: '', website: '', summary: '', yearsOfExperience: Number(form.yearsOfExperience), targetRoles: [], preferredLocations: [], remotePreference: 'flexible' });
      await saveStrategy({ targetAudience: form.audience, writingVoice: form.voice, postingFrequency: form.frequency, recurringThemes: form.skills.split(',').map(value => value.trim()).filter(Boolean) });
      await completeOnboarding(); navigate('/dashboard', { replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save onboarding.'); } finally { setPending(false); }
  };
  if (!getSessionUser()) return null;
  return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 5, md: 10 } }}><Container maxWidth="md"><Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: '.18em' }}>Personal Brand Assistant</Typography><Typography variant="h1" sx={{ mt: 1 }}>Build your starting point</Typography><Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>A few accurate details are enough to begin. You can skip deeper profile work and complete it later.</Typography><Card component="form" onSubmit={submit} sx={{ mt: 4, p: { xs: 3, md: 4 } }}><Stack spacing={2.25}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><FormField label="First name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}/><FormField label="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}/></Stack><FormField label="Professional title" required placeholder="e.g. Senior software engineer" value={form.professionalTitle} onChange={e => setForm({ ...form, professionalTitle: e.target.value })}/><FormField label="Years of experience" type="number" value={form.yearsOfExperience} onChange={e => setForm({ ...form, yearsOfExperience: e.target.value })}/><TextAreaField label="Skills or content interests (comma separated)" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}/><TextAreaField label="Who do you want to reach?" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}/><TextAreaField label="How should your writing sound?" value={form.voice} onChange={e => setForm({ ...form, voice: e.target.value })}/>{error && <Alert severity="error" role="alert">{error}</Alert>}<Button type="submit" variant="contained" disabled={pending} sx={{ alignSelf: 'flex-start' }}>{pending ? 'Saving…' : 'Continue to dashboard'}</Button></Stack></Card></Container></Box>;
}
