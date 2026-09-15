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
    const traco = intro.querySelector('.intro__traco');
    const clipB = document.getElementById('clip-b-rect');
    const clipX = document.getElementById('clip-x-rect');
    const alvoMonograma = document.getElementById('topo-monograma');
    const alvoNome = document.getElementById('topo-nome');

    const trackingFinal = getComputedStyle(html).getPropertyValue('--tracking-marca').trim() || '0.18em';
    let voando = false;

    // O conjunto começa 2% maior e assenta depois que o X trava no B.
    gsap.set(svg, { scale: 1.02, transformOrigin: '50% 50%' });

    // Coreografia (posições em segundos, absolutas na timeline):
    //   0,00–0,65  B impresso de cima para baixo
    //   0,55–1,05  X entra pela perna grossa, de baixo-direita para cima-esquerda
    //   1,05–1,30  assentamento (scale 1.02 → 1)
    //   1,30–1,60  traço de 2px se desenha da esquerda para a direita sob o monograma
    //   1,60–1,90  o traço sai pela direita (sublinhado momentâneo)
    //   1,60–2,05  "BRUNO XIMENES" com o tracking fechando (0.6em → final)
    //   2,05–2,50  pausa
    //   2,50–3,10  voo (FLIP) até o cabeçalho
    const tl = gsap.timeline({ onComplete: () => voar(0.6) });
    tl.to(clipB, { attr: { height: 72 }, duration: 0.65, ease: 'expo.out' }, 0)
      .to(clipX, { attr: { x: -47, width: 94 }, duration: 0.5, ease: 'power3.out' }, 0.55)
      .to(svg, { scale: 1, duration: 0.25, ease: 'power2.out' }, 1.05)
      .to(traco, { scaleX: 1, duration: 0.3, ease: 'power2.out' }, 1.3)
      .set(traco, { transformOrigin: 'right center' }, 1.6)
      .to(traco, { scaleX: 0, duration: 0.3, ease: 'power2.in' }, 1.6)
      .set(nome, { visibility: 'visible' }, 1.6)
      .to(nome, { letterSpacing: trackingFinal, duration: 0.45, ease: 'expo.out' }, 1.6)
      .to({}, { duration: 0.45 }, 2.05); // segura a pausa antes do voo

    // Clique, toque ou tecla: vai direto ao voo, mais curto, a partir do estado final.
    function pular() {
      if (voando) return;
      tl.pause().progress(1, true);
      voar(0.3);
    }
    window.addEventListener('pointerdown', pular);
    window.addEventListener('keydown', pular);

    // FLIP manual: mede onde a marca está e onde deve pousar, e anima a diferença.
    function voar(duracao) {
      if (voando) return;
      voando = true;
      tl.kill();
      window.removeEventListener('pointerdown', pular);
      window.removeEventListener('keydown', pular);

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
      html.classList.remove('intro-ativa');
      intro.remove();
      document.dispatchEvent(new CustomEvent('bx:intro-fim'));
    }

    // Rede de segurança: aconteça o que acontecer, o site aparece.
    setTimeout(() => { if (intro.isConnected) pousar(); }, 5000);
  }
})();
