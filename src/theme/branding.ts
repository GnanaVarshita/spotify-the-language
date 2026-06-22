import { createTheme } from '@mui/material/styles';

/**
 * Custom MUI Theme configuration representing a sleek, modern VS Code-style dark brand theme.
 * Uses a deep zinc/charcoal background and vibrant sky blue accents.
 */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#09090b', // Deep zinc black (VS Code editor black)
      paper: '#18181b',   // Zinc 900 surface
    },
    primary: {
      main: '#38bdf8',      // Vibrant sky blue
      light: '#7dd3fc',
      dark: '#0284c7',
      contrastText: '#09090b',
    },
    secondary: {
      main: '#a78bfa',      // Soft purple accent
      light: '#c084fc',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    text: {
      primary: '#f4f4f5',   // Zinc 100
      secondary: '#a1a1aa', // Zinc 400
    },
    success: {
      main: '#10b981', // Emerald green
    },
    info: {
      main: '#0ea5e9', // Deep sky blue
    },
    warning: {
      main: '#f59e0b',
    },
  },
  typography: {
    fontFamily: [
      'Outfit',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#09090b',
          color: '#f4f4f5',
          scrollbarColor: '#27272a #09090b',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#09090b',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#27272a',
            borderRadius: '4px',
            border: '2px solid #09090b',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#3f3f46',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#18181b',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            backgroundColor: '#0284c7',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#0369a1',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
            },
          },
        },
        {
          props: { variant: 'outlined', color: 'primary' },
          style: {
            borderColor: 'rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            '&:hover': {
              borderColor: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.06)',
            },
          },
        },
        {
          props: { variant: 'text', color: 'primary' },
          style: {
            color: '#38bdf8',
            '&:hover': {
              backgroundColor: 'rgba(56, 189, 248, 0.06)',
            },
          },
        },
      ],
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#09090b',
            transition: 'all 0.25s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(56, 189, 248, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#38bdf8',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#18181b',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          '&:hover': {
            borderColor: 'rgba(56, 189, 248, 0.3)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#38bdf8',
          height: 6,
        },
        thumb: {
          height: 14,
          width: 14,
          backgroundColor: '#fff',
          '&:focus, &:hover, &.Mui-active': {
            boxShadow: '0 0 0 8px rgba(56, 189, 248, 0.16)',
          },
        },
        rail: {
          opacity: 0.2,
          backgroundColor: '#a1a1aa',
        },
      },
    },
  },
});
