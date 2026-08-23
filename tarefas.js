const CHAVE_TAREFAS = "tarefas";
let filtroAtual = "todas";

function lerTarefas() {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_TAREFAS) || "[]");
    return bruto.map((item, indice) => ({
        id: item.id || `legado-${indice}`,
        texto: item.texto,
        concluida: Boolean(item.concluida),
        criadaEm: item.criadaEm || Date.now() - (bruto.length - indice) * 1000
    }));
}

function gravarTarefas(lista) {
    localStorage.setItem(CHAVE_TAREFAS, JSON.stringify(lista));
}

function tarefasFiltradas() {
    const lista = lerTarefas();
    if (filtroAtual === "pendentes") return lista.filter((item) => !item.concluida);
    if (filtroAtual === "concluidas") return lista.filter((item) => item.concluida);
    return lista;
}

function atualizarProgresso() {
    const lista = lerTarefas();
    const feitas = lista.filter((item) => item.concluida).length;
    const texto = document.getElementById("progresso-texto");
    const barra = document.getElementById("progresso-barra");
    if (texto) {
        texto.textContent = lista.length
            ? `${feitas} de ${lista.length} concluídas`
            : "Nenhuma tarefa ainda";
    }
    if (barra) {
        barra.style.width = lista.length ? `${(feitas / lista.length) * 100}%` : "0%";
    }
}

function renderizarTarefas() {
    const ul = document.getElementById("lista-tarefas");
    const lista = tarefasFiltradas();
    atualizarProgresso();

    document.querySelectorAll(".chip[data-filtro]").forEach((chip) => {
        const ativo = chip.dataset.filtro === filtroAtual;
        chip.classList.toggle("ativo", ativo);
        chip.setAttribute("aria-pressed", String(ativo));
    });

    if (!lista.length) {
        const msg = lerTarefas().length
            ? "Nada neste filtro."
            : "Sem tarefas por enquanto. Qual é o próximo passo?";
        ul.innerHTML = `<li class="vazio" style="display:block">${msg}</li>`;
        return;
    }

    ul.innerHTML = lista.map((item) => `
        <li class="${item.concluida ? "concluida" : ""}" data-id="${item.id}">
            <input type="checkbox" ${item.concluida ? "checked" : ""} aria-label="Concluir tarefa">
            <span class="tarefa-texto"></span>
            <button type="button" class="btn btn-danger btn-sm" data-acao="excluir">Excluir</button>
        </li>
    `).join("");

    ul.querySelectorAll("li[data-id]").forEach((li) => {
        const item = lista.find((tarefa) => tarefa.id === li.dataset.id);
        li.querySelector(".tarefa-texto").textContent = item.texto;
    });
}

function adicionarTarefa() {
    const campo = document.getElementById("nova-tarefa");
    const texto = campo.value.trim();

    if (!texto) {
        mostrarToast("Digite uma tarefa primeiro.");
        campo.focus();
        return;
    }

    const lista = lerTarefas();
    lista.push({
        id: idNovo(),
        texto,
        concluida: false,
        criadaEm: Date.now()
    });
    gravarTarefas(lista);
    campo.value = "";
    renderizarTarefas();
    mostrarToast("Tarefa adicionada.");
}

function alternarTarefa(id) {
    const lista = lerTarefas();
    const item = lista.find((tarefa) => tarefa.id === id);
    if (!item) return;
    item.concluida = !item.concluida;
    gravarTarefas(lista);
    renderizarTarefas();
}

async function excluirTarefa(id) {
    const ok = await confirmar("Excluir esta tarefa?", "Excluir tarefa");
    if (!ok) return;
    gravarTarefas(lerTarefas().filter((item) => item.id !== id));
    renderizarTarefas();
    mostrarToast("Tarefa excluída.");
}

async function limparConcluidas() {
    const lista = lerTarefas();
    const feitas = lista.filter((item) => item.concluida);
    if (!feitas.length) {
        mostrarToast("Não há tarefas concluídas.");
        return;
    }
    const ok = await confirmar(`Remover ${feitas.length} tarefa(s) concluída(s)?`, "Limpar concluídas");
    if (!ok) return;
    gravarTarefas(lista.filter((item) => !item.concluida));
    renderizarTarefas();
    mostrarToast("Concluídas removidas.");
}

function exportarTarefas() {
    const lista = lerTarefas();
    if (!lista.length) {
        mostrarToast("Não há tarefas para exportar.");
        return;
    }
    baixarArquivo("diari-tarefas.json", JSON.stringify(lista, null, 2));
    mostrarToast("Backup baixado.");
}

document.addEventListener("DOMContentLoaded", () => {
    const campo = document.getElementById("nova-tarefa");
    const lista = document.getElementById("lista-tarefas");

    campo.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            adicionarTarefa();
        }
    });

    document.querySelectorAll(".chip[data-filtro]").forEach((chip) => {
        chip.addEventListener("click", () => {
            filtroAtual = chip.dataset.filtro;
            renderizarTarefas();
        });
    });

    lista.addEventListener("change", (evento) => {
        if (evento.target.matches("input[type='checkbox']")) {
            alternarTarefa(evento.target.closest("li").dataset.id);
        }
    });

    lista.addEventListener("click", (evento) => {
        const botao = evento.target.closest("button[data-acao='excluir']");
        if (botao) excluirTarefa(botao.closest("li").dataset.id);
    });

    renderizarTarefas();
});
