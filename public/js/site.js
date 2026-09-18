// Comportamento geral do site: contato a partir do config, movimento ao rolar e rolagem suave.
(function () {
  const cfg = window.BX;
  const html = document.documentElement;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Contato (tudo vem de config.js) --------------------------------------

  // Links wa.me com a mensagem de cada botão (data-wa = chave em BX.MENSAGENS).
  // Com itens na comanda, todos levam a lista no lugar da mensagem padrão.
  const linksWa = document.querySelectorAll('[data-wa]');
  function ligarWhatsApp(mensagemComanda) {
    linksWa.forEach((el) => {
      const msg = mensagemComanda || cfg.MENSAGENS[el.dataset.wa] || cfg.MENSAGENS.topo;
      el.href = 'https://wa.me/' + cfg.WHATSAPP + '?text=' + encodeURIComponent(msg);
      el.target = '_blank';
      el.rel = 'noopener';
    });
  }
  ligarWhatsApp();

  // --- Comanda ---------------------------------------------------------------
  // "Quero…" marca o item no cartão. O botão fixo passa a mostrar o total e a
  // mensagem do WhatsApp já vai com a lista — a pessoa chama para fechar.

  const queros = Array.from(document.querySelectorAll('.cartao__quero'));
  const whatsRotulo = document.querySelector('#whats-fixo .whats-fixo__rotulo > span');
  const reais = (n) => 'R$ ' + n.toLocaleString('pt-BR');

  function atualizarComanda() {
    const marcados = queros.filter((b) => b.getAttribute('aria-pressed') === 'true');
    const whats = document.getElementById('whats-fixo');
    try { sessionStorage.setItem('bx-comanda', JSON.stringify(marcados.map((b) => b.dataset.item))); } catch (e) {}

    if (!marcados.length) {
      whats.classList.remove('whats-fixo--comanda');
      whatsRotulo.textContent = 'WhatsApp';
      ligarWhatsApp();
      return;
    }

    let unico = 0, mensal = 0;
    const itens = marcados.map((b) => {
      const valor = Number(b.dataset.valor);
      if ('mensal' in b.dataset) { mensal += valor; return b.dataset.item + ' (' + reais(valor) + '/mês)'; }
      unico += valor;
      if ('desde' in b.dataset) return b.dataset.item + ' (a partir de ' + reais(valor) + ')';
      return b.dataset.item + ' (' + reais(valor) + ')';
    });
    // No rótulo do botão o total vai curto ("R$ 897 + R$ 149/mês"); o "a partir
    // de" já está em cada item da mensagem.
    const partes = [];
    if (unico) partes.push(reais(unico));
    if (mensal) partes.push(reais(mensal) + '/mês');

    whats.classList.add('whats-fixo--comanda');
    whatsRotulo.textContent = 'Fechar · ' + partes.join(' + ');
    ligarWhatsApp(cfg.MENSAGENS.comanda.replace('{itens}', itens.join(' + ')));
  }

  queros.forEach((b) => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    atualizarComanda();
  }));

  // Recarregou a página no meio: a comanda continua.
  try {
    const salva = JSON.parse(sessionStorage.getItem('bx-comanda') || '[]');
    queros.forEach((b) => { if (salva.includes(b.dataset.item)) b.setAttribute('aria-pressed', 'true'); });
    if (salva.length) atualizarComanda();
  } catch (e) {}

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

  // html.anima vem do script do <head> (sem reduced-motion); sem quem anime, sai.
  const animar = window.gsap && window.ScrollTrigger && !reduz;
  if (animar) gsap.registerPlugin(ScrollTrigger);
  else html.classList.remove('anima');

  // Rolagem suave só com mouse/trackpad; no toque fica o nativo (e as âncoras
  // usam scroll-behavior do CSS). O offset das âncoras é a altura do cabeçalho.
  const topoAltura = parseFloat(getComputedStyle(html).getPropertyValue('--topo-altura')) || 0;
  let lenis = null;
  if (animar && window.Lenis && matchMedia('(pointer: fine)').matches) {
    lenis = new Lenis({ anchors: { offset: -topoAltura } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // Durante a intro a página não rola.
    if (html.classList.contains('intro-ativa')) {
      lenis.stop();
      document.addEventListener('bx:intro-fim', () => lenis.start(), { once: true });
    }
  }

  // --- Movimento ao rolar: uma gramática só ----------------------------------
  // Cada bloco sobe 28px enquanto aparece (0,9 s, power3.out), uma vez; os que
  // entram juntos vão em cascata de 0,1 s. "Como funciona" é o único trecho
  // ligado à posição da rolagem, e o único que anda nos dois sentidos.

  // Blocos que entram ao rolar, em ordem de documento. O hero entra com a
  // intro (intro.js); com × sem e as etapas têm coreografia própria, abaixo.
  const BLOCOS = [
    '#com-e-sem .secao__titulo', '.busca__titulo', '.busca__texto', '.tela', '#com-e-sem .secao__acao',
    '#servicos .secao__titulo', '.cartao',
    '.etapas__cabeca',
    '#trabalhos .secao__titulo', '.trabalho',
    '#mensalidades .secao__titulo', '#mensalidades .secao__texto', '#mensalidades .small',
    '#quem-faz .secao__titulo', '.quem__marca', '.quem__texto > *',
    '#atendimento > *',
  ].join(',');

  if (animar) {
    const blocos = gsap.utils.toArray(BLOCOS);
    const etapas = gsap.utils.toArray('.etapa');
    const textosEtapas = etapas.map((etapa) => Array.from(etapa.querySelectorAll('.etapa__corpo > *')));

    // Estado inicial já na carga, para nada piscar quando o fundo da intro sair.
    // Só opacidade (não autoAlpha): visibility:hidden tiraria os botões da
    // ordem do Tab. Se o foco chegar antes da rolagem, o bloco aparece na hora.
    gsap.set(blocos, { opacity: 0, y: 28 });
    gsap.set(textosEtapas.flat(), { opacity: 0, y: 24 });
    document.addEventListener('focusin', (e) => {
      const bloco = e.target.closest(BLOCOS);
      if (bloco) gsap.to(bloco, { opacity: 1, y: 0, duration: 0.3, overwrite: true });
    });

    // Os gatilhos nascem quando a página pode rolar: com a intro no ar, no
    // pouso — assim o que já está na primeira tela entra emendado com o hero.
    function ligar() {
      ScrollTrigger.batch(blocos, {
        start: 'top 85%',
        once: true,
        onEnter: (entrando) => {
          gsap.to(entrando, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, overwrite: true });
          // Cartões: o traço de cabeça se desenha (scaleX 0 → 1, no CSS) assim
          // que o cartão assenta; os que sobem juntos desenham em cascata.
          entrando.forEach((bloco, i) => {
            if (!bloco.classList.contains('cartao')) return;
            bloco.style.setProperty('--atraso', (0.25 + i * 0.1) + 's'); // o ::before lê a variável
            bloco.classList.add('cartao--visto');
          });
        },
      });

      // Como funciona. A trilha se desenha entre o primeiro e o último marcador
      // acompanhando a rolagem (scrub, via Lenis quando ele existe): chega em
      // cada marcador no instante em que a etapa acende. Uma etapa acende quando
      // o topo dela cruza 60% da tela e apaga se a pessoa volta: marcador cheio
      // e ícone com tinta ficam nas etapas já alcançadas (.etapa--ativa), o
      // número em destaque é só o da etapa atual (.etapa--atual) — ganha e perde
      // — e o texto sobe em cascata, e desce de volta. O rótulo "Etapa n de 3"
      // e a barra acompanham.
      const linha = document.querySelector('.etapas__linha');
      const etapaAtual = document.getElementById('etapa-atual');
      const etapaBarra = document.getElementById('etapa-barra');
      // Centro do marcador de uma etapa ao longo da linha, de 0 a 1. Medido a
      // cada refresh (invalidateOnRefresh): muda com a largura e com as fontes.
      const noMarcador = (etapa) => {
        const l = linha.getBoundingClientRect();
        const m = etapa.querySelector('.etapa__marcador').getBoundingClientRect();
        return (m.top + m.height / 2 - l.top) / l.height;
      };
      const primeira = etapas[0];
      const ultima = etapas[etapas.length - 1];
      // Como atributo, não CSS: o CSSPlugin arredonda px para inteiro e a
      // linha desenharia de uma vez.
      gsap.fromTo('#etapa-linha', { attr: { 'stroke-dashoffset': () => 1 - noMarcador(primeira) } }, {
        attr: { 'stroke-dashoffset': () => 1 - noMarcador(ultima) },
        ease: 'none',
        scrollTrigger: { trigger: primeira, start: 'top 60%', endTrigger: ultima, end: 'top 60%', scrub: 0.4, invalidateOnRefresh: true },
      });

      function irPara(n) { // n = índice da etapa atual; -1 = nenhuma alcançada
        etapas.forEach((etapa, i) => {
          etapa.classList.toggle('etapa--ativa', i <= n);
          etapa.classList.toggle('etapa--atual', i === n);
        });
        const rotulo = Math.max(1, n + 1);
        etapaAtual.textContent = rotulo;
        etapaBarra.style.transform = 'scaleX(' + (rotulo / etapas.length) + ')';
      }
      etapas.forEach((etapa, i) => {
        gsap.to(textosEtapas[i], {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: etapa,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
            onEnter: () => irPara(i),
            onLeaveBack: () => irPara(i - 1),
          },
        });
      });

      // Conversa (a prova, em #com-e-sem): um balão, depois o outro — como uma
      // conversa de verdade — quando a figura entra na tela. Uma vez só.
      gsap.from('.conversa__balao', {
        opacity: 0,
        y: 10,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.7,
        scrollTrigger: { trigger: '.comparativo__conversa', start: 'top 80%', once: true },
      });

      // Com × sem: os itens entram em cascata alternada (esquerda, direita,
      // esquerda…) quando as colunas estão lado a lado; empilhadas, cada coluna
      // entra na sua vez, na ordem de leitura. Uma vez só.
      const comparativo = document.getElementById('com-e-sem');
      const colunas = comparativo.querySelectorAll('.comparativo__coluna');
      const ladoALado = getComputedStyle(comparativo.querySelector('.comparativo__colunas')).gridTemplateColumns.split(' ').length > 1;
      const entrar = (alvos, gatilho) => gsap.from(alvos, {
        opacity: 0,
        y: 14,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: { trigger: gatilho, start: 'top 80%', once: true },
      });
      if (ladoALado) {
        const [esq, dir] = Array.from(colunas, (c) => Array.from(c.querySelectorAll('.comparativo__rotulo, li')));
        entrar(esq.flatMap((el, i) => [el, dir[i]]), comparativo);
      } else {
        colunas.forEach((coluna) => entrar(coluna.querySelectorAll('.comparativo__rotulo, li'), coluna));
      }
    }

    if (html.classList.contains('intro-ativa')) document.addEventListener('bx:intro-fim', ligar, { once: true });
    else ligar();
    // Fontes chegando depois mudam as medidas.
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  // --- Cabeçalho, scrollspy e WhatsApp fixo: um leitor de rolagem só ----------
  // Ligado ao Lenis quando ele existe (um evento por quadro); senão, ao scroll
  // nativo. Tudo coalescido num rAF e sem animação fora de transform/opacity.

  const topo = document.getElementById('topo');
  const nav = document.getElementById('nav');
  const indicador = nav.querySelector('.nav__indicador');
  const itens = Array.from(nav.querySelectorAll('.nav__item'));
  const itemPorSecao = new Map(itens.map((a) => [a.hash.slice(1), a]));
  const secoes = Array.from(document.querySelectorAll('.secao'));
  const hero = document.querySelector('.hero');
  const whats = document.getElementById('whats-fixo');
  let itemAtivo = null;
  let whatsEntrou = false;

  // FLIP do indicador: mede onde o item ativo está e anima só a transformação.
  function posicionarIndicador() {
    if (!itemAtivo) {
      indicador.style.transform = 'scaleX(0)';
      return;
    }
    indicador.style.transform = 'translateX(' + itemAtivo.offsetLeft + 'px) scaleX(' + itemAtivo.offsetWidth + ')';
    // No mobile a barra rola sozinha até deixar o item ativo à vista.
    if (nav.scrollWidth > nav.clientWidth) {
      const alvo = itemAtivo.offsetLeft - (nav.clientWidth - itemAtivo.offsetWidth) / 2;
      nav.scrollTo({ left: alvo, behavior: reduz ? 'auto' : 'smooth' });
    }
  }

  function marcar(item) {
    if (item === itemAtivo) return;
    if (itemAtivo) itemAtivo.removeAttribute('aria-current');
    itemAtivo = item;
    if (itemAtivo) itemAtivo.setAttribute('aria-current', 'true');
    posicionarIndicador();
  }

  function ler() {
    // Cabeçalho materializa fora do topo.
    topo.classList.toggle('topo--fixo', scrollY > 4);

    // Seção "em leitura": a última cujo topo já passou de 35% da tela. Seções fora
    // da navegação (hero, quem faz) contam, e nelas nenhum item fica marcado.
    const linha = innerHeight * 0.35;
    let atual = null;
    for (const secao of secoes) {
      if (secao.getBoundingClientRect().top <= linha) atual = secao;
    }
    marcar(atual ? itemPorSecao.get(atual.id) || null : null);

    // WhatsApp fixo: entra uma vez quando o hero sai da tela, se apresenta com o
    // rótulo aberto por 2,4 s e recolhe ao glifo.
    if (!whatsEntrou && hero.getBoundingClientRect().bottom < 0) {
      whatsEntrou = true;
      whats.classList.add('whats-fixo--visivel', 'whats-fixo--apresenta');
      setTimeout(() => whats.classList.remove('whats-fixo--apresenta'), 2400);
    }
  }

  let agendado = false;
  function aoRolar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; ler(); });
  }

  if (lenis) lenis.on('scroll', aoRolar);
  else addEventListener('scroll', aoRolar, { passive: true });
  addEventListener('resize', () => { posicionarIndicador(); aoRolar(); });
  document.addEventListener('bx:intro-fim', aoRolar, { once: true });

  // Com reduced-motion o botão fixo não tem entrada: já nasce visível.
  if (reduz) {
    whatsEntrou = true;
    whats.classList.add('whats-fixo--visivel');
  }
  ler();
})();
