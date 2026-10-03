import { Box, Button, Card, Stack, Typography } from '@mui/material';
import { Sparkles } from 'lucide-react';
type EmptyStateProps = { title: string; description: string; action?: string | undefined };
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <Card sx={{ p: { xs: 4, md: 7 }, textAlign: 'center', minHeight: 260, display: 'grid', placeItems: 'center' }}><Stack sx={{ alignItems: 'center', maxWidth: 520 }} spacing={1.5}><Box sx={{ bgcolor: 'primary.light', color: 'primary.dark', p: 1.25, borderRadius: '50%', display: 'flex' }}><Sparkles size={20} /></Box><Typography variant="h3">{title}</Typography><Typography color="text.secondary">{description}</Typography>{action && <Button variant="contained" sx={{ mt: 1 }}>{action}</Button>}</Stack></Card>;
}
