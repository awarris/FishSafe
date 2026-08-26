/**
 * Accessor hook for the application theme context.
 *
 * Keeping theme access behind a hook prevents screens and components from
 * depending on the provider implementation directly.
 */

import { use } from 'react';

import {
  ThemeContext,
} from '../providers/theme-provider';

export function useAppTheme() {
  const context =
    use(ThemeContext);

  if (!context) {
    throw new Error(
      'useAppTheme must be used within ThemeProvider.'
    );
  }

  return context;
}
