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
    name: 'Sandstein',
    light:  '#faf0e4',
    mid:    '#c9955c',
    dark:   '#7a4e28',
    accent: '#6b9e4a',
    white:  '#fffdf9',
    black:  '#2e1a08',
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
]
