# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepclassmembers class * {
    @kotlinx.serialization.Serializable *;
}
-keep class com.genokiller05.miappmovil.data.model.** { *; }
