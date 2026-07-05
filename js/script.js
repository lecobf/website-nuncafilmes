// Controla: preenchimento do texto de Sobre, busca de titulo/thumbnail reais
// no oEmbed publico do Vimeo, filtro de categorias, paginacao "ver mais" e
// reproducao de video em tela cheia no lugar do reel de abertura.

const CREDITO_PADRAO = "Direção de Fotografia: Leco Petersen";
const PAGINA_TAMANHO = 6;

let filtroAtual = "filmes";
let expandido = false;
const cacheOembed = new Map();

// Guarda o src original do reel de abertura para poder restaurar ao fechar um video.
const heroVideo = document.getElementById("heroVideo");
const HERO_SRC_ORIGINAL = heroVideo.src;

document.getElementById("sobre-texto").textContent = SOBRE_TEXTO;

// ---------- Som do reel de abertura (loop mudo por padrao) ----------

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

function trabalhosDoFiltro(filtro) {
  return WORKS.filter((w) => w.category === filtro);
}

async function buscarOembed(vimeoId) {
  if (cacheOembed.has(vimeoId)) return cacheOembed.get(vimeoId);
  const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
    "https://vimeo.com/" + vimeoId
  )}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("oEmbed falhou para " + vimeoId);
    const data = await resp.json();
    cacheOembed.set(vimeoId, data);
    return data;
  } catch (err) {
    console.error(err);
    const fallback = { title: "Vídeo indisponível", thumbnail_url: "" };
    cacheOembed.set(vimeoId, fallback);
    return fallback;
  }
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
        <span class="thumb__credito">${CREDITO_PADRAO}</span>
      </div>
    `;
    grid.appendChild(card);

    buscarOembed(trabalho.vimeoId).then((dados) => {
      const img = card.querySelector("img");
      const titulo = card.querySelector(".thumb__titulo");
      img.src = dados.thumbnail_url || "";
      img.alt = dados.title || "";
      titulo.textContent = dados.title || "";
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

async function tocarVideo(trabalho) {
  const dados = await buscarOembed(trabalho.vimeoId);

  heroVideo.src = `https://player.vimeo.com/video/${trabalho.vimeoId}?autoplay=1`;
  heroVideo.classList.add("is-player");
  document.getElementById("fecharVideo").hidden = false;
  document.getElementById("nav").hidden = true;
  botaoSom.hidden = true;

  document.getElementById("creditosTitulo").textContent = dados.title || "";
  document.getElementById("creditosTexto").textContent = CREDITO_PADRAO;
  document.getElementById("creditosVideo").hidden = false;

  document.getElementById("sobre").hidden = true;

  document.getElementById("hero").scrollIntoView();
}

function fecharVideo() {
  heroVideo.src = HERO_SRC_ORIGINAL;
  heroVideo.classList.remove("is-player");
  document.getElementById("fecharVideo").hidden = true;
  document.getElementById("nav").hidden = false;
  document.getElementById("creditosVideo").hidden = true;
  document.getElementById("sobre").hidden = false;

  audioAtivo = false;
  botaoSom.innerHTML = ICONE_MUDO;
  botaoSom.setAttribute("aria-label", "Ativar som");
  botaoSom.hidden = false;
}

document.getElementById("fecharVideo").addEventListener("click", fecharVideo);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("fecharVideo").hidden) {
    fecharVideo();
  }
});

renderizarGrid();
