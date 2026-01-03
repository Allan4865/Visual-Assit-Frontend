# Pruebas de Accesibilidad para Tesis

## Descripción

Este directorio contiene herramientas para evaluar la accesibilidad del Sistema de Asistencia Visual siguiendo los estándares WCAG 2.1.

## Archivos Incluidos

| Archivo | Descripción |
|---------|-------------|
| `test_accessibility_thesis.js` | Script de pruebas automatizadas con axe-core |
| `WCAG_CHECKLIST_THESIS.md` | Checklist manual para evaluación WCAG 2.1 |
| `accessibility_results/` | Directorio donde se guardan los reportes |

---

## Opción 1: Pruebas Automatizadas con Playwright + axe-core

### Requisitos Previos

```bash
# Node.js 18+ debe estar instalado
node --version

# Estar en el directorio frontend
cd frontend
```

### Instalación

```bash
# Instalar dependencias de pruebas
npm install --save-dev playwright @playwright/test

# Instalar navegador Chromium
npx playwright install chromium
```

### Ejecución

```bash
# 1. Primero, iniciar el frontend en otra terminal
npm run dev

# 2. En otra terminal, ejecutar las pruebas
node test_accessibility_thesis.js
```

### Resultados

Los reportes se guardan en `accessibility_results/`:
- `accessibility_report_*.json` - Datos completos en JSON
- `accessibility_report_*.txt` - Reporte legible en texto
- `accessibility_report_*.md` - Reporte en Markdown para la tesis

---

## Opción 2: Lighthouse (Chrome DevTools)

### Pasos

1. Abrir Chrome y navegar a `http://localhost:3000`
2. Abrir DevTools (F12)
3. Ir a la pestaña **Lighthouse**
4. Seleccionar solo **Accessibility**
5. Click en **Analyze page load**
6. Guardar el reporte (botón de exportar)

### Captura de Resultados

```
Score de Accesibilidad: ___/100

Auditorías pasadas: ___
Auditorías fallidas: ___
```

---

## Opción 3: axe DevTools (Extensión de Chrome)

### Instalación

1. Ir a Chrome Web Store
2. Buscar "axe DevTools"
3. Instalar la extensión

### Uso

1. Navegar a `http://localhost:3000`
2. Abrir DevTools (F12)
3. Ir a la pestaña **axe DevTools**
4. Click en **Scan ALL of my page**
5. Exportar resultados

---

## Opción 4: WAVE (Web Accessibility Evaluation Tool)

### Uso Online

1. Ir a https://wave.webaim.org/
2. Ingresar URL: `http://localhost:3000` (debe ser accesible públicamente)

### Extensión de Chrome

1. Instalar extensión WAVE desde Chrome Web Store
2. Navegar a `http://localhost:3000`
3. Click en el icono de WAVE
4. Capturar screenshot del reporte

---

## Opción 5: Pa11y (Línea de Comandos)

### Instalación

```bash
npm install -g pa11y
```

### Ejecución

```bash
# Prueba básica
pa11y http://localhost:3000

# Con reporte JSON
pa11y http://localhost:3000 --reporter json > pa11y_report.json

# Con reporte HTML
pa11y http://localhost:3000 --reporter html > pa11y_report.html

# WCAG 2.1 AA
pa11y http://localhost:3000 --standard WCAG2AA
```

---

## Opción 6: Evaluación Manual con NVDA

### Requisitos

- Descargar NVDA (gratuito): https://www.nvaccess.org/download/
- Windows

### Lista de Verificación

```
[ ] Navegar con Tab por todos los elementos interactivos
[ ] Usar atajos de NVDA:
    - H: Navegar por encabezados
    - B: Navegar por botones
    - F: Navegar por formularios
    - D: Navegar por landmarks
[ ] Verificar que las alertas de detección se anuncian
[ ] Verificar que el estado de la cámara se anuncia
[ ] Verificar que los botones tienen nombres accesibles
```

---

## Tabla Comparativa de Herramientas

| Herramienta | Tipo | Costo | Nivel de Detalle |
|-------------|------|-------|------------------|
| Script personalizado | Automatizado | Gratis | Alto |
| Lighthouse | Automatizado | Gratis | Medio |
| axe DevTools | Automatizado | Gratis (básico) | Alto |
| WAVE | Semi-automatizado | Gratis | Medio |
| Pa11y | Automatizado CLI | Gratis | Medio |
| NVDA | Manual | Gratis | Muy Alto |

---

## Métricas a Reportar en la Tesis

### Métricas Automatizadas

| Métrica | Valor |
|---------|-------|
| Score Lighthouse Accesibilidad | ___/100 |
| Violaciones WCAG Críticas | ___ |
| Violaciones WCAG Serias | ___ |
| Violaciones WCAG Moderadas | ___ |
| Violaciones WCAG Menores | ___ |
| Total Pruebas Pasadas | ___ |

### Métricas Manuales (WCAG Checklist)

| Nivel | Criterios Cumplidos | Total | Porcentaje |
|-------|---------------------|-------|------------|
| A | ___ | ___ | ___% |
| AA | ___ | ___ | ___% |

### Métricas de Lector de Pantalla

| Prueba | Resultado |
|--------|-----------|
| Navegación por encabezados | ✅/❌ |
| Navegación por landmarks | ✅/❌ |
| Anuncio de alertas | ✅/❌ |
| Skip link funcional | ✅/❌ |
| Indicador de foco visible | ✅/❌ |

---

## Ejemplo de Redacción para la Tesis

```
4.3 Resultados de Pruebas de Accesibilidad

Se evaluó el cumplimiento de accesibilidad del sistema utilizando
múltiples herramientas automatizadas y verificaciones manuales.

4.3.1 Evaluación Automatizada (Lighthouse)

El análisis con Google Lighthouse arrojó un score de accesibilidad
de XX/100. Se identificaron X violaciones de criterios WCAG 2.1:
- X violaciones de nivel A
- X violaciones de nivel AA

4.3.2 Evaluación Manual (WCAG 2.1 Checklist)

Utilizando el checklist WCAG 2.1, se verificaron XX criterios:
- Nivel A: XX/XX criterios cumplidos (XX%)
- Nivel AA: XX/XX criterios cumplidos (XX%)

4.3.3 Pruebas con Lector de Pantalla (NVDA)

Se realizaron pruebas con el lector de pantalla NVDA, verificando:
- Navegación por teclado: Funcional
- Anuncio de detecciones: Las alertas se anuncian correctamente
- Skip link: Presente y funcional

4.3.4 Conclusiones de Accesibilidad

El sistema cumple con los criterios esenciales de WCAG 2.1 nivel A,
con XX% de cumplimiento. Las principales áreas de mejora incluyen...
```

---

## Soporte

Si encuentras problemas ejecutando las pruebas:

1. Verifica que el frontend esté corriendo (`npm run dev`)
2. Verifica que Node.js esté instalado correctamente
3. Reinstala las dependencias (`npm install`)
