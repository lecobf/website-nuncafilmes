// Controla: preenchimento do texto de Sobre, busca de titulo/thumbnail reais
// no oEmbed publico do Vimeo, filtro de categorias, paginacao "ver mais" e modal de visualizacao.

const CREDITO_PADRAO = "Direção de Fotografia: Leco Petersen";
const PAGINA_TAMANHO = 6;

let filtroAtual = "todos";
let itensVisiveis = PAGINA_TAMANHO;
const cacheOembed = new Map();

document.getElementById("sobre-texto").textContent = SOBRE_TEXTO;

function trabalhosDoFiltro(filtro) {
  if (filtro === "todos") return WORKS;
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

  const visiveis = lista.slice(0, itensVisiveis);
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

    card.addEventListener("click", () => abrirModal(trabalho));
  }

  botaoVerMais.hidden = itensVisiveis >= lista.length;
}

document.getElementById("filtros").addEventListener("click", (e) => {
  const btn = e.target.closest(".filtro");
  if (!btn) return;

  document
    .querySelectorAll(".filtro")
    .forEach((f) => f.classList.remove("is-ativo"));
  btn.classList.add("is-ativo");

  filtroAtual = btn.dataset.filtro;
  itensVisiveis = PAGINA_TAMANHO;
  renderizarGrid();
});

document.getElementById("verMais").addEventListener("click", () => {
  itensVisiveis += PAGINA_TAMANHO;
  renderizarGrid();
});

async function abrirModal(trabalho) {
  const modal = document.getElementById("modal");
  const player = document.getElementById("modalPlayer");
  const titulo = document.getElementById("modalTitulo");
  const creditos = document.getElementById("modalCreditos");

  const dados = await buscarOembed(trabalho.vimeoId);

  titulo.textContent = dados.title || "";
  creditos.textContent = CREDITO_PADRAO;
  player.innerHTML = `<iframe src="https://player.vimeo.com/video/${trabalho.vimeoId}?autoplay=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;

  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function fecharModal() {
  const modal = document.getElementById("modal");
  document.getElementById("modalPlayer").innerHTML = "";
  modal.hidden = true;
  document.body.style.overflow = "";
}

document.getElementById("modalFechar").addEventListener("click", fecharModal);
document.getElementById("modalBackdrop").addEventListener("click", fecharModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharModal();
});

renderizarGrid();
