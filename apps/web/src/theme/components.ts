import type { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 10, paddingInline: 16, minHeight: 42 } } },
  MuiCard: { styleOverrides: { root: { border: '1px solid #E7E9F0', borderRadius: 18, boxShadow: '0 8px 30px rgba(27, 35, 68, 0.05)' } } },
  MuiTextField: { defaultProps: { size: 'small', variant: 'outlined' } },
  MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: '#FFFFFF' } } },
  MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 700 } } },
  MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none', boxShadow: 'none' } } },
  MuiDrawer: { styleOverrides: { paper: { borderRight: '1px solid #E7E9F0' } } },
};
