// Configuração fixa do estudante (não editável pela interface)
const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 2,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variável de sessão (armazenada somente em memória)
let pinSessao = "";
let emModoEdicao = false;

// Dados brutos locais/fictícios das disciplinas (Array de Objetos)
let dadosDisciplinas = [
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

// Função para ajustar e padronizar qualquer nota de 0 a 10 (Dados antigos/iniciais)
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  let numero = typeof valor === "string" ? parseFloat(valor.replace(",", ".")) : Number(valor);

  if (isNaN(numero)) return null;

  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  return null;
}

// Validação estrita para as notas digitadas no editor (0 a 10 ou vazio)
function validarNotaDigitada(str) {
  if (str === null || str === undefined) return { valida: true, valor: null };
  const textoLimpo = String(str).trim().replace(",", ".");
  if (textoLimpo === "") return { valida: true, valor: null };

  const num = Number(textoLimpo);
  if (!isNaN(num) && num >= 0 && num <= 10) {
    return { valida: true, valor: num };
  }
  return { valida: false, valor: null };
}

// Validação estrita para as faltas digitadas no editor (Inteiro >= 0)
function validarFaltaDigitada(str) {
  if (str === null || str === undefined) return { valida: false, valor: null };
  const textoLimpo = String(str).trim();
  if (textoLimpo === "") return { valida: false, valor: null };

  const num = Number(textoLimpo);
  if (!isNaN(num) && Number.isInteger(num) && num >= 0) {
    return { valida: true, valor: num };
  }
  return { valida: false, valor: null };
}

// Realiza a autenticação e busca dos dados na API
async function fazerLogin() {
  const campoPin = document.getElementById("campo-pin");
  const msgStatus = document.getElementById("mensagem-status");
  const pinDigitado = campoPin.value.trim();

  if (!pinDigitado) {
    msgStatus.textContent = "Por favor, digite o PIN.";
    return;
  }

  msgStatus.style.color = "#a78bfa";
  msgStatus.textContent = "Conectando...";

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
      msgStatus.style.color = "#f87171";
      msgStatus.textContent = "Turma, chamada ou PIN inválidos.";
      return;
    }

    if (resposta.status === 429) {
      msgStatus.style.color = "#f87171";
      msgStatus.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      return;
    }

    if (!resposta.ok) {
      msgStatus.style.color = "#f87171";
      msgStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      return;
    }

    const resultado = await resposta.json();

    // Guarda o PIN em memória durante a sessão e limpa o campo do formulário
    pinSessao = pinDigitado;
    campoPin.value = "";
    msgStatus.textContent = "";

    // Se existirem dados salvos na API, eles substituem os dados locais
    if (resultado && resultado.dados && Array.isArray(resultado.dados.disciplinas)) {
      dadosDisciplinas = resultado.dados.disciplinas;
    }

    // Exibe o boletim e oculta a tela de acesso
    document.getElementById("secao-acesso").style.display = "none";
    document.getElementById("conteudo-boletim").style.display = "block";

    renderizarBoletim();

  } catch (erro) {
    msgStatus.style.color = "#f87171";
    msgStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
  }
}

