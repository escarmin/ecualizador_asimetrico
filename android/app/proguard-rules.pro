# Add project specific ProGuard rules here.

# ─── React Native core (OBLIGATORIO para que no crashee) ───────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# ─── Módulos nativos propios ────────────────────────────────────────────────────
-keep class com.asymmetricequalizerapp.** { *; }

# ─── MMKV ───────────────────────────────────────────────────────────────────────
-keep class com.tencent.mmkv.** { *; }

# ─── Keychain ────────────────────────────────────────────────────────────────────
-keep class com.oblador.keychain.** { *; }

# ─── Librería de criptografía (usada por keychain) ──────────────────────────────
-keep class org.spongycastle.** { *; }
-keep class org.bouncycastle.** { *; }

# ─── Annotations / Reflection necesarias para React Native ──────────────────────
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes Exceptions

# ─── Evitar warnings de bibliotecas externas ────────────────────────────────────
-dontwarn com.facebook.**
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
