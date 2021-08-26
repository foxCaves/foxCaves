import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { App } from './app';

import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('root')
);
