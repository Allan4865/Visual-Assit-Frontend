# Checklist de Accesibilidad WCAG 2.1
## Sistema de Asistencia Visual para Personas con Discapacidad Visual

> Este checklist evalúa el cumplimiento de WCAG 2.1 niveles A y AA.
> Marca cada criterio como: ✅ Cumple | ❌ No cumple | ⚠️ Parcial | N/A No aplica

---

## Información del Evaluador

| Campo | Valor |
|-------|-------|
| Fecha de evaluación | _________________ |
| Evaluador | _________________ |
| Versión del sistema | 1.0.0 |
| Navegador usado | _________________ |
| Lector de pantalla | _________________ |

---

## 1. PRINCIPIO: PERCEPTIBLE

### 1.1 Alternativas de Texto (Nivel A)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 1.1.1 | Todas las imágenes tienen texto alternativo (`alt`) | [ ] | |
| 1.1.1 | Los iconos decorativos tienen `alt=""` o `aria-hidden="true"` | [ ] | |
| 1.1.1 | Los botones de solo icono tienen `aria-label` | [ ] | |
| 1.1.1 | El canvas de video tiene descripción alternativa | [ ] | |

### 1.2 Contenido Multimedia (Nivel A/AA)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 1.2.1 | El audio tiene alternativa de texto (alertas de detección) | [ ] | |
| 1.2.3 | Hay descripción de audio para contenido visual importante | [ ] | |

### 1.3 Adaptable (Nivel A)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 1.3.1 | La información se transmite sin depender solo del color | [ ] | |
| 1.3.1 | Los encabezados (h1-h6) están en orden jerárquico | [ ] | |
| 1.3.1 | Las listas usan elementos `<ul>`, `<ol>`, `<li>` | [ ] | |
| 1.3.2 | El orden de lectura es lógico y significativo | [ ] | |
| 1.3.3 | Las instrucciones no dependen solo de forma, tamaño o posición | [ ] | |
| 1.3.4 | El contenido funciona en orientación horizontal y vertical | [ ] | |
| 1.3.5 | Los campos de formulario tienen `autocomplete` apropiado | [ ] | |

### 1.4 Distinguible (Nivel A/AA)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 1.4.1 | El color no es el único medio de transmitir información | [ ] | |
| 1.4.2 | El audio que se reproduce automáticamente puede pausarse | [ ] | |
| 1.4.3 | Contraste texto normal: mínimo 4.5:1 | [ ] | |
| 1.4.3 | Contraste texto grande (>18px): mínimo 3:1 | [ ] | |
| 1.4.4 | El texto puede ampliarse 200% sin pérdida de funcionalidad | [ ] | |
| 1.4.5 | No se usa texto en imágenes (excepto logos) | [ ] | |
| 1.4.10 | El contenido no requiere scroll horizontal a 320px | [ ] | |
| 1.4.11 | Contraste de componentes UI: mínimo 3:1 | [ ] | |
| 1.4.12 | El espaciado de texto puede ajustarse sin pérdida | [ ] | |
| 1.4.13 | El contenido hover/focus es descartable y hoverable | [ ] | |

---

## 2. PRINCIPIO: OPERABLE

### 2.1 Accesible por Teclado (Nivel A)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 2.1.1 | Toda la funcionalidad es accesible con teclado | [ ] | |
| 2.1.1 | Se puede iniciar detección con Enter/Space | [ ] | |
| 2.1.1 | Se puede detener detección con Enter/Space | [ ] | |
| 2.1.1 | Se pueden seleccionar cámaras con teclado | [ ] | |
| 2.1.1 | Los controles de audio funcionan con teclado | [ ] | |
| 2.1.2 | No hay trampas de teclado | [ ] | |
| 2.1.4 | Los atajos de teclado pueden desactivarse o remapearse | [ ] | |

### 2.2 Tiempo Suficiente (Nivel A)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 2.2.1 | Los timeouts son ajustables o advertidos | [ ] | |
| 2.2.2 | Las animaciones pueden pausarse | [ ] | |

### 2.3 Convulsiones (Nivel A)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 2.3.1 | No hay contenido que parpadee más de 3 veces/segundo | [ ] | |

### 2.4 Navegable (Nivel A/AA)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 2.4.1 | Existe enlace "Saltar al contenido principal" | [ ] | |
| 2.4.1 | El skip link es el primer elemento enfocable | [ ] | |
| 2.4.2 | La página tiene título descriptivo | [ ] | |
| 2.4.3 | El orden de foco es lógico y predecible | [ ] | |
| 2.4.4 | Los enlaces tienen propósito claro (no "click aquí") | [ ] | |
| 2.4.5 | Hay múltiples formas de navegar el sitio | [ ] | |
| 2.4.6 | Los encabezados y etiquetas son descriptivos | [ ] | |
| 2.4.7 | El indicador de foco es visible | [ ] | |

