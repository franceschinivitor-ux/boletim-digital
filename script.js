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
  if (!/^\d+$/.test(texto)) {
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
      f3 = item.faltas[2] || 0;
    }
    const totalFaltasDisciplina = f1 + f2 + f3;
    totalFaltasGeral += totalFaltasDisciplina;

    let situacaoTexto = "";
    let classeSituacao = "";

    if (media === null) {
      situacaoTexto = "Nota ainda não disponível";
      classeSituacao = "status-indisponivel";
    } else if (media >= 6.0) {
      situacaoTexto = "Bom desempenho";
      classeSituacao = "status-bom";
      disciplinasBomDesempenho++;
      somaMediasGerais += media;
      qtdDisciplinasComMedia++;
    } else {
      situacaoTexto = "Atenção";
      classeSituacao = "status-atencao";
      disciplinasAtencao++;
      somaMediasGerais += media;
      qtdDisciplinasComMedia++;
    }

    const tr = document.createElement("tr");

    if (modoEdicao) {
      // MODO EDIÇÃO: Formulários nos campos
      const valT1 = n1 !== null ? String(n1).replace(".", ",") : "";
      const valT2 = n2 !== null ? String(n2).replace(".", ",") : "";
      const valT3 = n3 !== null ? String(n3).replace(".", ",") : "";

      tr.innerHTML = `
        <td><strong id="disc-nome-${idx}"></strong></td>
        <td><input type="text" class="input-nota" id="input-t1-${idx}" value="${valT1}"></td>
        <td><input type="text" class="input-nota" id="input-t2-${idx}" value="${valT2}"></td>
        <td><input type="text" class="input-nota" id="input-t3-${idx}" value="${valT3}"></td>
        <td><strong>${formatarNotaParaExibicao(media)}</strong></td>
        <td>
          <div class="grupo-faltas-edit">
            <input type="text" class="input-falta" id="input-f1-${idx}" value="${f1}">
            <input type="text" class="input-falta" id="input-f2-${idx}" value="${f2}">
            <input type="text" class="input-falta" id="input-f3-${idx}" value="${f3}">
          </div>
        </td>
        <td class="${classeSituacao}">${situacaoTexto}</td>
      `;
      tabelaCorpo.appendChild(tr);
      // Inserção segura do nome da disciplina via textContent (DOM Security)
      document.getElementById(`disc-nome-${idx}`).textContent = item.disciplina;

    } else {
      // MODO VISUALIZAÇÃO
      tr.innerHTML = `
        <td><strong id="disc-nome-${idx}"></strong></td>
        <td>${formatarNotaParaExibicao(n1)}</td>
        <td>${formatarNotaParaExibicao(n2)}</td>
        <td>${formatarNotaParaExibicao(n3)}</td>
        <td><strong>${formatarNotaParaExibicao(media)}</strong></td>
        <td>${totalFaltasDisciplina} (${f1}/${f2}/${f3})</td>
        <td class="${classeSituacao}">${situacaoTexto}</td>
      `;
      tabelaCorpo.appendChild(tr);
      document.getElementById(`disc-nome-${idx}`).textContent = item.disciplina;
    }
  });

  // Atualização dos Cards de Resumo
  const mediaGeralCalculada = qtdDisciplinasComMedia > 0 
    ? (somaMediasGerais / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") 
    : "—";

  document.getElementById("media-geral").innerText = mediaGeralCalculada;
  document.getElementById("total-faltas").innerText = totalFaltasGeral;
  document.getElementById("bom-desempenho").innerText = disciplinasBomDesempenho;
  document.getElementById("precisa-atencao").innerText = disciplinasAtencao;

  // NOTA SOBRE FREQUÊNCIA: Percentual fictício/demonstrativo mantido conforme regras
  document.getElementById("frequencia").innerText = "92%";
}

// SALVAR ALTERAÇÕES NA API
async function salvarAlteracoes() {
  const msgSalvar = document.getElementById("mensagem-salvar");
  msgSalvar.innerText = "";
  msgSalvar.className = "mensagem-status";

  let existemErros = false;
  const novasDisciplinas = [];

  // Validação dos campos digitados
  disciplinasAtuais.forEach((item, idx) => {
    const elT1 = document.getElementById(`input-t1-${idx}`);
    const elT2 = document.getElementById(`input-t2-${idx}`);
    const elT3 = document.getElementById(`input-t3-${idx}`);
    const elF1 = document.getElementById(`input-f1-${idx}`);
    const elF2 = document.getElementById(`input-f2-${idx}`);
    const elF3 = document.getElementById(`input-f3-${idx}`);

    [elT1, elT2, elT3, elF1, elF2, elF3].forEach(el => el && el.classList.remove("input-invalido"));

    const resT1 = validarNotaDigitada(elT1.value);
    const resT2 = validarNotaDigitada(elT2.value);
    const resT3 = validarNotaDigitada(elT3.value);

    const resF1 = validarFaltaDigitada(elF1.value);
    const resF2 = validarFaltaDigitada(elF2.value);
    const resF3 = validarFaltaDigitada(elF3.value);

    if (!resT1.valida) { elT1.classList.add("input-invalido"); existemErros = true; }
    if (!resT2.valida) { elT2.classList.add("input-invalido"); existemErros = true; }
    if (!resT3.valida) { elT3.classList.add("input-invalido"); existemErros = true; }

    if (!resF1.valida) { elF1.classList.add("input-invalido"); existemErros = true; }
    if (!resF2.valida) { elF2.classList.add("input-invalido"); existemErros = true; }
    if (!resF3.valida) { elF3.classList.add("input-invalido"); existemErros = true; }

    if (!existemErros) {
      novasDisciplinas.push({
        disciplina: item.disciplina,
        tri1: resT1.valor,
        tri2: resT2.valor,
        tri3: resT3.valor,
        faltas: [resF1.valor, resF2.valor, resF3.valor]
      });
    }
  });

  if (existemErros) {
    msgSalvar.innerText = "Existem valores inválidos destacados em vermelho. Corrija para salvar.";
    msgSalvar.className = "mensagem-status erro";
    return;
  }

  msgSalvar.innerText = "Salvando...";
  msgSalvar.className = "mensagem-status info";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      msgSalvar.innerText = "Erro ao salvar os dados no servidor. Tente novamente.";
      msgSalvar.className = "mensagem-status erro";
      return;
    }

    disciplinasAtuais = novasDisciplinas;
    modoEdicao = false;
    document.getElementById("btn-alternar-edicao").innerText = "Alterar dados";
    document.getElementById("btn-salvar").style.display = "none";

    msgSalvar.innerText = "Dados salvos com sucesso.";
    msgSalvar.className = "mensagem-status sucesso";

    renderizarBoletim();

  } catch (erro) {
    msgSalvar.innerText = "Falha na conexão ao salvar. Tente novamente.";
    msgSalvar.className = "mensagem-status erro";
  }
}