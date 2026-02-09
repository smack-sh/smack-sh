import { globSync } from 'fast-glob';
import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss';

const iconPaths = globSync('./icons/*.svg');

const collectionName = 'smack';

const customIconCollection = iconPaths.reduce(
  (acc, iconPath) => {
    const [iconName] = basename(iconPath).split('.');

    acc[collectionName] ??= {};
    acc[collectionName][iconName] = async () => fs.readFile(iconPath, 'utf8');

    return acc;
  },
  {} as Record<string, Record<string, () => Promise<string>>>,
);

const BASE_COLORS = {
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  accent: {
    50: '#F8F5FF',
    100: '#F0EBFF',
    200: '#E1D6FF',
    300: '#ffbebeff',
    400: '#ff9e9eff',
    500: '#ff7d7dff',
    600: '#ff5f5fff',
    700: '#e84545ff',
    800: '#bb3434ff',
    900: '#932d2dff',
    950: '#591919ff',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  orange: {
    50: '#FFFAEB',
    100: '#FEEFC7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#792E0D',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
};

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,
  alpha: {
    white: generateAlphaPalette(BASE_COLORS.white),
    gray: generateAlphaPalette(BASE_COLORS.gray[900]),
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
  },
};

export default defineConfig({
  safelist: [...Object.keys(customIconCollection[collectionName] || {}).map((x) => `i-smack:${x}`)],
  shortcuts: {
    'smack-ease-cubic-bezier': 'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-theme': 'transition-[background-color,border-color,color] duration-150 smack-ease-cubic-bezier',
    kdb: 'bg-smack-elements-code-background text-smack-elements-code-text py-1 px-1.5 rounded-md',
    'max-w-chat': 'max-w-[var(--chat-max-width)]',
  },
  rules: [
    /**
     * This shorthand doesn't exist in Tailwind and we overwrite it to avoid
     * any conflicts with minified CSS classes.
     */
    ['b', {}],
  ],
  theme: {
    colors: {
      ...COLOR_PRIMITIVES,
      smack: {
        elements: {
          borderColor: 'var(--smack-elements-borderColor)',
          borderColorActive: 'var(--smack-elements-borderColorActive)',
          background: {
            depth: {
              1: 'var(--smack-elements-bg-depth-1)',
              2: 'var(--smack-elements-bg-depth-2)',
              3: 'var(--smack-elements-bg-depth-3)',
              4: 'var(--smack-elements-bg-depth-4)',
            },
          },
          textPrimary: 'var(--smack-elements-textPrimary)',
          textSecondary: 'var(--smack-elements-textSecondary)',
          textTertiary: 'var(--smack-elements-textTertiary)',
          code: {
            background: 'var(--smack-elements-code-background)',
            text: 'var(--smack-elements-code-text)',
          },
          button: {
            primary: {
              background: 'var(--smack-elements-button-primary-background)',
              backgroundHover: 'var(--smack-elements-button-primary-backgroundHover)',
              text: 'var(--smack-elements-button-primary-text)',
            },
            secondary: {
              background: 'var(--smack-elements-button-secondary-background)',
              backgroundHover: 'var(--smack-elements-button-secondary-backgroundHover)',
              text: 'var(--smack-elements-button-secondary-text)',
            },
            danger: {
              background: 'var(--smack-elements-button-danger-background)',
              backgroundHover: 'var(--smack-elements-button-danger-backgroundHover)',
              text: 'var(--smack-elements-button-danger-text)',
            },
          },
          item: {
            contentDefault: 'var(--smack-elements-item-contentDefault)',
            contentActive: 'var(--smack-elements-item-contentActive)',
            contentAccent: 'var(--smack-elements-item-contentAccent)',
            contentDanger: 'var(--smack-elements-item-contentDanger)',
            backgroundDefault: 'var(--smack-elements-item-backgroundDefault)',
            backgroundActive: 'var(--smack-elements-item-backgroundActive)',
            backgroundAccent: 'var(--smack-elements-item-backgroundAccent)',
            backgroundDanger: 'var(--smack-elements-item-backgroundDanger)',
          },
          actions: {
            background: 'var(--smack-elements-actions-background)',
            code: {
              background: 'var(--smack-elements-actions-code-background)',
            },
          },
          artifacts: {
            background: 'var(--smack-elements-artifacts-background)',
            backgroundHover: 'var(--smack-elements-artifacts-backgroundHover)',
            borderColor: 'var(--smack-elements-artifacts-borderColor)',
            inlineCode: {
              background: 'var(--smack-elements-artifacts-inlineCode-background)',
              text: 'var(--smack-elements-artifacts-inlineCode-text)',
            },
          },
          messages: {
            background: 'var(--smack-elements-messages-background)',
            linkColor: 'var(--smack-elements-messages-linkColor)',
            code: {
              background: 'var(--smack-elements-messages-code-background)',
            },
            inlineCode: {
              background: 'var(--smack-elements-messages-inlineCode-background)',
              text: 'var(--smack-elements-messages-inlineCode-text)',
            },
          },
          icon: {
            success: 'var(--smack-elements-icon-success)',
            error: 'var(--smack-elements-icon-error)',
            primary: 'var(--smack-elements-icon-primary)',
            secondary: 'var(--smack-elements-icon-secondary)',
            tertiary: 'var(--smack-elements-icon-tertiary)',
          },
          preview: {
            addressBar: {
              background: 'var(--smack-elements-preview-addressBar-background)',
              backgroundHover: 'var(--smack-elements-preview-addressBar-backgroundHover)',
              backgroundActive: 'var(--smack-elements-preview-addressBar-backgroundActive)',
              text: 'var(--smack-elements-preview-addressBar-text)',
              textActive: 'var(--smack-elements-preview-addressBar-textActive)',
            },
          },
          terminals: {
            background: 'var(--smack-elements-terminals-background)',
            buttonBackground: 'var(--smack-elements-terminals-buttonBackground)',
          },
          dividerColor: 'var(--smack-elements-dividerColor)',
          loader: {
            background: 'var(--smack-elements-loader-background)',
            progress: 'var(--smack-elements-loader-progress)',
          },
          prompt: {
            background: 'var(--smack-elements-prompt-background)',
          },
          sidebar: {
            dropdownShadow: 'var(--smack-elements-sidebar-dropdownShadow)',
            buttonBackgroundDefault: 'var(--smack-elements-sidebar-buttonBackgroundDefault)',
            buttonBackgroundHover: 'var(--smack-elements-sidebar-buttonBackgroundHover)',
            buttonText: 'var(--smack-elements-sidebar-buttonText)',
          },
          cta: {
            background: 'var(--smack-elements-cta-background)',
            text: 'var(--smack-elements-cta-text)',
          },
        },
      },
    },
  },
  transformers: [transformerDirectives()],
  presets: [
    presetUno({
      dark: {
        light: '[data-theme="light"]',
        dark: '[data-theme="dark"]',
      },
    }),
    presetIcons({
      warn: true,
      collections: {
        ...customIconCollection,
        ph: () => import('@iconify-json/ph/icons.json').then(i => i.default),
      },
      unit: 'em',
    }),
  ],
});

/**
 * Generates an alpha palette for a given hex color.
 *
 * @param hex - The hex color code (without alpha) to generate the palette from.
 * @returns An object where keys are opacity percentages and values are hex colors with alpha.
 *
 * Example:
 *
 * ```
 * {
 *   '1': '#FFFFFF03',
 *   '2': '#FFFFFF05',
 *   '3': '#FFFFFF08',
 * }
 * ```
 */
function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}
