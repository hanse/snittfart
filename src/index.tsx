import '@devmoods/ui/dist/global.css';
import '@devmoods/ui/dist/styles.css';

import './index.css';

import { ErrorBoundary, ThemeProvider, createTheme } from '@devmoods/ui';
import * as React from 'react';
import { render } from 'react-dom';

import App from './App';

const theme = createTheme({
  colors: {
    primary: '#d75648',
    formsBorderRadius: '6px',
    formsBorderWidth: '1px',
    formsBorder: '#e4e4e4',
    formsBorderBackground: '#f1f2f3',
  },
  focusRing: {
    color: '#e6a51a',
  },
});

render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
);
