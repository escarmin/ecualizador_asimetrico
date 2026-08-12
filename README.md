# Asymmetric Equalizer App

Esta es la base de la aplicación del **Ecualizador Inteligente Asimétrico** estructurada bajo Clean Architecture, diseñada bajo estándares de accesibilidad WCAG AAA para adultos mayores, y compatible con ejecuciones locales (Android/iOS) y vista previa web.

---

## Estructura del Proyecto

*   `src/domain/`: Reglas de negocio puras e interfaces de repositorios.
*   `src/application/`: Casos de uso (lógica de interacción con repositorios).
*   `src/infrastructure/`: Implementaciones de almacenamiento local (`react-native-mmkv`) y lógica de bajo nivel.
*   `src/presentation/`: Componentes visuales y pantallas de React Native optimizadas para accesibilidad.

---

## Cómo Ejecutar el Proyecto

Asegúrate de instalar primero las dependencias con `npm install`.

### 1. En Modo Web (Vista Previa Rápida)
Esta modalidad utiliza `react-native-web` para levantar la interfaz directamente en tu navegador y probar de forma rápida la UI y los flujos de navegación:

```bash
npm run web
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
> [!NOTE]
> En la web, las funciones de procesamiento de audio en tiempo real del dispositivo (DSP) y almacenamiento de bajo nivel pueden no estar disponibles y retornarán respuestas simuladas.

### 2. En Dispositivos Móviles (Nativo Real)

#### Android
Para emuladores o dispositivos físicos Android conectados por USB:
```bash
npm run android
```

#### iOS (Solo macOS)
Para simuladores o dispositivos físicos iPhone:
```bash
# Instala las dependencias de CocoaPods primero (si estás en macOS)
cd ios && pod install && cd ..

# Levanta la aplicación
npm run ios
```
