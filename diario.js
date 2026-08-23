const CHAVE_DIARIOS = "diarios";
const HUMORES = ["😊", "🤩", "😌", "❤️", "😢", "😤", "😴", "🎤"];

let humorSelecionado = "😊";
let editandoId = null;

function lerDiarios() {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_DIARIOS) || "[]");
    return bruto.map((item, indice) => {
        if (typeof item === "string") {
            return {
                id: `legado-${indice}`,
                texto: item,
                humor: "😊",
                criadoEm: Date.now() - (bruto.length - indice) * 1000
            };
        }
        return item;
    });
}

function gravarDiarios(lista) {
    localStorage.setItem(CHAVE_DIARIOS, JSON.stringify(lista));
}

function formatarData(valor) {
    return new Date(valor).toLocaleString("pt-BR", {
        dateStyle: "long",
        timeStyle: "short"
    });
}

function atualizarContador() {
    const campo = document.getElementById("diario-text");
    const el = document.getElementById("contador-chars");
    if (!campo || !el) return;
    el.textContent = `${campo.value.length} caracteres`;
}

function renderizarDiarios() {
    const log = document.getElementById("diario-log");
    const busca = (document.getElementById("busca-diario")?.value || "").trim().toLowerCase();
    const lista = lerDiarios()
        .slice()
        .reverse()
        .filter((item) => !busca || item.texto.toLowerCase().includes(busca) || item.humor.includes(busca));

    const total = document.getElementById("total-entradas");
    if (total) {
        const n = lerDiarios().length;
        total.textContent = n === 1 ? "1 página" : `${n} páginas`;
    }

    if (!lista.length) {
        log.innerHTML = `<p class="vazio">${busca ? "Nenhuma página encontrada." : "Nenhuma página escrita ainda. O palco é seu."}</p>`;
        return;
    }

    log.innerHTML = lista.map((item) => `
        <article class="entrada" data-id="${item.id}">
            <div class="entrada-topo">
                <time datetime="${new Date(item.criadoEm).toISOString()}">${formatarData(item.criadoEm)}</time>
                <span class="entrada-humor" title="Humor">${item.humor}</span>
            </div>
            <p class="entrada-texto"></p>
            <div class="entrada-acoes">
                <button type="button" class="btn btn-ghost btn-sm" data-acao="editar">Editar</button>
                <button type="button" class="btn btn-danger btn-sm" data-acao="excluir">Excluir</button>
            </div>
        </article>
    `).join("");

    log.querySelectorAll(".entrada").forEach((artigo) => {
        const item = lista.find((entrada) => entrada.id === artigo.dataset.id);
        artigo.querySelector(".entrada-texto").textContent = item.texto;
    });
}

function salvarDiario() {
    const campo = document.getElementById("diario-text");
    const texto = campo.value.trim();

    if (!texto) {
        mostrarToast("Escreva algo antes de salvar.");
        campo.focus();
        return;
    }

    const lista = lerDiarios();

    if (editandoId) {
        const alvo = lista.find((item) => item.id === editandoId);
        if (alvo) {
            alvo.texto = texto;
            alvo.humor = humorSelecionado;
            alvo.editadoEm = Date.now();
        }
        editandoId = null;
        document.getElementById("btn-salvar").textContent = "Salvar";
        mostrarToast("Página atualizada.");
    } else {
        lista.push({
            id: idNovo(),
            texto,
            humor: humorSelecionado,
            criadoEm: Date.now()
        });
        mostrarToast("Página salva no diário.");
    }

    gravarDiarios(lista);
    campo.value = "";
    atualizarContador();
    renderizarDiarios();
}

async function limparDiarios() {
    if (!lerDiarios().length) {
        mostrarToast("O diário já está vazio.");
        return;
    }

    const ok = await confirmar("Isso apaga todas as páginas do diário. Não dá para desfazer.", "Limpar diário");
    if (!ok) return;

    localStorage.removeItem(CHAVE_DIARIOS);
    editandoId = null;
    document.getElementById("diario-text").value = "";
    document.getElementById("btn-salvar").textContent = "Salvar";
    atualizarContador();
    renderizarDiarios();
    mostrarToast("Diário limpo.");
}

function exportarDiario() {
    const lista = lerDiarios();
    if (!lista.length) {
        mostrarToast("Não há páginas para exportar.");
        return;
    }
    baixarArquivo("diari-diario.json", JSON.stringify(lista, null, 2));
    mostrarToast("Backup baixado.");
}

function selecionarHumor(humor) {
    humorSelecionado = humor;
    document.querySelectorAll(".humor-btn").forEach((botao) => {
        botao.classList.toggle("ativo", botao.dataset.humor === humor);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const campo = document.getElementById("diario-text");
    const log = document.getElementById("diario-log");
    const busca = document.getElementById("busca-diario");

    document.getElementById("humores").innerHTML = HUMORES.map((humor) => (
        `<button type="button" class="humor-btn${humor === humorSelecionado ? " ativo" : ""}" data-humor="${humor}" aria-label="Humor ${humor}">${humor}</button>`
    )).join("");

    document.getElementById("humores").addEventListener("click", (evento) => {
        const botao = evento.target.closest(".humor-btn");
        if (botao) selecionarHumor(botao.dataset.humor);
    });

    campo.addEventListener("input", atualizarContador);
    campo.addEventListener("keydown", (evento) => {
        if ((evento.ctrlKey || evento.metaKey) && evento.key === "Enter") {
            evento.preventDefault();
            salvarDiario();
        }
    });

    busca.addEventListener("input", renderizarDiarios);

    log.addEventListener("click", async (evento) => {
        const botao = evento.target.closest("button[data-acao]");
        if (!botao) return;
        const artigo = botao.closest(".entrada");
        const id = artigo.dataset.id;
        const lista = lerDiarios();
        const item = lista.find((entrada) => entrada.id === id);
        if (!item) return;

        if (botao.dataset.acao === "editar") {
            campo.value = item.texto;
            selecionarHumor(item.humor || "😊");
            editandoId = id;
            document.getElementById("btn-salvar").textContent = "Atualizar";
            atualizarContador();
            campo.focus();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        if (botao.dataset.acao === "excluir") {
            const ok = await confirmar("Excluir esta página do diário?", "Excluir página");
            if (!ok) return;
            gravarDiarios(lista.filter((entrada) => entrada.id !== id));
            if (editandoId === id) {
                editandoId = null;
                campo.value = "";
                document.getElementById("btn-salvar").textContent = "Salvar";
                atualizarContador();
            }
            renderizarDiarios();
            mostrarToast("Página excluída.");
        }
    });

    atualizarContador();
    renderizarDiarios();
});
