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

  // --- Tema claro/escuro -----------------------------------------------------
  // A decisão inicial já foi tomada no <head>; aqui só a troca pelo botão.

  const botaoTema = document.getElementById('tema');
  const metasCor = document.querySelectorAll('meta[name="theme-color"]');

  function aplicarTema(escuro) {
    html.classList.toggle('tema-escuro', escuro);
    botaoTema.setAttribute('aria-label', escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro');
    const papel = getComputedStyle(html).getPropertyValue('--papel').trim();
    metasCor.forEach((meta) => { meta.content = papel; });
  }

  botaoTema.addEventListener('click', () => {
    const escuro = !html.classList.contains('tema-escuro');
    try { localStorage.setItem('bx-tema', escuro ? 'escuro' : 'claro'); } catch (e) {}

    // Sem View Transitions no navegador, ou com reduced-motion: troca seca.
    if (reduz || typeof document.startViewTransition !== 'function') {
      aplicarTema(escuro);
      return;
    }

    // O tema novo entra como um círculo que cresce a partir do botão até cobrir
    // o canto mais distante da tela — o site "vira ao contrário" a partir dali.
    const r = botaoTema.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const ease = getComputedStyle(html).getPropertyValue('--ease').trim() || 'ease';
    const transicao = document.startViewTransition(() => aplicarTema(escuro));
    transicao.ready.then(() => {
      html.animate(
        { clipPath: ['circle(0 at ' + x + 'px ' + y + 'px)', 'circle(' + raio + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 600, easing: ease, pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {}); // se a transição for pulada, o tema já foi aplicado
  });

  // Sem escolha salva, acompanha o sistema se ele mudar com a página aberta.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    try { if (localStorage.getItem('bx-tema')) return; } catch (err) {}
    aplicarTema(e.matches);
  });
  aplicarTema(html.classList.contains('tema-escuro'));

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
