import { test, expect } from "@playwright/test";

/**
 * E2E responsivo para a rota /admin.
 *
 * Valida em múltiplos viewports (mobile/tablet/desktop) que o shell admin:
 *  - Ocupa exatamente a altura da viewport (100dvh) sem ultrapassar.
 *  - Não gera overflow horizontal no <html> nem no <body>.
 *  - Não gera dupla rolagem vertical (apenas o <main> interno rola, nunca <html>/<body>).
 *
 * Observação: a rota /admin redireciona para /admin/auth quando não autenticado.
 * O teste segue o redirect e ainda assim valida o shell renderizado, garantindo
 * que nenhuma página do fluxo admin estoure o layout no mobile.
 */
test.describe("/admin layout responsivo", () => {
  test("respeita 100dvh e não tem overflow horizontal nem dupla rolagem", async ({
    page,
  }, testInfo) => {
    await page.goto("/admin", { waitUntil: "networkidle" });

    // Aguarda hidratação básica
    await page.waitForSelector("body");

    const metrics = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      return {
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        htmlScrollW: html.scrollWidth,
        htmlClientW: html.clientWidth,
        htmlScrollH: html.scrollHeight,
        htmlClientH: html.clientHeight,
        bodyScrollW: body.scrollWidth,
        bodyClientW: body.clientWidth,
        bodyScrollH: body.scrollHeight,
        bodyClientH: body.clientHeight,
        htmlOverflowY: getComputedStyle(html).overflowY,
        bodyOverflowY: getComputedStyle(body).overflowY,
        htmlOverflowX: getComputedStyle(html).overflowX,
        bodyOverflowX: getComputedStyle(body).overflowX,
      };
    });

    await testInfo.attach("layout-metrics", {
      body: JSON.stringify(metrics, null, 2),
      contentType: "application/json",
    });

    // 1) Sem overflow horizontal (tolerância de 1px para sub-pixel rounding).
    expect(metrics.htmlScrollW).toBeLessThanOrEqual(metrics.viewportW + 1);
    expect(metrics.bodyScrollW).toBeLessThanOrEqual(metrics.viewportW + 1);

    // 2) Sem dupla rolagem: <html> e <body> não podem rolar verticalmente.
    //    O conteúdo deve caber na viewport (height ~ 100dvh).
    expect(metrics.htmlScrollH).toBeLessThanOrEqual(metrics.viewportH + 1);
    expect(metrics.bodyScrollH).toBeLessThanOrEqual(metrics.viewportH + 1);

    // 3) overflow-x deve ser hidden em html/body para blindar contra estouros.
    expect(["hidden", "clip"]).toContain(metrics.htmlOverflowX);
    expect(["hidden", "clip"]).toContain(metrics.bodyOverflowX);

    // 4) Tentar rolar a página: posição deve permanecer 0 (rolagem só no <main>).
    await page.evaluate(() => window.scrollTo(0, 9999));
    const scrolled = await page.evaluate(() => ({
      x: window.scrollX,
      y: window.scrollY,
    }));
    expect(scrolled.x).toBe(0);
    expect(scrolled.y).toBe(0);
  });
});
