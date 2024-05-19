import type { Decorator } from '@storybook/react';
import GlobalStyles from '../src/styles/GlobalStyles';
import React from 'react';

const withGlobalStyles: Decorator = (Story, contetx) => (
  <>
    <GlobalStyles />
    {Story(contetx)}
  </>
);

const decorators = [withGlobalStyles];
export default decorators;
