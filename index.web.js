import { AppRegistry } from 'react-native';
import App from './App';

const appName = 'asymmetric-equalizer-app';
AppRegistry.registerComponent(appName, () => App);

const rootTag = document.getElementById('app-root');
if (!rootTag) {
  throw new Error(
    '[index.web.js] No se encontró el elemento #app-root en el DOM. ' +
    'Verifica que public/index.html contenga un <div id="app-root"></div>.'
  );
}

AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag,
});
