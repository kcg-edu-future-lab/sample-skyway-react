import React, { createContext } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './component/App';
import reportWebVitals from './reportWebVitals';
import { UserMediaStreamManager, VirtualBackgroundStreamManager } from './lib/StreamManagers';
import { SkyWay } from './lib/SkyWay';
import vbImagePath from './defaultBackground.png';

export const UserMediaStreamManagerContext = createContext(new UserMediaStreamManager());
export const VirtualBackgroundStreamManagerContext = createContext(new VirtualBackgroundStreamManager(vbImagePath));
export const SkyWayContext = createContext(new SkyWay());

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
