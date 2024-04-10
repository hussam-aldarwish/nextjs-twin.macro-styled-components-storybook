import type { Decorator, Preview } from '@storybook/react';
import React from 'react';
import GlobalStyles from '../src/styles/GlobalStyles';

const withGlobalStyles: Decorator = (Story, context) => (
  <>
    <GlobalStyles />
    <Story {...context} />
  </>
);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: withGlobalStyles,
};

export default preview;
