# ==============================================================================
# REGLAS DE SEGURIDAD NATIVAS Y OFUSCACIÓN (Proguard / R8 para Android)
# ==============================================================================

# 1. Habilitación de Ofuscación y Optimización Estándar
# Ubicación del archivo en el proyecto React Native: android/app/proguard-rules.pro

# 2. Mantener la configuración de JSI para MMKV y Keychain (Crítico para que no se rompa JSI)
-keep class com.tencent.mmkv.** { *; }
-keep class com.reactnativekeychain.** { *; }

# 3. Mantener clases nativas de React Native
-keep class com.facebook.react.bridge.ReactMarker { *; }
-keep class com.facebook.react.bridge.JavaScriptExecutorFactory { *; }
-keep class com.facebook.react.bridge.WritableMap { *; }
-keep class com.facebook.react.bridge.ReadableMap { *; }

# 4. Eliminación de logs en producción (Configuración Proguard)
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
    public static int e(...);
}
