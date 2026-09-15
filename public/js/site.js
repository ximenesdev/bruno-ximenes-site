// Comportamento geral do site: links de WhatsApp a partir do config e rolagem suave.
(function () {
  const cfg = window.BX;
  const html = document.documentElement;

  // Monta os links wa.me com a mensagem de cada botão (data-wa = chave em BX.MENSAGENS).
  document.querySelectorAll('[data-wa]').forEach((el) => {
    const msg = cfg.MENSAGENS[el.dataset.wa] || cfg.MENSAGENS.topo;
    el.href = 'https://wa.me/' + cfg.WHATSAPP + '?text=' + encodeURIComponent(msg);
    el.target = '_blank';
    el.rel = 'noopener';
  });

  // Rolagem suave só com mouse/trackpad e sem prefers-reduced-motion; no toque fica o nativo.
  const suave = matchMedia('(pointer: fine)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (suave && window.Lenis && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // Durante a intro a página não rola.
    if (html.classList.contains('intro-ativa')) {
      lenis.stop();
      document.addEventListener('bx:intro-fim', () => lenis.start(), { once: true });
    }
  }
})();
