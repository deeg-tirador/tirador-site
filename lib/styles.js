export const theme = {
  bgPage:  '#0a0a0a',
  bgCard:  '#111111',
  bgNav:   '#0d0d0d',
  bgSurf:  '#181818',
  border:  '#2a1a08',
  gold:    '#f5c518',
  orange:  '#e8621a',
  textH:   '#ffffff',
  textB:   '#ffaa66',
  textM:   '#cc6622',
}

export const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${theme.bgPage}; color: ${theme.textH}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  a { text-decoration: none; color: inherit; }
  button { cursor: pointer; font-family: inherit; }
  input { font-family: inherit; outline: none; }
  ::-webkit-scrollbar { height: 4px; width: 4px; }
  ::-webkit-scrollbar-track { background: ${theme.bgPage}; }
  ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }
`