### 2.5 Modalidades de Entrada (Nivel A)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 2.5.1 | Los gestos complejos tienen alternativas simples | [ ] | |
| 2.5.2 | Las acciones de puntero pueden cancelarse | [ ] | |
| 2.5.3 | Las etiquetas visibles coinciden con nombres accesibles | [ ] | |
| 2.5.4 | La funcionalidad no depende del movimiento del dispositivo | [ ] | |

---

## 3. PRINCIPIO: COMPRENSIBLE

### 3.1 Legible (Nivel A)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 3.1.1 | El idioma de la página está definido (`lang="es"`) | [ ] | |
| 3.1.2 | Los cambios de idioma están marcados | [ ] | |

### 3.2 Predecible (Nivel A)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 3.2.1 | El foco no causa cambios inesperados de contexto | [ ] | |
| 3.2.2 | Los inputs no causan cambios inesperados | [ ] | |
| 3.2.3 | La navegación es consistente en todas las páginas | [ ] | |
| 3.2.4 | Los componentes similares se identifican consistentemente | [ ] | |

### 3.3 Asistencia en la Entrada (Nivel A/AA)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 3.3.1 | Los errores se identifican y describen en texto | [ ] | |
| 3.3.2 | Los campos tienen etiquetas o instrucciones | [ ] | |
| 3.3.3 | Se sugieren correcciones para errores | [ ] | |
| 3.3.4 | Hay prevención de errores en acciones importantes | [ ] | |

---

## 4. PRINCIPIO: ROBUSTO

### 4.1 Compatible (Nivel A)

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 4.1.1 | El HTML es válido (sin errores de parsing) | [ ] | |
| 4.1.2 | Los componentes tienen nombre, rol y valor accesibles | [ ] | |
| 4.1.3 | Los mensajes de estado se anuncian sin cambiar el foco | [ ] | |

---

## 5. PRUEBAS ESPECÍFICAS DEL SISTEMA

### 5.1 Detección de Objetos

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 5.1.1 | Las detecciones se anuncian por voz de forma clara | [ ] | |
| 5.1.2 | La posición (izquierda/centro/derecha) se comunica | [ ] | |
| 5.1.3 | La distancia (cerca/lejos) se comunica | [ ] | |
| 5.1.4 | Las alertas prioritarias son distinguibles | [ ] | |
| 5.1.5 | El usuario puede ajustar velocidad de voz | [ ] | |
| 5.1.6 | El usuario puede silenciar/activar audio | [ ] | |

### 5.2 Selector de Cámara

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 5.2.1 | Las cámaras se pueden seleccionar con teclado | [ ] | |
| 5.2.2 | El estado de la cámara seleccionada se anuncia | [ ] | |
| 5.2.3 | Los errores de cámara se comunican claramente | [ ] | |

### 5.3 Controles de Detección

| # | Criterio | Estado | Notas |
|---|----------|--------|-------|
| 5.3.1 | El botón Iniciar/Detener es claramente identificable | [ ] | |
| 5.3.2 | El estado de detección (activa/inactiva) se anuncia | [ ] | |
| 5.3.3 | El contador de detecciones es accesible | [ ] | |

---

## 6. PRUEBAS CON TECNOLOGÍAS ASISTIVAS

### 6.1 Lector de Pantalla (NVDA/JAWS/VoiceOver)

| # | Prueba | Resultado | Notas |
|---|--------|-----------|-------|
| 6.1.1 | Navegación por encabezados (H) funciona | [ ] | |
| 6.1.2 | Navegación por landmarks funciona | [ ] | |
| 6.1.3 | Lista de enlaces es comprensible | [ ] | |
| 6.1.4 | Formularios se pueden completar | [ ] | |
| 6.1.5 | Alertas se anuncian automáticamente | [ ] | |
| 6.1.6 | El contenido dinámico se anuncia | [ ] | |

### 6.2 Magnificador de Pantalla

| # | Prueba | Resultado | Notas |
|---|--------|-----------|-------|
| 6.2.1 | El contenido es legible al 200% | [ ] | |
| 6.2.2 | El contenido es legible al 400% | [ ] | |
| 6.2.3 | No hay contenido cortado ni superpuesto | [ ] | |

---

## Resumen de Resultados

| Nivel | Total Criterios | Cumple | No Cumple | Parcial | N/A |
|-------|-----------------|--------|-----------|---------|-----|
| A | | | | | |
| AA | | | | | |
| **Total** | | | | | |

### Porcentaje de Cumplimiento

```
Nivel A:  _____ %
Nivel AA: _____ %
Total:    _____ %
```

---

## Conclusiones

### Fortalezas


### Áreas de Mejora


### Recomendaciones


---

## Firma

| Campo | Valor |
|-------|-------|
| Evaluador | _________________ |
| Fecha | _________________ |
| Firma | _________________ |

---

*Este checklist está basado en WCAG 2.1 (Web Content Accessibility Guidelines)*
*Más información: https://www.w3.org/WAI/WCAG21/quickref/*
