import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { signout } from '../lib/authApi';
import { getSessionUser } from '../lib/session';

export function SettingsPage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const logout = async () => {
    setPending(true);
    setError('');
    try {
      await signout();
      navigate('/signin', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not sign out.');
    } finally {
      setPending(false);
    }
  };
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary">
          Workspace settings
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Account and security
        </Typography>
        <Typography color="text.secondary">
          Review the identity and provider boundaries for this workspace.
        </Typography>
      </Box>
      <Card>
        <CardContent>
          <Typography variant="h6">Account</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography>{user?.email ?? 'Authenticated account'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Plan
              </Typography>
              <Box>
                <Chip label={user?.plan ?? 'Server-managed'} size="small" />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Authentication
              </Typography>
              <Typography color="text.secondary">
                Session cookies are HttpOnly in production. Provider keys and database credentials
                remain server-side.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6">Sign out</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            End this browser session and clear local session state.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={() => void logout()}
            disabled={pending}
            sx={{ mt: 2 }}
          >
            {pending ? 'Signing out…' : 'Sign out'}
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
