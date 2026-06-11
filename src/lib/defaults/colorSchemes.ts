export type ColorScheme = {
  name: string
  light: string
  mid: string
  dark: string
  accent: string
  white: string
  black: string
}

export const defaultColorSchemes: ColorScheme[] = [
  {
    name: 'Stadtpark',
    light:  '#e8f5ee',
    mid:    '#4a9e6b',
    dark:   '#1e5c38',
    accent: '#f5a623',
    white:  '#fafffe',
    black:  '#0f2018',
  },
  {
    name: 'Sandstein',
    light:  '#faf0e4',
    mid:    '#c9955c',
    dark:   '#7a4e28',
    accent: '#6b9e4a',
    white:  '#fffdf9',
    black:  '#2e1a08',
  },
  {
    name: 'Nachtblau',
    light:  '#e8f0f8',
    mid:    '#2c5f8a',
    dark:   '#142d45',
    accent: '#f0a500',
    white:  '#f8fbff',
    black:  '#0a1520',
  },
  {
    name: 'Terrakotta',
    light:  '#faeae4',
    mid:    '#c0522e',
    dark:   '#7a2e12',
    accent: '#4a8c7a',
    white:  '#fffaf8',
    black:  '#2e1208',
  },
  {
    name: 'Schiefer',
    light:  '#eaf0f3',
    mid:    '#5c7a8a',
    dark:   '#2c3d47',
    accent: '#e07c5a',
    white:  '#f8fafb',
    black:  '#141e24',
  },
  {
    name: 'Lavendel',
    light:  '#f0eaf8',
    mid:    '#7c5ca8',
    dark:   '#3d2060',
    accent: '#5aa87c',
    white:  '#fdfbff',
    black:  '#180d30',
  },
  {
    name: 'Kupfer',
    light:  '#faf0e6',
    mid:    '#b5713a',
    dark:   '#6b3c18',
    accent: '#3a6b8a',
    white:  '#fffcf8',
    black:  '#241408',
  },
  {
    name: 'Feldgrau',
    light:  '#eef3e8',
    mid:    '#6b8a5c',
    dark:   '#374830',
    accent: '#8a5c3a',
    white:  '#fafdf8',
    black:  '#181e10',
  },
  {
    name: 'Ozean',
    light:  '#e4f5f5',
    mid:    '#2a8a8a',
    dark:   '#0d4040',
    accent: '#f07840',
    white:  '#f8fdfd',
    black:  '#061818',
  },
  {
    name: 'Kirsche',
    light:  '#fae8f0',
    mid:    '#b03060',
    dark:   '#601830',
    accent: '#5a7830',
    white:  '#fffafc',
    black:  '#200810',
  },
]
