import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard, Placeholder } from './pages';
import { ProfilePage } from './pages/ProfilePage';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><Routes><Route element={<Layout />}><Route path="/" element={<Dashboard />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/resume" element={<Placeholder name="Resume" />} /><Route path="/jobs" element={<Placeholder name="Jobs" />} /><Route path="/applications" element={<Placeholder name="Applications" />} /><Route path="/settings" element={<Placeholder name="Settings" />} /></Route></Routes></BrowserRouter></QueryClientProvider></React.StrictMode>);
