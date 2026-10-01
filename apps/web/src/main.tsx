import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard, Placeholder } from './pages';
import { ProfilePage } from './pages/ProfilePage';
import { ResumePage } from './pages/ResumePage';
import { JobsPage } from './pages/JobsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationPackagePage } from './pages/ApplicationPackagePage';
import { InterviewPreparationPage } from './pages/InterviewPreparationPage';
import { CareerAssistantPage } from './pages/CareerAssistantPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
ReactDOM.createRoot(document.getElementById('root')!).render(<ErrorBoundary><React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><Routes><Route element={<Layout />}><Route path="/" element={<Dashboard />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/resume" element={<ResumePage />} /><Route path="/jobs" element={<JobsPage />} /><Route path="/applications" element={<ApplicationsPage />} /><Route path="/application-package" element={<ApplicationPackagePage />} /><Route path="/interview-preparation" element={<InterviewPreparationPage />} /><Route path="/career-assistant" element={<CareerAssistantPage />} /><Route path="/settings" element={<Placeholder name="Settings" />} /></Route></Routes></BrowserRouter></QueryClientProvider></React.StrictMode></ErrorBoundary>);
