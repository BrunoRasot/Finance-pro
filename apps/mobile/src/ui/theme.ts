export const lightColors = {
  canvas: '#f4f7f5',
  surface: '#ffffff',
  surfaceMuted: '#edf3ef',
  ink: '#10231f',
  muted: '#65756f',
  line: '#d7e1dc',
  primary: '#176b55',
  primarySoft: '#dff4e8',
  lime: '#c8f28f',
  danger: '#b42318',
  dangerSoft: '#fff1f0',
  white: '#ffffff',
};
export type Palette = typeof lightColors;
export const darkColors: Palette = {
  canvas: '#0f1216',
  surface: '#191e24',
  surfaceMuted: '#242b34',
  ink: '#f2f5f3',
  muted: '#a9b4b0',
  line: '#37414b',
  primary: '#58b99a',
  primarySoft: '#203b34',
  lime: '#c8f28f',
  danger: '#ff8d84',
  dangerSoft: '#3b2527',
  white: '#ffffff',
};
export const colors = lightColors;
export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 };
