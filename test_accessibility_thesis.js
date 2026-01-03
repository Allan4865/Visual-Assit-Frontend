/**
 * =============================================================================
 * PRUEBAS DE ACCESIBILIDAD PARA TESIS
 * Sistema de Asistencia Visual para Personas con Discapacidad Visual
 * =============================================================================
 *
 * Este script ejecuta pruebas automatizadas de accesibilidad usando:
 * - Playwright (navegador automatizado)
 * - axe-core (motor de pruebas WCAG)
 *
 * Evalúa cumplimiento de WCAG 2.1 niveles A y AA
 *
 * INSTALACION:
 *   npm install --save-dev @playwright/test @axe-core/playwright
 *   npx playwright install chromium
 *
 * EJECUCION:
 *   node test_accessibility_thesis.js
 *
 * NOTA: El frontend debe estar corriendo en http://localhost:3000
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    outputDir: './accessibility_results',
    timeout: 30000,
    viewport: { width: 1280, height: 720 }
};

// Reglas WCAG a evaluar
const WCAG_RULES = {
    'wcag2a': 'WCAG 2.1 Nivel A',
    'wcag2aa': 'WCAG 2.1 Nivel AA',
    'wcag21a': 'WCAG 2.1 Nivel A (nuevos)',
    'wcag21aa': 'WCAG 2.1 Nivel AA (nuevos)'
};

/**
 * Clase principal para pruebas de accesibilidad
 */
class AccessibilityTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            url: CONFIG.baseUrl,
            summary: {
                total_violations: 0,
                total_passes: 0,
                critical: 0,
                serious: 0,
                moderate: 0,
                minor: 0
            },
            violations: [],
            passes: [],
            incomplete: [],
            manual_checks: [],
            keyboard_navigation: {},
            color_contrast: {},
            screen_reader: {}
        };
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        console.log('\n' + '='.repeat(60));
        console.log('PRUEBAS DE ACCESIBILIDAD - Sistema de Asistencia Visual');
        console.log('='.repeat(60));

        // Crear directorio de salida
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        // Iniciar navegador
        console.log('\nIniciando navegador...');
        this.browser = await chromium.launch({ headless: true });
        const context = await this.browser.newContext({
            viewport: CONFIG.viewport,
            locale: 'es-ES'
        });
        this.page = await context.newPage();

        console.log(`Navegando a: ${CONFIG.baseUrl}`);
        try {
            await this.page.goto(CONFIG.baseUrl, {
                waitUntil: 'networkidle',
                timeout: CONFIG.timeout
            });
            console.log('Página cargada correctamente\n');
        } catch (error) {
            console.error('ERROR: No se pudo cargar la página.');
            console.error('Asegúrate de que el frontend esté corriendo en http://localhost:3000');
            console.error('Ejecuta: npm run dev');
            throw error;
        }
    }

    /**
     * Prueba 1: Evaluación con axe-core
     */
    async runAxeTests() {
        console.log('-'.repeat(40));
        console.log('PRUEBA 1: Evaluación axe-core (WCAG 2.1)');
        console.log('-'.repeat(40));

        // Inyectar axe-core
        await this.page.addScriptTag({
            url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js'
        });

        // Esperar a que axe esté disponible
        await this.page.waitForFunction(() => typeof window.axe !== 'undefined');

        // Ejecutar análisis
        const axeResults = await this.page.evaluate(async () => {
            return await window.axe.run(document, {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
                }
            });
        });

        // Procesar resultados
        this.results.violations = axeResults.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            tags: v.tags,
            nodes_count: v.nodes.length,
            nodes: v.nodes.map(n => ({
                html: n.html.substring(0, 200),
                target: n.target,
                failureSummary: n.failureSummary
            }))
        }));

        this.results.passes = axeResults.passes.map(p => ({
            id: p.id,
            description: p.description,
            tags: p.tags,
            nodes_count: p.nodes.length
        }));

        this.results.incomplete = axeResults.incomplete.map(i => ({
            id: i.id,
            impact: i.impact,
            description: i.description,
            tags: i.tags
        }));

        // Actualizar resumen
        this.results.summary.total_violations = this.results.violations.length;
        this.results.summary.total_passes = this.results.passes.length;

        for (const v of this.results.violations) {
            this.results.summary[v.impact] = (this.results.summary[v.impact] || 0) + 1;
        }

        // Mostrar resultados
        console.log(`\n  Violaciones encontradas: ${this.results.violations.length}`);
        console.log(`  Pruebas pasadas: ${this.results.passes.length}`);
        console.log(`  Requieren revisión manual: ${this.results.incomplete.length}`);

        if (this.results.violations.length > 0) {
            console.log('\n  Violaciones por severidad:');
            console.log(`    - Críticas: ${this.results.summary.critical || 0}`);
            console.log(`    - Serias: ${this.results.summary.serious || 0}`);
            console.log(`    - Moderadas: ${this.results.summary.moderate || 0}`);
            console.log(`    - Menores: ${this.results.summary.minor || 0}`);

            console.log('\n  Detalle de violaciones:');
            for (const v of this.results.violations) {
                console.log(`    [${v.impact.toUpperCase()}] ${v.id}: ${v.help}`);
            }
        }
    }

    /**
     * Prueba 2: Navegación por teclado
     */
    async runKeyboardTests() {
        console.log('\n' + '-'.repeat(40));
        console.log('PRUEBA 2: Navegación por Teclado');
        console.log('-'.repeat(40));

        const keyboardResults = {
            skip_link_works: false,
            focusable_elements: 0,
            focus_visible: true,
            tab_order_logical: true,
            all_interactive_focusable: true,
            focus_trap_modals: 'N/A',
            issues: []
        };

        try {
            // Test 1: Skip link
            await this.page.keyboard.press('Tab');
            const firstFocused = await this.page.evaluate(() => {
                const el = document.activeElement;
                return {
                    tagName: el?.tagName,
                    text: el?.textContent?.trim(),
                    href: el?.getAttribute('href')
                };
            });

            if (firstFocused.href === '#main-content' ||
                firstFocused.text?.toLowerCase().includes('saltar')) {
                keyboardResults.skip_link_works = true;
                console.log('  ✓ Skip link funciona correctamente');
            } else {
                keyboardResults.issues.push('Skip link no es el primer elemento enfocable');
                console.log('  ✗ Skip link no es el primer elemento enfocable');
            }

            // Test 2: Contar elementos enfocables
            const focusableCount = await this.page.evaluate(() => {
                const focusable = document.querySelectorAll(
                    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                return focusable.length;
            });
            keyboardResults.focusable_elements = focusableCount;
            console.log(`  ✓ Elementos enfocables encontrados: ${focusableCount}`);

            // Test 3: Focus visible
            await this.page.keyboard.press('Tab');
            await this.page.keyboard.press('Tab');

            const hasFocusStyle = await this.page.evaluate(() => {
                const el = document.activeElement;
                if (!el) return false;
                const style = window.getComputedStyle(el);
                const outline = style.outline;
                const boxShadow = style.boxShadow;
                return outline !== 'none' || boxShadow !== 'none';
            });

            if (hasFocusStyle) {
                console.log('  ✓ Indicador de foco visible');
            } else {
                keyboardResults.focus_visible = false;
                keyboardResults.issues.push('Indicador de foco no visible en algunos elementos');
                console.log('  ⚠ Verificar indicador de foco');
            }

            // Test 4: Navegar por todos los elementos
            let tabCount = 0;
            const maxTabs = 50;
            const visitedElements = [];

            while (tabCount < maxTabs) {
                await this.page.keyboard.press('Tab');
                tabCount++;

                const currentEl = await this.page.evaluate(() => {
                    const el = document.activeElement;
                    return {
                        tagName: el?.tagName,
                        role: el?.getAttribute('role'),
                        ariaLabel: el?.getAttribute('aria-label'),
                        text: el?.textContent?.substring(0, 30)
                    };
                });

                if (currentEl.tagName === 'BODY') break;
                visitedElements.push(currentEl);
            }

            console.log(`  ✓ Navegación Tab completada (${visitedElements.length} elementos)`);

        } catch (error) {
            keyboardResults.issues.push(`Error en prueba: ${error.message}`);
            console.log(`  ✗ Error: ${error.message}`);
        }

        this.results.keyboard_navigation = keyboardResults;
    }

    /**
     * Prueba 3: Contraste de colores
     */
    async runContrastTests() {
        console.log('\n' + '-'.repeat(40));
        console.log('PRUEBA 3: Contraste de Colores');
        console.log('-'.repeat(40));

        const contrastResults = {
            text_elements_checked: 0,
            issues: [],
            passed: true
        };

        // Buscar violaciones de contraste en axe results
        const contrastViolations = this.results.violations.filter(v =>
            v.id.includes('contrast') || v.id.includes('color')
        );

        if (contrastViolations.length > 0) {
            contrastResults.passed = false;
            for (const v of contrastViolations) {
                contrastResults.issues.push({
                    rule: v.id,
                    description: v.help,
                    elements: v.nodes_count
                });
                console.log(`  ✗ ${v.help} (${v.nodes_count} elementos)`);
            }
        } else {
            console.log('  ✓ No se encontraron problemas de contraste');
        }

        // Verificar colores principales usados
        const colors = await this.page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const colorPairs = [];

            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const color = style.color;
                const bg = style.backgroundColor;
                if (color && bg && bg !== 'rgba(0, 0, 0, 0)') {
                    colorPairs.push({ color, bg });
                }
            });

            return colorPairs.slice(0, 10); // Primeros 10
        });

        contrastResults.sample_colors = colors;
        this.results.color_contrast = contrastResults;
    }

    /**
     * Prueba 4: Compatibilidad con lectores de pantalla
     */
    async runScreenReaderTests() {
        console.log('\n' + '-'.repeat(40));
        console.log('PRUEBA 4: Compatibilidad con Lectores de Pantalla');
        console.log('-'.repeat(40));

        const srResults = {
            has_lang: false,
            has_title: false,
            has_main_landmark: false,
            has_h1: false,
            heading_hierarchy: [],
            aria_live_regions: 0,
            images_with_alt: { total: 0, with_alt: 0 },
            form_labels: { total: 0, labeled: 0 },
            buttons_accessible: { total: 0, accessible: 0 },
            issues: []
        };

        // Verificar lang
        srResults.has_lang = await this.page.evaluate(() => {
            return document.documentElement.hasAttribute('lang');
        });
        console.log(`  ${srResults.has_lang ? '✓' : '✗'} Atributo lang en HTML`);

        // Verificar title
        srResults.has_title = await this.page.evaluate(() => {
            return document.title && document.title.length > 0;
        });
        console.log(`  ${srResults.has_title ? '✓' : '✗'} Título de página`);

        // Verificar landmark main
        srResults.has_main_landmark = await this.page.evaluate(() => {
            return document.querySelector('main, [role="main"]') !== null;
        });
        console.log(`  ${srResults.has_main_landmark ? '✓' : '✗'} Landmark main`);

        // Verificar H1
        srResults.has_h1 = await this.page.evaluate(() => {
            const h1s = document.querySelectorAll('h1');
            return h1s.length === 1;
        });
        console.log(`  ${srResults.has_h1 ? '✓' : '✗'} Único H1 en la página`);

        // Jerarquía de encabezados
        srResults.heading_hierarchy = await this.page.evaluate(() => {
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            return Array.from(headings).map(h => ({
                level: parseInt(h.tagName.charAt(1)),
                text: h.textContent?.trim().substring(0, 50)
            }));
        });
        console.log(`  ✓ Encabezados encontrados: ${srResults.heading_hierarchy.length}`);

        // Regiones aria-live
        srResults.aria_live_regions = await this.page.evaluate(() => {
            return document.querySelectorAll('[aria-live]').length;
        });
        console.log(`  ✓ Regiones aria-live: ${srResults.aria_live_regions}`);

        // Imágenes con alt
        const imgResults = await this.page.evaluate(() => {
            const imgs = document.querySelectorAll('img');
            let withAlt = 0;
            imgs.forEach(img => {
                if (img.hasAttribute('alt')) withAlt++;
            });
            return { total: imgs.length, with_alt: withAlt };
        });
        srResults.images_with_alt = imgResults;
        if (imgResults.total > 0) {
            const pct = Math.round((imgResults.with_alt / imgResults.total) * 100);
            console.log(`  ${pct === 100 ? '✓' : '⚠'} Imágenes con alt: ${imgResults.with_alt}/${imgResults.total} (${pct}%)`);
        }

        // Botones accesibles
        const btnResults = await this.page.evaluate(() => {
            const buttons = document.querySelectorAll('button, [role="button"]');
            let accessible = 0;
            buttons.forEach(btn => {
                const hasText = btn.textContent?.trim().length > 0;
                const hasAriaLabel = btn.hasAttribute('aria-label');
                const hasAriaLabelledby = btn.hasAttribute('aria-labelledby');
                if (hasText || hasAriaLabel || hasAriaLabelledby) accessible++;
            });
            return { total: buttons.length, accessible };
        });
        srResults.buttons_accessible = btnResults;
        if (btnResults.total > 0) {
            const pct = Math.round((btnResults.accessible / btnResults.total) * 100);
            console.log(`  ${pct === 100 ? '✓' : '⚠'} Botones accesibles: ${btnResults.accessible}/${btnResults.total} (${pct}%)`);
        }

        this.results.screen_reader = srResults;
    }

    /**
     * Genera lista de verificaciones manuales recomendadas
     */
    generateManualChecks() {
        this.results.manual_checks = [
            {
                category: 'Navegación por teclado',
                checks: [
                    'Todos los elementos interactivos son accesibles con Tab',
                    'El orden de tabulación es lógico',
                    'No hay trampas de teclado',
                    'Los modales atrapan el foco correctamente',
                    'Esc cierra modales y menús'
                ]
            },
            {
                category: 'Lector de pantalla (NVDA/VoiceOver)',
                checks: [
                    'Los encabezados describen correctamente las secciones',
                    'Las imágenes tienen descripciones alt significativas',
                    'Los botones tienen nombres accesibles',
                    'Los formularios tienen etiquetas asociadas',
                    'Las alertas de audio se anuncian correctamente',
                    'El estado de detección se comunica claramente'
                ]
            },
            {
                category: 'Contenido multimedia',
                checks: [
                    'Las alertas de audio tienen volumen adecuado',
                    'La síntesis de voz es clara y comprensible',
                    'El usuario puede pausar/detener el audio',
                    'Hay alternativas de texto para información visual'
                ]
            },
            {
                category: 'Contraste y visualización',
                checks: [
                    'El texto es legible con diferentes tamaños de fuente',
                    'Los colores de alerta son distinguibles',
                    'El modo de alto contraste funciona correctamente',
                    'La interfaz es usable con zoom 200%'
                ]
            }
        ];
    }

    /**
     * Guarda los resultados
     */
    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // JSON completo
        const jsonPath = path.join(CONFIG.outputDir, `accessibility_report_${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

        // Reporte de texto
        const txtPath = path.join(CONFIG.outputDir, `accessibility_report_${timestamp}.txt`);
        const textReport = this.generateTextReport();
        fs.writeFileSync(txtPath, textReport);

        // Reporte Markdown
        const mdPath = path.join(CONFIG.outputDir, `accessibility_report_${timestamp}.md`);
        const mdReport = this.generateMarkdownReport();
        fs.writeFileSync(mdPath, mdReport);

        console.log('\n' + '='.repeat(60));
        console.log('ARCHIVOS GENERADOS');
        console.log('='.repeat(60));
        console.log(`  JSON: ${jsonPath}`);
        console.log(`  TXT:  ${txtPath}`);
        console.log(`  MD:   ${mdPath}`);
    }

    generateTextReport() {
        let report = '';
        report += '='.repeat(70) + '\n';
        report += 'REPORTE DE ACCESIBILIDAD\n';
        report += 'Sistema de Asistencia Visual para Personas con Discapacidad Visual\n';
        report += '='.repeat(70) + '\n\n';
        report += `Fecha: ${this.results.timestamp}\n`;
        report += `URL: ${this.results.url}\n\n`;

        // Resumen
        report += '-'.repeat(40) + '\n';
        report += 'RESUMEN\n';
        report += '-'.repeat(40) + '\n';
        report += `Violaciones WCAG: ${this.results.summary.total_violations}\n`;
        report += `  - Críticas: ${this.results.summary.critical || 0}\n`;
        report += `  - Serias: ${this.results.summary.serious || 0}\n`;
        report += `  - Moderadas: ${this.results.summary.moderate || 0}\n`;
        report += `  - Menores: ${this.results.summary.minor || 0}\n`;
        report += `Pruebas pasadas: ${this.results.summary.total_passes}\n\n`;

        // Violaciones
        if (this.results.violations.length > 0) {
            report += '-'.repeat(40) + '\n';
            report += 'VIOLACIONES WCAG\n';
            report += '-'.repeat(40) + '\n';
            for (const v of this.results.violations) {
                report += `\n[${v.impact.toUpperCase()}] ${v.id}\n`;
                report += `  Descripción: ${v.help}\n`;
                report += `  Elementos afectados: ${v.nodes_count}\n`;
                report += `  Más info: ${v.helpUrl}\n`;
            }
        }

        // Navegación teclado
        report += '\n' + '-'.repeat(40) + '\n';
        report += 'NAVEGACIÓN POR TECLADO\n';
        report += '-'.repeat(40) + '\n';
        const kb = this.results.keyboard_navigation;
        report += `Skip link funciona: ${kb.skip_link_works ? 'Sí' : 'No'}\n`;
        report += `Elementos enfocables: ${kb.focusable_elements}\n`;
        report += `Indicador de foco visible: ${kb.focus_visible ? 'Sí' : 'Verificar'}\n`;

        // Lector de pantalla
        report += '\n' + '-'.repeat(40) + '\n';
        report += 'COMPATIBILIDAD LECTOR DE PANTALLA\n';
        report += '-'.repeat(40) + '\n';
        const sr = this.results.screen_reader;
        report += `Atributo lang: ${sr.has_lang ? 'Sí' : 'No'}\n`;
        report += `Título de página: ${sr.has_title ? 'Sí' : 'No'}\n`;
        report += `Landmark main: ${sr.has_main_landmark ? 'Sí' : 'No'}\n`;
        report += `H1 único: ${sr.has_h1 ? 'Sí' : 'No'}\n`;
        report += `Regiones aria-live: ${sr.aria_live_regions}\n`;

        // Verificaciones manuales
        report += '\n' + '-'.repeat(40) + '\n';
        report += 'VERIFICACIONES MANUALES REQUERIDAS\n';
        report += '-'.repeat(40) + '\n';
        for (const category of this.results.manual_checks) {
            report += `\n${category.category}:\n`;
            for (const check of category.checks) {
                report += `  [ ] ${check}\n`;
            }
        }

        report += '\n' + '='.repeat(70) + '\n';
        report += 'FIN DEL REPORTE\n';
        report += '='.repeat(70) + '\n';

        return report;
    }

    generateMarkdownReport() {
        let md = '# Reporte de Accesibilidad\n\n';
        md += '## Sistema de Asistencia Visual para Personas con Discapacidad Visual\n\n';
        md += `**Fecha:** ${this.results.timestamp}\n\n`;
        md += `**URL:** ${this.results.url}\n\n`;

        // Resumen
        md += '## Resumen Ejecutivo\n\n';
        md += '| Métrica | Valor |\n';
        md += '|---------|-------|\n';
        md += `| Violaciones WCAG | ${this.results.summary.total_violations} |\n`;
        md += `| Pruebas Pasadas | ${this.results.summary.total_passes} |\n`;
        md += `| Críticas | ${this.results.summary.critical || 0} |\n`;
        md += `| Serias | ${this.results.summary.serious || 0} |\n`;
        md += `| Moderadas | ${this.results.summary.moderate || 0} |\n`;
        md += `| Menores | ${this.results.summary.minor || 0} |\n\n`;

        // Score de accesibilidad
        const totalChecks = this.results.summary.total_violations + this.results.summary.total_passes;
        const score = totalChecks > 0
            ? Math.round((this.results.summary.total_passes / totalChecks) * 100)
            : 100;
        md += `### Score de Accesibilidad: ${score}%\n\n`;

        // Violaciones
        if (this.results.violations.length > 0) {
            md += '## Violaciones WCAG Detectadas\n\n';
            md += '| Severidad | ID | Descripción | Elementos |\n';
            md += '|-----------|----|--------------|-----------|\n';
            for (const v of this.results.violations) {
                md += `| ${v.impact} | ${v.id} | ${v.help} | ${v.nodes_count} |\n`;
            }
            md += '\n';
        }

        // Navegación teclado
        md += '## Navegación por Teclado\n\n';
        const kb = this.results.keyboard_navigation;
        md += `- Skip link funciona: ${kb.skip_link_works ? '✅' : '❌'}\n`;
        md += `- Elementos enfocables: ${kb.focusable_elements}\n`;
        md += `- Indicador de foco visible: ${kb.focus_visible ? '✅' : '⚠️'}\n\n`;

        // Lector de pantalla
        md += '## Compatibilidad Lector de Pantalla\n\n';
        const sr = this.results.screen_reader;
        md += `- Atributo lang: ${sr.has_lang ? '✅' : '❌'}\n`;
        md += `- Título de página: ${sr.has_title ? '✅' : '❌'}\n`;
        md += `- Landmark main: ${sr.has_main_landmark ? '✅' : '❌'}\n`;
        md += `- H1 único: ${sr.has_h1 ? '✅' : '❌'}\n`;
        md += `- Regiones aria-live: ${sr.aria_live_regions}\n\n`;

        // Verificaciones manuales
        md += '## Checklist de Verificación Manual\n\n';
        for (const category of this.results.manual_checks) {
            md += `### ${category.category}\n\n`;
            for (const check of category.checks) {
                md += `- [ ] ${check}\n`;
            }
            md += '\n';
        }

        return md;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * Ejecuta todas las pruebas
     */
    async runAllTests() {
        try {
            await this.initialize();
            await this.runAxeTests();
            await this.runKeyboardTests();
            await this.runContrastTests();
            await this.runScreenReaderTests();
            this.generateManualChecks();
            await this.saveResults();

            // Resumen final
            console.log('\n' + '='.repeat(60));
            console.log('RESUMEN FINAL');
            console.log('='.repeat(60));

            const totalChecks = this.results.summary.total_violations + this.results.summary.total_passes;
            const score = totalChecks > 0
                ? Math.round((this.results.summary.total_passes / totalChecks) * 100)
                : 100;

            console.log(`\n  SCORE DE ACCESIBILIDAD: ${score}%\n`);

            if (this.results.summary.total_violations === 0) {
                console.log('  ✅ No se encontraron violaciones automáticas de WCAG');
            } else {
                console.log(`  ⚠️  Se encontraron ${this.results.summary.total_violations} violaciones`);
                console.log('     Revisa el reporte para más detalles');
            }

            console.log('\n  IMPORTANTE: Completa las verificaciones manuales');
            console.log('  listadas en el reporte para una evaluación completa.\n');

        } catch (error) {
            console.error('\nError durante las pruebas:', error.message);
        } finally {
            await this.cleanup();
        }
    }
}

// Ejecutar
const tester = new AccessibilityTester();
tester.runAllTests();
