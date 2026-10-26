import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Card, Stack, Typography } from '@mui/material';

type Props = { children: ReactNode };
type State = { hasError: boolean };
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Unexpected frontend error', { name: error.name, message: error.message, componentStack: info.componentStack }); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', p: 3 }}>
        <Card sx={{ maxWidth: 440, p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h2">Something went wrong</Typography>
            <Typography color="text.secondary">This page could not be displayed. Your saved data was not changed.</Typography>
            <Button variant="contained" sx={{ mt: 1 }} onClick={() => window.location.reload()}>Reload workspace</Button>
          </Stack>
        </Card>
      </Box>
    );
  }
}
