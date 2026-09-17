// Tudo que muda fica aqui. Nenhum destes valores aparece solto em outro arquivo.
window.BX = Object.freeze({
  // Número do WhatsApp: só dígitos, com o 55 do Brasil na frente. Ex.: "5561999999999".
  WHATSAPP: "5561986110999",

  EMAIL: "brunoximenes71@gmail.com",
  GITHUB: "ximenesdev",

  // Mensagens pré-preenchidas do WhatsApp. A chave é o valor do atributo
  // data-wa de cada botão; "comanda" substitui todas quando há itens marcados
  // ({itens} vira a lista, ex.: "Site da empresa (a partir de R$ 897)").
  MENSAGENS: Object.freeze({
    topo: "Oi Bruno, vi seu site e quero saber o que está faltando no meu negócio.",
    comanda: "Oi Bruno, quero fechar: {itens}. Meu negócio é: ",
  }),
});
