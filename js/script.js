// Carrega trabalhos e configuracoes de content/*.json no GitHub (editados via
// CMS), detecta a plataforma de cada video (YouTube ou Vimeo), controla
// filtro de categorias, paginacao "ver mais" e a reproducao em tela cheia no
// lugar do reel de abertura.

const REPO_RAW_BASE = "https://raw.githubusercontent.com/lecobf/website-nuncafilmes/master";
const CONTEUDO_BASE = `${REPO_RAW_BASE}/content`;
const HERO_FALLBACK = {
  heroPlataforma: "youtube",
  heroUrl: "https://www.youtube.com/watch?v=nrDqX3kzIYQ",
};

// Imagens enviadas pelo CMS ficam salvas no repositorio (ex: "/assets/foo.jpg"),
// entao precisam ser buscadas do GitHub, igual ao restante do conteudo.
function resolverThumbnail(caminho) {
  if (!caminho) return "";
  if (/^https?:\/\//.test(caminho)) return caminho;
  return `${REPO_RAW_BASE}${caminho.startsWith("/") ? "" : "/"}${caminho}`;
}

const PAGINA_TAMANHO = 6;

let TRABALHOS = [];
let heroConfig = HERO_FALLBACK;
let filtroAtual = "filmes";
let expandido = false;
const cacheOembed = new Map();

const heroVideo = document.getElementById("heroVideo");

document.getElementById("sobre-texto").textContent = SOBRE_TEXTO;

// ---------- Plataforma de video (YouTube + Vimeo) ----------

function extrairIdVideo(url, plataforma) {
  if (plataforma === "youtube") {
    const m = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
    );
    return m ? m[1] : null;
  }
  const m = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  return m ? m[1] : null;
}

async function buscarOembed(url, plataforma) {
  if (cacheOembed.has(url)) return cacheOembed.get(url);
  const endpoint =
    plataforma === "youtube"
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
  try {
    const resp = await fetch(endpoint);
    if (!resp.ok) throw new Error("oEmbed falhou para " + url);
    const dados = await resp.json();
    cacheOembed.set(url, dados);
    return dados;
  } catch (err) {
    console.error(err);
    const fallback = { title: "Vídeo indisponível", thumbnail_url: "", description: "" };
    cacheOembed.set(url, fallback);
    return fallback;
  }
}

function montarEmbedPlayer(url, plataforma) {
  const id = extrairIdVideo(url, plataforma);
  return plataforma === "youtube"
    ? `https://www.youtube.com/embed/${id}?autoplay=1`
    : `https://player.vimeo.com/video/${id}?autoplay=1`;
}

