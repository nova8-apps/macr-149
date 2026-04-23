export const colors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  protein: '#7FB77E',
  carbs: '#F2A65A',
  fat: '#5B8DEF',
  bg: '#FFFAF5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFF4EA',
  textPrimary: '#1E1612',
  textSecondary: '#7A6C65',
  border: '#F0E4D8',
  // Dark mode
  bgDark: '#1A1410',
  surfaceDark: '#261E18',
  surfaceElevatedDark: '#332920',
  textPrimaryDark: '#FFF5EE',
  textSecondaryDark: '#A89890',
  borderDark: '#3D3028',
} as const;

export const exerciseTypes = [
  { id: 'weight-lifting', name: 'Weight Lifting', icon: 'dumbbell', met: 6.0 },
  { id: 'running', name: 'Running', icon: 'footprints', met: 9.8 },
  { id: 'cycling', name: 'Cycling', icon: 'bike', met: 7.5 },
  { id: 'walking', name: 'Walking', icon: 'footprints', met: 3.8 },
  { id: 'swimming', name: 'Swimming', icon: 'waves', met: 8.0 },
  { id: 'yoga', name: 'Yoga', icon: 'flower2', met: 3.0 },
  { id: 'hiit', name: 'HIIT', icon: 'zap', met: 12.0 },
] as const;
