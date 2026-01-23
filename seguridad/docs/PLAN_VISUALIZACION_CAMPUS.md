# Plan de Mejora: Visualización Premium del Campus UTM

Actualmente, el mapa base (OpenStreetMap) no tiene registrados los edificios internos de la Universidad Tecnológica Metropolitana (UTM), por eso la zona aparece vacía aunque el sistema está funcionando correctamente (detecta edificios afuera, donde sí hay datos).

Para solucionar esto y que el mapa se vea **profesional y detallado** como la imagen que enviaste, propongo el siguiente plan de 3 niveles:

## 1. Solución "Gemelo Digital" (Recomendada 🌟)
**Superponer tu mapa gráfico directamente sobre el mapa interactivo.**
Leaflet permite tomar una imagen (como el plano de la UTM que subiste) y "pegarla" georreferenciada sobre el mapa real.
*   **Ventajas:** Se verá **exactamente** como el diseño oficial (colores, letras A, B, C, canchas). Es la opción más estética.
*   **Implementación:**
    1.  Agregamos la imagen al proyecto.
    2.  Definimos las coordenadas de las 4 esquinas de la universidad.
    3.  La imagen se estira y encaja perfectamente. Los guardias se moverán "encima" de tu mapa personalizado.

## 2. Capa Satelital (Solución Rápida 🚀)
**Agregar un botón para cambiar entre "Mapa Normal" y "Vista Satelital".**
*   **Ventajas:** Podrás ver los edificios reales (techos, estacionamientos, árboles) con fotografía aérea real.
*   **Implementación:** Agrego un control de capas para alternar con *Esri World Imagery* o *Google Satellite*.
*   **Contras:** No tendrá las etiquetas bonitas (A, B, C) a menos que las pongamos nosotros.

## 3. Editor de Edificios Personalizado (Solución Manual 🛠️)
**Crear una herramienta para que tú dibujes los edificios que faltan.**
*   **Ventajas:** Si OpenStreetMap no tiene el edificio "H", tú tomas el mouse, dibujas el recuadro y le pones nombre "Edificio H".
*   **Implementación:** Habilitar el modo dibujo para "Crear Edificio" y guardarlo en tu propia base de datos, no en la pública.

---

### Mi Recomendación
Implementemos la **Opción 1 y 2 combinadas**:
1.  Te daré un botón para ver el **Satélite** (muy útil para seguridad real).
2.  Intentaremos integrar la **Imagen del Plano UTM** como una capa "Overlay".

¿Te gustaría que empiece habilitando la **Vista Satelital** ahora mismo para que veas una mejora inmediata?
