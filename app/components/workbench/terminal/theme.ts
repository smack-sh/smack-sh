import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--smack-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--smack-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--smack-elements-terminal-textColor'),
    background: cssVar('--smack-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--smack-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--smack-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--smack-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--smack-elements-terminal-color-black'),
    red: cssVar('--smack-elements-terminal-color-red'),
    green: cssVar('--smack-elements-terminal-color-green'),
    yellow: cssVar('--smack-elements-terminal-color-yellow'),
    blue: cssVar('--smack-elements-terminal-color-blue'),
    magenta: cssVar('--smack-elements-terminal-color-magenta'),
    cyan: cssVar('--smack-elements-terminal-color-cyan'),
    white: cssVar('--smack-elements-terminal-color-white'),
    brightBlack: cssVar('--smack-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--smack-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--smack-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--smack-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--smack-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--smack-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--smack-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--smack-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
