
// Dados brutos das disciplinas (Array de Objetos)
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

// Função para ajustar e padronizar qualquer nota de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null; // Nota não lançada
  }

  // Converte texto com vírgula em número com ponto
  let numero = typeof valor === "string" ? parseFloat(valor.replace(",", ".")) : Number(valor);

  if (isNaN(numero)) return null;

  // Se a nota estiver na escala de 0 a 100, divide por 10
  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  // Valida se está dentro do limite permitido de 0 a 10
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  return null; // Caso a nota seja inválida
}

// Função principal que calcula tudo e desenha na tela
function renderizarBoletim() {
  const corpoTabela = document.getElementById("tabela-corpo");
  corpoTabela.innerHTML = "";

  let somaDasMediasGerais = 0;
  let quantidadeDisciplinasComMedia = 0;
  let acumuladorTotalFaltas = 0;
  let contadorBomDesempenho = 0;
  let contadorAtencao = 0;

  // Passa por cada disciplina da lista (forEach)
  dadosDisciplinas.forEach((item) => {
    // Normaliza notas dos 3 trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Soma das faltas
    const totalFaltasDisciplina = item.faltas.reduce((total, f) => total + f, 0);
    acumuladorTotalFaltas += totalFaltasDisciplina;

    // Cálculo da média considerando apenas notas válidas
    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    let mediaTexto = "—";
    let situacaoTexto = "Nota ainda não disponível";
    let classeSituacao = "situacao-indisponivel";

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((a, b) => a + b, 0);
      const mediaCalculada = soma / notasValidas.length;
      mediaTexto = mediaCalculada.toFixed(1).replace(".", ",");

      somaDasMediasGerais += mediaCalculada;
      quantidadeDisciplinasComMedia++;

      if (mediaCalculada >= 6.0) {
        situacaoTexto = "Bom desempenho";
        classeSituacao = "situacao-bom";
        contadorBomDesempenho++;
      } else {
        situacaoTexto = "Atenção";
        classeSituacao = "situacao-atencao";
        contadorAtencao++;
      }
    }

    // Monta a linha da tabela (HTML do elemento DOM)
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${n1 !== null ? n1.toFixed(1).replace(".", ",") : "Ainda não lançada"}</td>
      <td>${n2 !== null ? n2.toFixed(1).replace(".", ",") : "Ainda não lançada"}</td>
      <td>${n3 !== null ? n3.toFixed(1).replace(".", ",") : "Ainda não lançada"}</td>
      <td><strong>${mediaTexto}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${classeSituacao}">${situacaoTexto}</td>
    `;
    corpoTabela.appendChild(linha);
  });

  // Atualiza os Cards de Resumo no topo
  const mediaGeralFinal = quantidadeDisciplinasComMedia > 0 
    ? (somaDasMediasGerais / quantidadeDisciplinasComMedia).toFixed(1).replace(".", ",") 
    : "—";

  document.getElementById("card-media-geral").textContent = mediaGeralFinal;
  document.getElementById("card-total-faltas").textContent = acumuladorTotalFaltas;
  document.getElementById("card-bom-desempenho").textContent = contadorBomDesempenho;
  document.getElementById("card-atencao").textContent = contadorAtencao;

  // Nota: A frequência de 92% é fictícia e demonstrativa nesta etapa do projeto.
}

// Executa a função assim que a página carrega
renderizarBoletim();