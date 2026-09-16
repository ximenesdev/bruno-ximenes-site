// Comportamento geral do site: contato a partir do config, reveal por seção e rolagem suave.
(function () {
  const cfg = window.BX;
  const html = document.documentElement;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Contato (tudo vem de config.js) --------------------------------------

  // Links wa.me com a mensagem de cada botão (data-wa = chave em BX.MENSAGENS).
  document.querySelectorAll('[data-wa]').forEach((el) => {
    const msg = cfg.MENSAGENS[el.dataset.wa] || cfg.MENSAGENS.topo;
    el.href = 'https://wa.me/' + cfg.WHATSAPP + '?text=' + encodeURIComponent(msg);
    el.target = '_blank';
    el.rel = 'noopener';
  });

  document.querySelectorAll('[data-cfg="email"]').forEach((el) => {
    el.textContent = cfg.EMAIL;
    el.href = 'mailto:' + cfg.EMAIL;
  });

  document.querySelectorAll('[data-cfg="github"], [data-cfg="github-url"]').forEach((el) => {
    el.textContent = el.dataset.cfg === 'github-url' ? 'github.com/' + cfg.GITHUB : cfg.GITHUB;
    el.href = 'https://github.com/' + cfg.GITHUB;
    el.target = '_blank';
    el.rel = 'noopener';
  });

  // Número formatado no rodapé — só aparece quando o WHATSAPP estiver preenchido.
  // "5561999999999" → "(61) 99999-9999"
  const numero = cfg.WHATSAPP.replace(/\D/g, '');
  if (numero.length >= 12) {
    const ddd = numero.slice(2, 4);
    const local = numero.slice(4);
    const corte = local.length - 4;
    document.querySelectorAll('[data-cfg="whatsapp"]').forEach((el) => {
      el.textContent = '(' + ddd + ') ' + local.slice(0, corte) + '-' + local.slice(corte);
    });
    document.querySelectorAll('[data-cfg="whatsapp-linha"]').forEach((el) => { el.hidden = false; });
  }

  // --- Movimento fora da intro: uma regra só ---------------------------------

  const animar = window.gsap && window.ScrollTrigger && !reduz;
  if (animar) gsap.registerPlugin(ScrollTrigger);

  // Reveal discreto por seção: opacidade + 12px, uma vez. O hero não entra;
  // "Como funciona" tem o próprio reveal, em cascata (abaixo).
  if (animar) {
    document.querySelectorAll('.secao:not(.hero):not(#como-funciona)').forEach((secao) => {
      gsap.from(secao, {
        autoAlpha: 0,
        y: 12,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: secao, start: 'top 85%', once: true },
      });
    });

    // Níveis 1/2/3: mesma técnica do Reveal do portfólio — título e passos
    // sobem 26px em cascata (stagger 0.1), uma vez, ao entrar na viewport.
    const passos = document.getElementById('como-funciona');
    gsap.from(passos.querySelectorAll('.secao__titulo, .passo'), {
      opacity: 0,
      y: 26,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: { trigger: passos, start: 'top 85%', once: true },
    });
    // A intro trava a rolagem; quando ela acaba, as medidas mudam.
    document.addEventListener('bx:intro-fim', () => ScrollTrigger.refresh(), { once: true });
  }

  // Rolagem suave só com mouse/trackpad; no toque fica o nativo.
  if (animar && window.Lenis && matchMedia('(pointer: fine)').matches) {
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
