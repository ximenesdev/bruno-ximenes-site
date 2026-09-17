// Intro da marca — a única parte "de efeito" do site.
// Só roda quando o script do <head> pôs html.intro-ativa (primeira abertura da
// sessão, sem prefers-reduced-motion). O HTML do site já está renderizado por baixo.
(function () {
  const html = document.documentElement;
  const intro = document.getElementById('intro');
  if (!intro) return;

  // Sem intro (sessão repetida, reduced-motion ou GSAP ausente): tira o overlay e pronto.
  if (!html.classList.contains('intro-ativa') || !window.gsap) {
    html.classList.remove('intro-ativa');
    intro.remove();
    return;
  }

  // Aba aberta em segundo plano (link do WhatsApp, por exemplo): o rAF não roda
  // e a intro ficaria parada. Espera a aba ficar visível para começar.
  if (document.visibilityState === 'hidden') {
    document.addEventListener('visibilitychange', comecar, { once: true });
  } else {
    comecar();
  }

  function comecar() {
    try { sessionStorage.setItem('bx-intro', '1'); } catch (e) {}
    window.scrollTo(0, 0);

    const fundo = intro.querySelector('.intro__fundo');
    const monograma = document.getElementById('intro-monograma');
    const svg = monograma.querySelector('svg');
    const nome = document.getElementById('intro-nome');
    const contornos = svg.querySelectorAll('.intro__contorno');
    const pingos = svg.querySelector('.intro__pingos');
    const clipTinta = document.getElementById('clip-tinta-rect');
    const clipTraco = document.getElementById('clip-traco-rect');
    const alvoMonograma = document.getElementById('topo-monograma');
    const alvoNome = document.getElementById('topo-nome');
    // Primeira dobra: entra encadeada com o voo (ver voar()).
    const dobra = {
      titulo: document.querySelector('.hero__titulo'),
      texto: document.querySelector('.hero__texto'),
      acao: document.querySelector('.hero__acao'),
      cabecalho: [document.getElementById('nav'), document.querySelector('.topo__acoes')],
    };
    let entrada = null;

    const trackingFinal = getComputedStyle(html).getPropertyValue('--tracking-marca').trim() || '0.08em';
    let voando = false;

    // O conjunto começa 2% maior e assenta quando a tinta entra. Os pingos nascem
    // dentro da forma e só podem aparecer depois que a tinta os cobre.
    gsap.set(svg, { scale: 1.02, transformOrigin: '50% 50%' });
    gsap.set(pingos, { opacity: 0 });

    // Velocidade do marcador em unidades do viewBox por segundo. As retas (contorno
    // do B e X) correm; os laços fechados do B vão devagar — a diferença é para
    // ser percebida. Cada contorno começa escondido por um dash do seu comprimento
    // deslocado para antes do início (a folga de 6 u tira a ponta redonda que
    // sobraria no ponto de partida) e aparece conforme o offset zera, sem easing:
    // a velocidade dentro de cada contorno é constante, como a mão no papel.
    const VELOCIDADE = { reta: 780, laco: 350 };
    const LEVANTA = 0.05; // a caneta levanta entre um contorno e o outro

    // Coreografia (posições em segundos, absolutas na timeline). Total ≈ 3,65 s.
    //   0,10–0,55  contorno do B (350 u)
    //   0,60–0,78  laço de cima (60 u)
    //   0,83–1,07  laço de baixo (81 u)
    //   1,12–1,67  X (426 u)
    //   1,72–2,07  tinta desce e cobre o traço; o conjunto assenta (1.02 → 1)
    //   2,02–2,58  pingos escorrem e param, 80 ms entre um e outro
    //   2,07–2,57  "BRUNO XIMENES" com o tracking fechando (0.6em → final)
    //   2,50–2,75  pingos secam (somem): o logo em repouso é o mesmo do cabeçalho
    //   2,75–3,00  pausa
    //   3,00–3,65  voo (FLIP) até o cabeçalho; a primeira dobra entra a partir de 3,27
    const tl = gsap.timeline({ onComplete: () => voar(0.65) });
    let t = 0.1;
    contornos.forEach((contorno) => {
      const comprimento = contorno.getTotalLength();
      const duracao = (comprimento + 6) / VELOCIDADE[contorno.dataset.veloc];
      gsap.set(contorno, { strokeDasharray: comprimento + 4, strokeDashoffset: comprimento + 6 });
      tl.to(contorno, { strokeDashoffset: 0, duration: duracao, ease: 'none' }, t);
      t += duracao + LEVANTA;
    });

    const tinta = t;
    tl.to(clipTinta, { attr: { height: 116 }, duration: 0.35, ease: 'power2.out' }, tinta)
      .to(clipTraco, { attr: { y: 108 }, duration: 0.35, ease: 'power2.out' }, tinta)
      .to(svg, { scale: 1, duration: 0.3, ease: 'power2.out' }, tinta);

    // Cada pingo escorre data-queda unidades para baixo e para. Só ficam visíveis
    // quando a tinta já desceu até o pé das letras, e secam antes do repouso: o
    // logo que fica parado (e voa) é exatamente o do cabeçalho, sem pingo.
    const pinga = tinta + 0.3;
    tl.set(pingos, { opacity: 1 }, pinga);
    pingos.querySelectorAll('.intro__pingo').forEach((pingo, i) => {
      const linha = pingo.querySelector('line');
      const fim = linha.y1.baseVal.value + Number(pingo.dataset.queda);
      tl.to(linha, { attr: { y2: fim }, duration: 0.4, ease: 'power3.out' }, pinga + i * 0.08)
        .to(pingo.querySelector('circle'), { attr: { cy: fim }, duration: 0.4, ease: 'power3.out' }, '<');
    });
    tl.to(pingos, { opacity: 0, duration: 0.25, ease: 'power2.out' }, pinga + 0.48);

    const nomeEntra = tinta + 0.35;
    tl.set(nome, { visibility: 'visible' }, nomeEntra)
      .to(nome, { letterSpacing: trackingFinal, duration: 0.5, ease: 'expo.out' }, nomeEntra)
      .to({}, { duration: 0.43 }, nomeEntra + 0.5); // segura a pausa antes do voo

    // Pular: botão (visível desde o primeiro quadro; é o primeiro foco do Tab),
    // toque em qualquer lugar ou Enter/Espaço/Esc. Vai direto ao voo, mais
    // curto, a partir do estado final.
    const botaoPular = intro.querySelector('.intro__pular');
    function pular() {
      if (voando) return;
      tl.pause().progress(1, true);
      voar(0.3);
    }
    function pularPorTecla(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); pular(); }
    }
    botaoPular.addEventListener('click', pular);
    window.addEventListener('pointerdown', pular);
    window.addEventListener('keydown', pularPorTecla);

    // FLIP manual: mede onde a marca está e onde deve pousar, e anima a diferença.
    function voar(duracao) {
      if (voando) return;
      voando = true;
      tl.kill();
      botaoPular.remove(); // o botão não voa junto

      const voo = gsap.timeline({ onComplete: pousar });
      voo.to(monograma, flip(monograma, alvoMonograma, duracao), 0);

      // No desktop o nome pousa no nome do cabeçalho; no mobile (sem nome lá) ele sai.
      // O nome parte um pouco depois e chega junto, para não cruzar com o monograma no fim.
      if (getComputedStyle(alvoNome).display !== 'none') {
        const atraso = duracao * 0.13;
        voo.to(nome, flip(nome, alvoNome, duracao - atraso), atraso);
      } else {
        voo.to(nome, { opacity: 0, duration: duracao * 0.4, ease: 'power2.in' }, 0);
      }

      // O fundo branco some na segunda metade do voo, revelando o site por baixo.
      voo.to(fundo, { opacity: 0, duration: duracao * 0.58, ease: 'power2.inOut' }, duracao * 0.42);

      // Primeira dobra: some agora — a primeira pintura já passou (o LCP está
      // contado) e o fundo ainda cobre tudo — e entra enquanto o fundo se
      // dissolve. Título, texto e botão sobem em sequência; navegação e ações do
      // cabeçalho aparecem com o monograma pousando. A entrada continua depois
      // do pouso: o fim da intro e o começo do site são um movimento só.
      entrada = gsap.timeline({ delay: duracao * 0.42 });
      entrada.fromTo(dobra.titulo, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, 0)
        .fromTo(dobra.texto, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power4.out' }, 0.12)
        .fromTo(dobra.acao, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }, 0.24)
        .fromTo(dobra.cabecalho, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, duracao * 0.2);
    }

    function flip(de, para, duracao) {
      const a = de.getBoundingClientRect();
      const b = para.getBoundingClientRect();
      return {
        x: b.left - a.left,
        y: b.top - a.top,
        scale: b.width / a.width,
        transformOrigin: '0 0',
        duration: duracao,
        ease: 'power3.inOut',
      };
    }

    // Ao pousar: no mesmo quadro, some a intro e aparece a marca do cabeçalho.
    function pousar() {
      if (!intro.isConnected) return; // a rede de segurança já pousou
      voando = true; // e nenhum voo começa depois do pouso
      tl.kill();
      window.removeEventListener('pointerdown', pular);
      window.removeEventListener('keydown', pularPorTecla);
      html.classList.remove('intro-ativa');
      intro.remove();
      document.dispatchEvent(new CustomEvent('bx:intro-fim'));
    }

    // Rede de segurança: aconteça o que acontecer (aba escondida no meio, por
    // exemplo), o site aparece — inteiro, com a primeira dobra no lugar.
    setTimeout(() => {
      if (!intro.isConnected) return;
      if (entrada) entrada.progress(1);
      pousar();
    }, 5000);
  }
})();
