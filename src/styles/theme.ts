/**
 * Dark theme color palette with shades of black, charcoal gray, and muted blues
 */
export const darkTheme = {
  // Base Colors
  background: {
    primary: '#0F1117',   // Nearly black with a hint of blue
    surface: '#171923',   // Dark charcoal with blue undertones
    surfaceAlt: '#1E2130', // Slightly lighter charcoal
  },
  
  // Gray Shades
  gray: {
    900: '#242736',  // Darkest gray
    800: '#2D303E',  // Dark gray
    700: '#363A4F',  // Medium-dark gray
    600: '#4A4F64',  // Medium gray
    500: '#5F6479',  // Gray with blue undertones
    400: '#7C8199',  // Light gray
    300: '#9AA1B9',  // Lightest gray
  },
  
  // Muted Blues
  blue: {
    900: '#1A2036',  // Very dark blue
    800: '#1E2645',  // Dark blue
    700: '#243054',  // Navy blue
    600: '#2A3B6A',  // Medium-dark blue
    500: '#34487F',  // Medium blue
    400: '#3E5494',  // Medium-light blue
    300: '#4B66B0',  // Light blue
  },
  
  // Accent Colors
  accent: {
    blue: '#3E7BFA',   // Bright blue for highlights and primary actions
    teal: '#38B2AC',   // Teal for secondary elements
    purple: '#805AD5',  // Purple for tertiary elements
  },
  
  // Status Colors
  status: {
    success: '#38A169',  // Green
    warning: '#DD6B20',  // Orange
    error: '#E53E3E',    // Red
    info: '#3182CE',     // Blue
  },
  
  // Text Colors
  text: {
    primary: '#FFFFFF',    // White for primary text
    secondary: '#9AA1B9',  // Light gray for secondary text
    muted: '#5F6479',      // Muted text
    accent: '#3E7BFA',     // Accent text
  },
};

// Default theme is dark theme
export default darkTheme;
