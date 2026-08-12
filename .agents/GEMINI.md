# Reglas de Desarrollo y Arquitectura del Proyecto (React Native)

Este archivo define las reglas estrictas de desarrollo, accesibilidad y diseño arquitectónico que todo agente de IA y desarrollador debe seguir en este proyecto.

---

## 1. Arquitectura Desacoplada y Almacenamiento Local (Offline-First)

*   **100% Offline-First:** La aplicación debe funcionar de forma autónoma sin depender de APIs de red o servicios externos para sus operaciones clave. Cualquier llamada de red futura debe tratarse como mejora opcional con sincronización asíncrona.
*   **Clean Architecture:**
    *   **Domain:** Contiene entidades y la interfaz abstracta del repositorio (`Repository<T>`). Ningún archivo de dominio puede importar de `react-native`, `react` o bases de datos.
    *   **Application:** Contiene los casos de uso (`useCases`) que implementan las reglas de negocio usando interfaces del dominio.
    *   **Infrastructure:** Contiene implementaciones concretas como almacenamiento MMKV, servicios nativos, controladores de audio y llamadas del sistema.
    *   **Presentation:** Componentes y pantallas de React Native.
*   **Persistencia JSON Dinámica:**
    *   **NO DTOs Rígidos:** La persistencia debe utilizar estructuras JSON flexibles (ej. `Record<string, any>`) pasadas a través de la interfaz del repositorio genérico. Evita forzar clases o modelos rígidos que obliguen a realizar complejas conversiones bidireccionales innecesarias en la capa de datos.
    *   Usa `MMKVRepositoryImpl` para almacenamiento persistente local ultra rápido.

---

## 2. Accesibilidad Universal (Diseño para Adultos Mayores - WCAG AAA)

Para garantizar que personas con presbicia, limitaciones visuales o motoras leves (típicas en mayores de 60 años) utilicen la aplicación de forma autónoma:

*   **Tamaño de Fuente:** El tamaño de fuente mínimo para cualquier elemento de texto informativo o botón debe ser de **`18px`** (o equivalente). El texto principal debe preferir **`20px`** o superior.
*   **Áreas de Contacto Táctil:** Todos los botones, enlaces e iconos interactivos deben tener un tamaño mínimo de **`48dp x 48dp`** (48px en React Native). Si el elemento visual es menor, agranda su padding (`hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}`).
*   **Contraste WCAG AAA:** Usa una relación de contraste mínima de **`7:1`** para el texto normal. Evita los tonos grises suaves sobre fondo blanco, o amarillos sobre blanco. Prioriza fondos oscuros de alto contraste o temas de alta legibilidad (ej. Negro absoluto `#000000` y Texto Blanco `#FFFFFF`, o Amarillo vibrante `#FFCC00` para acentos).
*   **Semántica y Lectores de Pantalla:**
    *   Cada elemento interactivo debe tener explícitamente `accessible={true}` y `accessibilityRole` (ej. `button`, `image`, `header`).
    *   Utiliza `accessibilityLabel` descriptivos en español detallando la acción (ej. `"Guardar perfil de ecualización actual"` en lugar de `"Guardar"`).

---

## 3. Seguridad y Hardening en Producción

*   **Ofuscación:** Asegúrate de que las compilaciones de producción tengan Proguard activo en Android. No agregues logs sensibles a consola (`console.log`) en producción.
*   **Datos de Salud y Privacidad:**
    *   Los datos audiométricos se consideran información sensible de salud. No deben guardarse en la nube del dispositivo (`allowBackup="false"`).
    *   Cualquier dato de autenticación o llave de cifrado local debe guardarse usando almacenamiento seguro nativo (Keychain en iOS / Keystore en Android) a través de `react-native-keychain`.

---

## 4. Compatibilidad con Entorno Web (`react-native-web`)

La aplicación puede ejecutarse en modo web como herramienta de desarrollo rápido. Sin embargo, ciertas APIs nativas no existen en el navegador y deben ser reemplazadas por mocks o stubs cuando se detecte el entorno web.

*   **Detección del Entorno:** Usa `Platform.OS === 'web'` para bifurcar lógica entre entornos.
*   **APIs que deben ser Mockeadas en Web:**
    *   `react-native-mmkv`: El almacenamiento local MMKV no está disponible en web. Implementa un `WebStorageRepositoryImpl` alternativo que use `localStorage` para las pruebas en navegador.
    *   `react-native-keychain`: No disponible en web. En entorno web, retorna valores simulados o vacíos según el contexto de la prueba.
    *   APIs de audio nativo (DSP, ecualización de hardware): No disponibles en web. Implementa stubs de audio que simulen el comportamiento esperado para validar los flujos de UI sin romper la compilación.
*   **Regla General:** El código del `domain/` y `application/` nunca debe importar directamente librerías nativas. Toda la dependencia nativa debe inyectarse mediante los repositorios de la capa `infrastructure/`, facilitando el intercambio de implementaciones entre móvil y web.