// Função principal de renderização da tabela e dos cards
function renderizarBoletim() {
  const corpoTabela = document.getElementById("tabela-corpo");
  corpoTabela.innerHTML = "";

  let somaDasMediasGerais = 0;
  let quantidadeDisciplinasComMedia = 0;
  let acumuladorTotalFaltas = 0;
  let contadorBomDesempenho = 0;
  let contadorAtencao = 0;

  dadosDisciplinas.forEach((item, index) => {
    // Normalização das notas para exibição ou cálculo
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const faltasArray = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const f1 = faltasArray[0] ?? 0;
    const f2 = faltasArray[1] ?? 0;
    const f3 = faltasArray[2] ?? 0;

    const totalFaltasDisciplina = f1 + f2 + f3;
    acumuladorTotalFaltas += totalFaltasDisciplina;

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

    const linha = document.createElement("tr");

    if (emModoEdicao) {
      // Formatação em modo de edição com inputs seguros
      linha.innerHTML = `
        <td class="col-disciplina"></td>
        <td><input type="text" class="input-edicao" id="edit-n1-${index}" value="${n1 !== null ? String(n1).replace(".", ",") : ""}"></td>
        <td><input type="text" class="input-edicao" id="edit-n2-${index}" value="${n2 !== null ? String(n2).replace(".", ",") : ""}"></td>
        <td><input type="text" class="input-edicao" id="edit-n3-${index}" value="${n3 !== null ? String(n3).replace(".", ",") : ""}"></td>
        <td><strong>${mediaTexto}</strong></td>
        <td>
          <input type="text" class="input-edicao" id="edit-f1-${index}" value="${f1}" title="Faltas Tri 1" style="width: 35px;">
          <input type="text" class="input-edicao" id="edit-f2-${index}" value="${f2}" title="Faltas Tri 2" style="width: 35px;">
          <input type="text" class="input-edicao" id="edit-f3-${index}" value="${f3}" title="Faltas Tri 3" style="width: 35px;">
        </td>
        <td class="${classeSituacao}">${situacaoTexto}</td>
      `;
      // Inserção segura do nome da disciplina via textContent
      linha.querySelector(".col-disciplina").textContent = item.disciplina;
    } else {
      // Exibição padrão da tabela
      const tdDisciplina = document.createElement("td");
      const strongDisc = document.createElement("strong");
      strongDisc.textContent = item.disciplina;
      tdDisciplina.appendChild(strongDisc);

      const tdTri1 = document.createElement("td");
      tdTri1.textContent = n1 !== null ? n1.toFixed(1).replace(".", ",") : "Ainda não lançada";

      const tdTri2 = document.createElement("td");
      tdTri2.textContent = n2 !== null ? n2.toFixed(1).replace(".", ",") : "Ainda não lançada";

      const tdTri3 = document.createElement("td");
      tdTri3.textContent = n3 !== null ? n3.toFixed(1).replace(".", ",") : "Ainda não lançada";

      const tdMedia = document.createElement("td");
      const strongMedia = document.createElement("strong");
      strongMedia.textContent = mediaTexto;
      tdMedia.appendChild(strongMedia);

      const tdFaltas = document.createElement("td");
      tdFaltas.textContent = totalFaltasDisciplina;

      const tdSituacao = document.createElement("td");
      tdSituacao.className = classeSituacao;
      tdSituacao.textContent = situacaoTexto;

      linha.appendChild(tdDisciplina);
      linha.appendChild(tdTri1);
      linha.appendChild(tdTri2);
      linha.appendChild(tdTri3);
      linha.appendChild(tdMedia);
      linha.appendChild(tdFaltas);
      linha.appendChild(tdSituacao);
    }

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
}

// Alterna a interface para o modo de edição
function toggleEdicao() {
  emModoEdicao = true;
  document.getElementById("btn-alterar-dados").style.display = "none";
  document.getElementById("btn-salvar-dados").style.display = "inline-block";
  document.getElementById("btn-cancelar-edicao").style.display = "inline-block";
  renderizarBoletim();
}

// Cancela as alterações e volta ao modo de visualização
function cancelarEdicao() {
  emModoEdicao = false;
  document.getElementById("btn-alterar-dados").style.display = "inline-block";
  document.getElementById("btn-salvar-dados").style.display = "none";
  document.getElementById("btn-cancelar-edicao").style.display = "none";
  renderizarBoletim();
}

// Valida os campos editados e envia as atualizações para a API
async function salvarDadosApi() {
  let houverErro = false;
  const novosDadosDisciplinas = [];

  // Remove marcações de erros anteriores
  document.querySelectorAll(".input-edicao").forEach(input => input.classList.remove("invalido"));

  for (let index = 0; index < dadosDisciplinas.length; index++) {
    const inputN1 = document.getElementById(`edit-n1-${index}`);
    const inputN2 = document.getElementById(`edit-n2-${index}`);
    const inputN3 = document.getElementById(`edit-n3-${index}`);
    const inputF1 = document.getElementById(`edit-f1-${index}`);
    const inputF2 = document.getElementById(`edit-f2-${index}`);
    const inputF3 = document.getElementById(`edit-f3-${index}`);

    const resN1 = validarNotaDigitada(inputN1.value);
    const resN2 = validarNotaDigitada(inputN2.value);
    const resN3 = validarNotaDigitada(inputN3.value);

    const resF1 = validarFaltaDigitada(inputF1.value);
    const resF2 = validarFaltaDigitada(inputF2.value);
    const resF3 = validarFaltaDigitada(inputF3.value);

    if (!resN1.valida) { inputN1.classList.add("invalido"); houverErro = true; }
    if (!resN2.valida) { inputN2.classList.add("invalido"); houverErro = true; }
    if (!resN3.valida) { inputN3.classList.add("invalido"); houverErro = true; }

    if (!resF1.valida) { inputF1.classList.add("invalido"); houverErro = true; }
    if (!resF2.valida) { inputF2.classList.add("invalido"); houverErro = true; }
    if (!resF3.valida) { inputF3.classList.add("invalido"); houverErro = true; }

    if (!houverErro) {
      novosDadosDisciplinas.push({
        disciplina: dadosDisciplinas[index].disciplina,
        tri1: resN1.valor,
        tri2: resN2.valor,
        tri3: resN3.valor,
        faltas: [resF1.valor, resF2.valor, resF3.valor]
      });
    }
  }

  if (houverErro) {
    alert("Existem campos com valores inválidos. Verifique os campos destacados em vermelho.");
    return;
  }

  const btnSalvar = document.getElementById("btn-salvar-dados");
  const textoOriginal = btnSalvar.textContent;
  btnSalvar.textContent = "Salvando...";
  btnSalvar.disabled = true;

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novosDadosDisciplinas
        }
      })
    });

    if (resposta.ok) {
      dadosDisciplinas = novosDadosDisciplinas;
      emModoEdicao = false;
      document.getElementById("btn-alterar-dados").style.display = "inline-block";
      document.getElementById("btn-salvar-dados").style.display = "none";
      document.getElementById("btn-cancelar-edicao").style.display = "none";
      renderizarBoletim();
      alert("Dados salvos com sucesso.");
    } else {
      alert("Erro ao salvar os dados no servidor. Tente novamente.");
    }
  } catch (erro) {
    alert("Erro de conexão ao tentar salvar os dados.");
  } finally {
    btnSalvar.textContent = textoOriginal;
    btnSalvar.disabled = false;
  }
}