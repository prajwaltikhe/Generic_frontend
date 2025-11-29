import './index.css';
import App from './App.jsx';
import 'leaflet/dist/leaflet.css';
import store from './redux/store.js';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
);
