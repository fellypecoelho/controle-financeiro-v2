import { createTheme } from '@mui/material/styles';

// Tema inspirado nos aplicativos Google
const theme = createTheme({
  palette: {
    primary: {
      main: '#4285F4', // Azul Google
      light: '#80b1ff',
      dark: '#0057c1',
      contrastText: '#fff',
    },
    secondary: {
      main: '#DB4437', // Vermelho Google
      light: '#ff7961',
      dark: '#a30000',
      contrastText: '#fff',
    },
    success: {
      main: '#0F9D58', // Verde Google
      light: '#4caf50',
      dark: '#087f4b',
    },
    warning: {
      main: '#F4B400', // Amarelo Google
      light: '#ffcd33',
      dark: '#c79100',
    },
    error: {
      main: '#DB4437', // Vermelho Google
      light: '#ff7961',
      dark: '#a30000',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Google Sans',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 400,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 400,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 400,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: '8px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#3367d6',
          },
        },
        outlinedPrimary: {
          borderColor: '#4285F4',
          '&:hover': {
            backgroundColor: 'rgba(66, 133, 244, 0.04)',
          },
        },
        textPrimary: {
          '&:hover': {
            backgroundColor: 'rgba(66, 133, 244, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
        },
      },
    },
  },
});

export default theme;
