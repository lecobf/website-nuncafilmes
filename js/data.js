// Lista de trabalhos reais (links do Vimeo) fornecida por Leco em 2026-07-04.
// Título e thumbnail sao buscados em tempo real na API publica do Vimeo (oEmbed) em script.js.
// Ficha tecnica completa (direcao, produtora, ano) ainda nao foi fornecida -
// por isso cada item so carrega o credito fixo "Direcao de Fotografia: Leco Petersen".
const WORKS = [
  // Filmes
  { category: "filmes", vimeoId: "680273904" },
  { category: "filmes", vimeoId: "1067560498" },
  { category: "filmes", vimeoId: "990329163" },
  { category: "filmes", vimeoId: "832149427" },
  { category: "filmes", vimeoId: "190842366" },
  { category: "filmes", vimeoId: "394093941" },
  { category: "filmes", vimeoId: "235338140" },
  { category: "filmes", vimeoId: "287115398" },
  { category: "filmes", vimeoId: "360128893" },

  // Videoclipes
  { category: "videoclipes", vimeoId: "350541152" },
  { category: "videoclipes", vimeoId: "435982419" },
  { category: "videoclipes", vimeoId: "317488249" },
  { category: "videoclipes", vimeoId: "442560818" },
  { category: "videoclipes", vimeoId: "340451840" },
  { category: "videoclipes", vimeoId: "433705942" },
  { category: "videoclipes", vimeoId: "226090406" },
  { category: "videoclipes", vimeoId: "216340985" },
  { category: "videoclipes", vimeoId: "190812782" },

  // Pessoais
  { category: "pessoais", vimeoId: "357388537" },
  { category: "pessoais", vimeoId: "332357543" },

  // Corporativos: nenhum link fornecido ainda.
];

const HERO_YOUTUBE_ID = "nrDqX3kzIYQ";

const SOBRE_TEXTO = "Leonardo “Leco” Petersen é diretor de fotografia atuando no audiovisual desde 2015. Cineasta gaúcho e sócio fundador da Nunca Filmes, trabalhou na direção de fotografia e montagem de curtas, documentários, videoclipes e webséries, além de projetos corporativos. Entre seus destaques estão o prêmio de Melhor Fotografia no Festival CineSul pelo curta Ferrolho e a seleção do videoclipe Desaguou para o Latin American Film Festival. Também atua na formação audiovisual, ministrando oficinas e participando de iniciativas culturais e cineclubistas em Porto Alegre.";
