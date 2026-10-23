// CONFIGURAÇÃO FIXA DO ALUNO
const CONFIG_ALUNO = {
  turma: "8C",
  numeroChamada: 25,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// DADOS FICTÍCIOS PADRONIZADOS BASE
const dadosDisciplinasBase = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// VARIÁVEIS DE SESSÃO (PIN NUNCA É ARMAZENADO NO DISCO/STORAGE)
let pinSessao = "";
let disciplinasAtuais = [];
let modoEdicao = false;

// NORMALIZAÇÃO DE NOTAS ANTIGAS / INICIAIS
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  let numero = Number(String(valor).replace(",", "."));
  if (isNaN(numero)) {
    return null;
  }
  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }
  if (numero < 0 || numero > 10) {
    return null;
  }
  return numero;
}

// VALIDAÇÃO RIGOROSA DA NOTA DIGITADA NO MODO EDIÇÃO
function validarNotaDigitada(str) {
  if (str === null || str === undefined) return { valida: true, valor: null };
  const texto = String(str).trim();
  if (texto === "") return { valida: true, valor: null };

  const textoFormatado = texto.replace(",", ".");
  const num = Number(textoFormatado);

  if (isNaN(num) || num < 0 || num > 10) {
    return { valida: false, valor: null };
  }
  return { valida: true, valor: num };
}

// VALIDAÇÃO RIGOROSA DA FALTA DIGITADA NO MODO EDIÇÃO
function validarFaltaDigitada(str) {
  if (str === null || str === undefined) return { valida: false, valor: null };
  const texto = String(str).trim();
  if (texto === "") return { valida: false, valor: null };

  // Deve conter apenas dígitos inteiros
  if (!/^\d+\$/.test(texto)) {
    return { valida: false, valor: null };
  }

  const num = parseInt(texto, 10);
  if (isNaN(num) || num < 0) {
    return { valida: false, valor: null };
  }
  return { valida: true, valor: num };
}

// CÁLCULO DE MÉDIA DAS DISCIPLINAS
function calcularMedia(notas) {
  const notasValidas = notas.filter(n => n !== null);
  if (notasValidas.length === 0) return null;
  const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
  return soma / notasValidas.length;
}

// FORMATAÇÃO DE EXIBIÇÃO
function formatarNotaParaExibicao(nota) {
  if (nota === null) return "—";
  return typeof nota === "number" ? nota.toFixed(1).replace(".", ",") : "—";
}

// REALIZAR LOGIN NA API
async function fazerLogin() {
  const inputPin = document.getElementById("pin-input");
  const msgLogin = document.getElementById("mensagem-login");
  const pinDigitado = inputPin.value.trim();

  if (!pinDigitado) {
    msgLogin.innerText = "Por favor, digite o PIN.";
    msgLogin.className = "mensagem-status erro";
    return;
  }

  msgLogin.innerText = "Conectando...";
  msgLogin.className = "mensagem-status info";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgLogin.innerText = "Turma, chamada ou PIN inválidos.";
      msgLogin.className = "mensagem-status erro";
      return;
    }

    if (resposta.status === 429) {
      msgLogin.innerText = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      msgLogin.className = "mensagem-status erro";
      return;
    }

    if (!resposta.ok) {
      msgLogin.innerText = "Não foi possível conectar ao servidor. Tente novamente.";
      msgLogin.className = "mensagem-status erro";
      return;
    }

    const resultado = await resposta.json();

    // PIN mantido apenas na memória da sessão
    pinSessao = pinDigitado;
    inputPin.value = ""; // Limpa o campo do login por segurança

    // TRATAMENTO DOS DADOS RECEBIDOS
    if (resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
      disciplinasAtuais = resultado.dados.disciplinas;
    } else {
      // Se novo ou dados null, usa os dados locais base
      disciplinasAtuais = JSON.parse(JSON.stringify(dadosDisciplinasBase));
    }

    // Oculta área de login e exibe o boletim
    document.getElementById("secao-login").style.display = "none";
    document.getElementById("area-boletim").style.display = "block";

    renderizarBoletim();

  } catch (erro) {
    msgLogin.innerText = "Não foi possível conectar ao servidor. Tente novamente.";
    msgLogin.className = "mensagem-status erro";
  }
}

// TOGGLE ENTRE MODO VISUALIZAÇÃO E MODO EDIÇÃO
function alternarModoEdicao() {
  modoEdicao = !modoEdicao;
  const btnEdicao = document.getElementById("btn-alternar-edicao");
  const btnSalvar = document.getElementById("btn-salvar");
  const msgSalvar = document.getElementById("mensagem-salvar");

  msgSalvar.innerText = "";
  
  if (modoEdicao) {
    btnEdicao.innerText = "Cancelar edição";
    btnSalvar.style.display = "inline-block";
  } else {
    btnEdicao.innerText = "Alterar dados";
    btnSalvar.style.display = "none";
  }

  renderizarBoletim();
}

// CONSTRUÇÃO E ATUALIZAÇÃO DA INTERFACE (TABELA E CARDS)
function renderizarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = "";

  let somaMediasGerais = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let disciplinasBomDesempenho = 0;
  let disciplinasAtencao = 0;

  disciplinasAtuais.forEach((item, idx) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);
    
    // Tratamento seguro de faltas
    let f1 = 0, f2 = 0, f3 = 0;
    if (Array.isArray(item.faltas)) {
      f1 = item.faltas[0] || 0;
      f2 = item.faltas[1] || 0;
      f