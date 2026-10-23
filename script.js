// DADOS FICTÍCIOS PADRONIZADOS DO 8º ANO
const dadosDisciplinas = [
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

// Função para converter e validar qualquer formato de nota na escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Converte texto com vírgula para número decimal com ponto
  let numero = Number(String(valor).replace(",", "."));

  // Verifica se não é um número válido
  if (isNaN(numero)) {
    return null;
  }

  // Ajusta notas digitadas na escala 0-100 para 0-10
  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  // Descarta notas fora da escala de 0 a 10
  if (numero < 0 || numero > 10) {
    return null;
  }

  return numero;
}

// Função para calcular a média de uma lista de notas disponíveis
function calcularMedia(notas) {
  const notasValidas = notas.filter(n => n !== null);
  
  if (notasValidas.length === 0) {
    return null;
  }

  const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
  return soma / notasValidas.length;
}

// Função para formatar a nota para exibição na tabela
function formatarNotaParaExibicao(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

// Função principal que constrói a tabela e atualiza os cards
function renderizarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = ""; // Limpa a tabela antes de preencher

  let somaMediasGerais = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let disciplinasBomDesempenho = 0;
  let disciplinasAtencao = 0;

  // Passa por cada disciplina e calcula os dados
  dadosDisciplinas.forEach(item => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const totalFaltasDisciplina = item.faltas.reduce((acc, curr) => acc + curr, 0);
    
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

    // Cria a linha da tabela HTML
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarNotaParaExibicao(n1)}</td>
      <td>${formatarNotaParaExibicao(n2)}</td>
      <td>${formatarNotaParaExibicao(n3)}</td>
      <td><strong>${formatarNotaParaExibicao(media)}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${classeSituacao}">${situacaoTexto}</td>
    `;

    tabelaCorpo.appendChild(tr);
  });

  // Atualiza os Cards de Resumo no topo
  const mediaGeralCalculada = qtdDisciplinasComMedia > 0 
    ? (somaMediasGerais / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") 
    : "—";

  document.getElementById("media-geral").innerText = mediaGeralCalculada;
  document.getElementById("total-faltas").innerText = totalFaltasGeral;
  document.getElementById("bom-desempenho").innerText = disciplinasBomDesempenho;
  document.getElementById("precisa-atencao").innerText = disciplinasAtencao;

  // NOTA SOBRE FREQUÊNCIA: O percentual abaixo de 92% é apenas FICTÍCIO/DEMONSTRATIVO para esta primeira etapa
  // e será substituído por um cálculo real no futuro.
  document.getElementById("frequencia").innerText = "92%";
}

// Executa a função assim que a página carrega
renderizarBoletim();