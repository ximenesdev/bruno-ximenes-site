// Tudo que muda fica aqui. Nenhum destes valores aparece solto em outro arquivo.
window.BX = Object.freeze({
  // Número do WhatsApp: só dígitos, com o 55 do Brasil na frente. Ex.: "5561999999999".
  WHATSAPP: "55", // preencher

  EMAIL: "brunoxmns7@gmail.com",
  GITHUB: "ximenesdev",

  // Mensagens pré-preenchidas do WhatsApp (seção 9 do doc).
  // A chave é o valor do atributo data-wa de cada botão.
  MENSAGENS: Object.freeze({
    topo: "Oi Bruno, vi seu site e quero saber o que está faltando no meu negócio.",
    google: "Oi Bruno, quero o Perfil no Google completo. Meu negócio é: ",
    sistema: "Oi Bruno, quero conversar sobre um sistema. Meu negócio é: ",
    site: "Oi Bruno, quero um site para o meu negócio. Ele é: ",
  }),
});