function montarEmbedLoop(url, plataforma) {
  const id = extrairIdVideo(url, plataforma);
  return plataforma === "youtube"
    ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`
    : `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1`;
}

// ---------- Som do reel de abertura (loop mudo por padrao) ----------
// O toggle de som usa a API de mensagens do YouTube. O modo "background" do
// Vimeo (usado se a abertura for trocada pra Vimeo via CMS) ja é mudo por
// natureza e nao expoe esse controle — por isso o botao some nesse caso.

const ICONE_MUDO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9v6h4l5 5V4L8 9H4z"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>';
const ICONE_COM_SOM =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7"/><path d="M19 6a9 9 0 010 12"/></svg>';

let audioAtivo = false;
const botaoSom = document.getElementById("botaoSom");

function enviarComandoYoutube(func) {
  heroVideo.contentWindow.postMessage(
    JSON.stringify({ event: "command", func, args: [] }),
    "*"
  );
}

botaoSom.addEventListener("click", () => {
  audioAtivo = !audioAtivo;
  enviarComandoYoutube(audioAtivo ? "unMute" : "mute");
  botaoSom.innerHTML = audioAtivo ? ICONE_COM_SOM : ICONE_MUDO;
  botaoSom.setAttribute("aria-label", audioAtivo ? "Desativar som" : "Ativar som");
});

function resetarBotaoSom() {
  audioAtivo = false;
  botaoSom.innerHTML = ICONE_MUDO;
  botaoSom.setAttribute("aria-label", "Ativar som");
  botaoSom.hidden = heroConfig.heroPlataforma !== "youtube";
}

// ---------- Trabalhos (grid, filtros, paginacao) ----------

function trabalhosDoFiltro(filtro) {
  return TRABALHOS.filter(
    (t) => t.visivel !== false && (t.categorias || []).includes(filtro)
  );
}

async function renderizarGrid() {
  const grid = document.getElementById("grid");
  const vazio = document.getElementById("vazio");
  const botaoVerMais = document.getElementById("verMais");

  const lista = trabalhosDoFiltro(filtroAtual);

  if (lista.length === 0) {
    grid.innerHTML = "";
    vazio.hidden = false;
    botaoVerMais.hidden = true;
    return;
  }
  vazio.hidden = true;

  const visiveis = expandido ? lista : lista.slice(0, PAGINA_TAMANHO);
  grid.innerHTML = "";

  for (const trabalho of visiveis) {
    const card = document.createElement("div");
    card.className = "thumb";
    card.innerHTML = `
      <img alt="" />
      <div class="thumb__creditos">
        <span class="thumb__titulo"></span>
        <span class="thumb__credito">${trabalho.creditos || ""}</span>
      </div>
    `;
    grid.appendChild(card);

    buscarOembed(trabalho.url, trabalho.plataforma).then((dados) => {
      const img = card.querySelector("img");
      const titulo = card.querySelector(".thumb__titulo");
      const tituloFinal = trabalho.tituloPersonalizado || dados.title || "";
      img.src = resolverThumbnail(trabalho.thumbnailPersonalizado) || dados.thumbnail_url || "";
      img.alt = tituloFinal;
      titulo.textContent = tituloFinal;
    });

    card.addEventListener("click", () => tocarVideo(trabalho));
  }

  if (lista.length <= PAGINA_TAMANHO) {
    botaoVerMais.hidden = true;
  } else {
    botaoVerMais.hidden = false;
    botaoVerMais.textContent = expandido ? "Exibir menos" : "Ver mais";
  }
}

document.getElementById("filtros").addEventListener("click", (e) => {
  const btn = e.target.closest(".filtro");
  if (!btn) return;

  document
    .querySelectorAll(".filtro")
    .forEach((f) => f.classList.remove("is-ativo"));
  btn.classList.add("is-ativo");

  filtroAtual = btn.dataset.filtro;
  expandido = false;
  renderizarGrid();
});

document.getElementById("verMais").addEventListener("click", () => {
  expandido = !expandido;
  renderizarGrid();
});

// ---------- Reproducao em tela cheia no lugar do reel de abertura ----------

async function tocarVideo(trabalho) {
  const dados = await buscarOembed(trabalho.url, trabalho.plataforma);
  const titulo = trabalho.tituloPersonalizado || dados.title || "";
  const descricao = trabalho.descricaoPersonalizada || dados.description || "";

  heroVideo.src = montarEmbedPlayer(trabalho.url, trabalho.plataforma);
  heroVideo.classList.add("is-player");
  document.getElementById("fecharVideo").hidden = false;
  document.getElementById("nav").hidden = true;
  botaoSom.hidden = true;

  document.getElementById("creditosTitulo").textContent = titulo;
  document.getElementById("creditosTexto").textContent =
    trabalho.creditos || descricao || "";
  document.getElementById("creditosVideo").hidden = false;

  document.getElementById("sobre").hidden = true;

  document.getElementById("hero").scrollIntoView();
}

function fecharVideo() {
  heroVideo.src = montarEmbedLoop(heroConfig.heroUrl, heroConfig.heroPlataforma);
  heroVideo.classList.remove("is-player");
  document.getElementById("fecharVideo").hidden = true;
  document.getElementById("nav").hidden = false;
  document.getElementById("creditosVideo").hidden = true;
  document.getElementById("sobre").hidden = false;

  resetarBotaoSom();
}

document.getElementById("fecharVideo").addEventListener("click", fecharVideo);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("fecharVideo").hidden) {
    fecharVideo();
  }
});

// ---------- Inicializacao ----------

async function iniciar() {
  try {
    const [trabalhosResp, configResp] = await Promise.all([
      fetch(`${CONTEUDO_BASE}/trabalhos.json`, { cache: "no-store" }),
      fetch(`${CONTEUDO_BASE}/configuracoes.json`, { cache: "no-store" }),
    ]);
    if (!trabalhosResp.ok || !configResp.ok) throw new Error("Falha ao buscar conteudo");
    const trabalhosData = await trabalhosResp.json();
    TRABALHOS = trabalhosData.trabalhos || [];
    heroConfig = await configResp.json();
  } catch (err) {
    console.error("Nao foi possivel carregar conteudo do GitHub, usando fallback local.", err);
  }

  heroVideo.src = montarEmbedLoop(heroConfig.heroUrl, heroConfig.heroPlataforma);
  resetarBotaoSom();
  renderizarGrid();
}

iniciar();
