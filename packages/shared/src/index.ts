import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const navigationItems = [
  { label: 'Dashboard', path: '/', icon: 'layout-dashboard' },
  { label: 'Profile', path: '/profile', icon: 'user-round' },
  { label: 'Resume', path: '/resume', icon: 'file-text' },
  { label: 'Jobs', path: '/jobs', icon: 'briefcase-business' },
  { label: 'Applications', path: '/applications', icon: 'kanban' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
] as const;

export type NavigationItem = (typeof navigationItems)[number];
