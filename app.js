const TEMAS = ["camprock", "hsm", "descendentes", "zombies"];
const TEMA_PADRAO = "hsm";

const TEMAS_ANTIGOS = {
    claro: "hsm",
    escuro: "camprock",
    colorido: "descendentes"
};

function mudarTema(tema) {
    if (TEMAS_ANTIGOS[tema]) tema = TEMAS_ANTIGOS[tema];
    if (!TEMAS.includes(tema)) tema = TEMA_PADRAO;

    document.body.classList.remove(...TEMAS.map((nome) => `tema-${nome}`));
    document.body.classList.add(`tema-${tema}`);
    localStorage.setItem("temaSelecionado", tema);

    document.querySelectorAll(".tema-btn").forEach((botao) => {
        const ativo = botao.dataset.tema === tema;
        botao.classList.toggle("ativo", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
    });
}

function aplicarTemaSalvo() {
    mudarTema(localStorage.getItem("temaSelecionado") || TEMA_PADRAO);
}

function mostrarToast(mensagem) {
    let area = document.getElementById("toasts");
    if (!area) {
        area = document.createElement("div");
        area.id = "toasts";
        document.body.appendChild(area);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = mensagem;
    area.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

function confirmar(mensagem, titulo = "Confirmar") {
    return new Promise((resolve) => {
        const dialogo = document.getElementById("dialogo");
        const texto = document.getElementById("dialogo-texto");
        const tituloEl = document.getElementById("dialogo-titulo");
        const btnOk = document.getElementById("dialogo-confirmar");
        const btnCancelar = document.getElementById("dialogo-cancelar");

        if (!dialogo || !texto || !btnOk || !btnCancelar) {
            resolve(window.confirm(mensagem));
            return;
        }

        tituloEl.textContent = titulo;
        texto.textContent = mensagem;
        dialogo.hidden = false;
        btnOk.focus();

        const fechar = (valor) => {
            dialogo.hidden = true;
            btnOk.removeEventListener("click", onOk);
            btnCancelar.removeEventListener("click", onCancel);
            dialogo.removeEventListener("click", onFundo);
            resolve(valor);
        };

        const onOk = () => fechar(true);
        const onCancel = () => fechar(false);
        const onFundo = (evento) => {
            if (evento.target === dialogo) fechar(false);
        };

        btnOk.addEventListener("click", onOk);
        btnCancelar.addEventListener("click", onCancel);
        dialogo.addEventListener("click", onFundo);
    });
}

function baixarArquivo(nome, conteudo) {
    const blob = new Blob([conteudo], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nome;
    link.click();
    URL.revokeObjectURL(url);
}

function idNovo() {
    return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

document.addEventListener("DOMContentLoaded", () => {
    aplicarTemaSalvo();

    const header = document.getElementById("header");
    const aoRolar = () => {
        if (!header) return;
        header.classList.toggle("header-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    aoRolar();
});
