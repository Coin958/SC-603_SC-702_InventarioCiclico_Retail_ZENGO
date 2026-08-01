// ═══════════════════════════════════════════════════════════════
// ZENGO - Calculadora de Precisión de Cíclicos
// Única fuente de verdad para la fórmula de precisión. Antes vivía
// duplicada en AuxiliarView (KPI en vivo) y JefeView (score oficial
// que se persiste en estadisticas_auxiliares) con criterios que
// habían divergido entre sí (pesos y hasta la fórmula de "neta")
// sin que fuera una decisión de negocio explícita.
// ═══════════════════════════════════════════════════════════════

const PrecisionCalculator = {
    // Peso de cada componente en el score final. El valor que ya estaba
    // persistiéndose en estadisticas_auxiliares (JefeView) usaba 50/50 —
    // se deja aquí como el único lugar donde cambiarlo si el negocio
    // decide otro criterio.
    PESO_ABSOLUTA: 0.5,
    PESO_NETA: 0.5,

    // Precisión Absoluta y Neta de UN cíclico (no acumulado histórico).
    //   PA (absoluta): penaliza cualquier diferencia, sobrante o faltante.
    //   PN (neta):     solo penaliza faltantes (merma real) — un sobrante
    //                  en un producto NO compensa el faltante de otro,
    //                  cada producto se evalúa por separado.
    calcularCiclo(productos) {
        let totalExist = 0, totalDiff = 0, totalFalt = 0;

        (productos || []).forEach(p => {
            if (p.conteos && p.conteos.length > 0) {
                const exist = p.existencia || 0;
                const dif = (p.total || 0) - exist;
                totalExist += exist;
                totalDiff += Math.abs(dif);
                if (dif < 0) totalFalt += Math.abs(dif);
            }
        });

        const pa = totalExist > 0 ? Math.max(0, (1 - totalDiff / totalExist) * 100) : 100;
        const pn = totalExist > 0 ? Math.max(0, (1 - totalFalt / totalExist) * 100) : 100;

        return {
            absoluta: Math.round(pa * 10) / 10,
            neta: Math.round(pn * 10) / 10,
            score: Math.round(this.calcularScore(pa, pn) * 10) / 10
        };
    },

    // Combina PA y PN en un solo score. Se usa igual para el KPI en vivo
    // de un cíclico que para el promedio histórico acumulado (recibiendo
    // en ese caso los promedios en vez de los valores de un solo ciclo).
    calcularScore(pa, pn) {
        return pa * this.PESO_ABSOLUTA + pn * this.PESO_NETA;
    }
};

window.PrecisionCalculator = PrecisionCalculator;
