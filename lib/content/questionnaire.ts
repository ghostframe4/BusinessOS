/**
 * Questionário guiado por entidade (camada de UX sobre o corpo Markdown).
 *
 * Cada entidade vira um conjunto de PERGUNTAS. Cada pergunta mapeia 1:1 para um
 * heading `##` do corpo Markdown — então o modelo de armazenamento continua sendo
 * o mesmo arquivo `# <title>` + seções `##` (nada muda no repositório/CLIs).
 *
 * O formulário renderiza uma pergunta por campo (com dica e exemplo), e as
 * respostas são remontadas no corpo por `renderAnswersBody`. Ao terminar, o
 * founder pede à IA (Claude Code) que analise as respostas e sintetize o briefing.
 *
 * `templates.ts` DERIVA os headings daqui — esta é a fonte única da estrutura do
 * corpo. Identificadores em inglês; conteúdo (perguntas/dicas) em pt-BR.
 */

/** Placeholder que o seed grava sob cada heading; tratado como "sem resposta". */
export const EMPTY_ANSWER = "_A preencher._";

export interface Question {
  /** Heading `##` correspondente no corpo Markdown (chave do round-trip). */
  heading: string;
  /** A pergunta, como o founder a lê. */
  label: string;
  /** Dica curta abaixo do campo — o que responder / como pensar. */
  hint?: string;
  /** Exemplo mostrado dentro do campo vazio. */
  placeholder?: string;
}

/**
 * id da entidade ("<section>/<entity>") -> perguntas guiadas.
 * A ordem das perguntas define a ordem das seções `##` no corpo.
 */
export const QUESTIONNAIRES: Record<string, Question[]> = {
  // ---------------------------------------------------------------- founder
  "founder/objetivo": [
    {
      heading: "Objetivo principal",
      label: "Qual é o objetivo central deste negócio, em uma frase?",
      hint: "O que você quer construir e para quem — direto ao ponto.",
      placeholder:
        "Ex.: Construir um SaaS de gestão financeira para pequenos escritórios de advocacia.",
    },
    {
      heading: "Ambição",
      label: "Quão grande é o sonho? Onde quer chegar no melhor cenário?",
      hint: "O tamanho da ambição — de projeto paralelo a mudar um setor inteiro.",
      placeholder:
        "Ex.: Ser a referência de gestão para escritórios boutique no Brasil em 5 anos.",
    },
    {
      heading: "Por que agora",
      label: "Por que agora é o momento certo para isso?",
      hint: "O que mudou — no mercado, na tecnologia ou na sua vida.",
      placeholder: "Ex.: A digitalização do setor jurídico acelerou e as ferramentas atuais são caras e antigas.",
    },
    {
      heading: "Como sabemos que chegamos",
      label: "Como você vai saber, de forma concreta, que chegou lá?",
      hint: "Metas mensuráveis com prazo — não sensações.",
      placeholder: "Ex.: R$ 50 mil de MRR e 200 escritórios ativos em 18 meses.",
    },
    {
      heading: "Restrições",
      label: "Quais são as restrições e os inegociáveis?",
      hint: "Limites de tempo, capital, sócios e riscos que você não aceita.",
      placeholder: "Ex.: Sem captação nos 12 primeiros meses; no máximo 30h/semana.",
    },
  ],
  "founder/estilo-de-vida": [
    {
      heading: "Vida que o negócio sustenta",
      label: "Que vida você quer que este negócio sustente?",
      hint: "Descreva um dia ou uma semana ideal daqui a alguns anos.",
      placeholder: "Ex.: Trabalhar de casa, manhãs livres com a família, sem viver de reuniões.",
    },
    {
      heading: "Tempo",
      label: "Quanto tempo você quer (e pode) dedicar?",
      hint: "Horas por semana, ritmo e quais épocas de pico são aceitáveis.",
      placeholder: "Ex.: 25–30h/semana, sem trabalhar fins de semana.",
    },
    {
      heading: "Renda",
      label: "Qual renda mensal o negócio precisa gerar para você?",
      hint: "O piso para viver bem e o número que consideraria um sucesso.",
      placeholder: "Ex.: Piso de R$ 15 mil/mês; sucesso a partir de R$ 40 mil/mês.",
    },
    {
      heading: "Liberdade e inegociáveis",
      label: "De que liberdade e inegociáveis você não abre mão?",
      hint: "Local, autonomia, tempo com a família — o que nunca sacrificaria.",
      placeholder: "Ex.: Autonomia total de agenda; morar onde eu quiser.",
    },
  ],

  // ---------------------------------------------------------------- direcao
  "direcao/mapa-do-mercado": [
    {
      heading: "Território",
      label: "Qual é o mercado/território onde o negócio joga?",
      hint: "Setor, nicho e fronteiras — onde começa e onde termina.",
      placeholder: "Ex.: Software de gestão para serviços jurídicos B2B no Brasil.",
    },
    {
      heading: "Players e alternativas",
      label: "Quem são os players e as alternativas atuais?",
      hint: "Concorrentes diretos, substitutos e o 'não fazer nada'.",
      placeholder: "Ex.: ERPs jurídicos legados, planilhas, e o próprio contador.",
    },
    {
      heading: "Tendências",
      label: "Que tendências estão mexendo com esse mercado?",
      hint: "Mudanças de tecnologia, comportamento ou regulação.",
      placeholder: "Ex.: IA aplicada a documentos e pressão por redução de custos.",
    },
    {
      heading: "Onde jogamos",
      label: "Onde exatamente você escolhe jogar — e onde não?",
      hint: "O recorte específico do mercado que é o seu alvo.",
      placeholder: "Ex.: Escritórios de 3 a 15 advogados; fora disso, não.",
    },
  ],
  "direcao/ima-de-problemas": [
    {
      heading: "Problemas que atraem",
      label: "Quais problemas te atraem e valem ser resolvidos?",
      hint: "Liste os problemas que você se sente puxado a resolver.",
      placeholder: "Ex.: Advogados perdem horas conciliando honorários manualmente.",
    },
    {
      heading: "Evidência de dor",
      label: "Que evidências mostram que a dor é real e forte?",
      hint: "Falas de clientes, dinheiro já gasto, gambiarras que usam hoje.",
      placeholder: "Ex.: Vários pagam estagiário só para montar planilhas de cobrança.",
    },
    {
      heading: "Priorização",
      label: "Qual problema atacar primeiro — e por quê?",
      hint: "Ordene por dor × frequência × sua vantagem para resolvê-lo.",
      placeholder: "Ex.: Conciliação de honorários: dói toda semana e sei automatizar.",
    },
  ],
  "direcao/perfil-ideal-de-cliente": [
    {
      heading: "Quem é",
      label: "Quem é o cliente ideal, exatamente?",
      hint: "Segmento, porte e cargo/persona — o mais específico possível.",
      placeholder: "Ex.: Sócio-administrador de escritório boutique com 5–15 advogados.",
    },
    {
      heading: "Contexto e gatilhos",
      label: "Em que contexto ele está e o que dispara a busca por solução?",
      hint: "O momento ou gatilho em que ele decide agir.",
      placeholder: "Ex.: Fechamento do mês vira caos; erra cobrança e perde dinheiro.",
    },
    {
      heading: "Dores",
      label: "Quais são as dores principais dele?",
      hint: "O que dói de verdade — na linguagem dele.",
      placeholder: "Ex.: 'Nunca sei quanto de fato entrou e de quem.'",
    },
    {
      heading: "Onde encontrar",
      label: "Onde você encontra esse cliente?",
      hint: "Canais, comunidades e lugares — físicos ou digitais.",
      placeholder: "Ex.: Grupos da OAB, eventos de advocacia, LinkedIn.",
    },
    {
      heading: "Anti-perfil",
      label: "Quem NÃO é seu cliente?",
      hint: "Quem você recusa mesmo que peça — evita clientes errados.",
      placeholder: "Ex.: Grandes bancas com TI própria; advogado solo informal.",
    },
  ],
  "direcao/tese-de-valor": [
    {
      heading: "Hipótese",
      label: "Qual é a sua hipótese de valor, em uma frase?",
      hint: "Acreditamos que [cliente] pagará por [solução] porque [motivo].",
      placeholder:
        "Ex.: Escritórios boutique pagarão por conciliação automática porque recuperam receita perdida.",
    },
    {
      heading: "Para quem",
      label: "Para quem essa tese vale primeiro?",
      hint: "O recorte de cliente em que ela é mais forte.",
      placeholder: "Ex.: Escritórios com muitos contratos de êxito e cobrança complexa.",
    },
    {
      heading: "Por que pagariam",
      label: "Por que esse cliente pagaria por isso?",
      hint: "O ganho concreto ou a dor evitada que justifica o preço.",
      placeholder: "Ex.: Recupera ~R$ 8 mil/mês em honorários que hoje escapam.",
    },
    {
      heading: "Evidências",
      label: "Que evidências você já tem a favor da tese?",
      hint: "Conversas, pré-vendas, sinais claros de demanda.",
      placeholder: "Ex.: 6 de 8 sócios entrevistados toparam pagar por um piloto.",
    },
    {
      heading: "Riscos da tese",
      label: "Quais são os maiores riscos de a tese estar errada?",
      hint: "As suposições que, se falsas, derrubam tudo.",
      placeholder: "Ex.: Talvez tratem a perda como custo aceitável e não priorizem.",
    },
  ],
  "direcao/oferta": [
    {
      heading: "Promessa",
      label: "Qual é a promessa central da oferta?",
      hint: "O resultado que o cliente leva — não a funcionalidade.",
      placeholder: "Ex.: 'Você nunca mais perde honorário por erro de cobrança.'",
    },
    {
      heading: "Formato e entrega",
      label: "Como a oferta é entregue, na prática?",
      hint: "Produto, serviço, formato — o que o cliente recebe.",
      placeholder: "Ex.: App web + integração bancária + relatório mensal automático.",
    },
    {
      heading: "Preço e modelo",
      label: "Qual é o preço-hipótese e o modelo de cobrança?",
      hint: "Valor, recorrência ou avulso, e por que esse número.",
      placeholder: "Ex.: R$ 390/mês por escritório, ancorado no valor recuperado.",
    },
    {
      heading: "Diferencial",
      label: "O que torna a oferta difícil de copiar ou claramente melhor?",
      hint: "Seu ângulo único frente às alternativas.",
      placeholder: "Ex.: Único que concilia honorário de êxito automaticamente.",
    },
  ],

  // -------------------------------------------------------------- validacao
  "validacao/oferta": [
    {
      heading: "Oferta em teste",
      label: "Qual versão da oferta você está testando agora?",
      hint: "A oferta concreta que foi a campo.",
      placeholder: "Ex.: Piloto de 3 meses a R$ 290/mês com onboarding assistido.",
    },
    {
      heading: "Experimentos",
      label: "Que experimentos você rodou para validá-la?",
      hint: "Como testou: conversas, landing, pré-venda, piloto.",
      placeholder: "Ex.: Landing + 20 ligações + 5 pilotos pagos.",
    },
    {
      heading: "Resultados",
      label: "Quais foram os resultados?",
      hint: "Números e falas — o que funcionou e o que não.",
      placeholder: "Ex.: 5/5 renovaram; a integração bancária foi o maior atrito.",
    },
    {
      heading: "Ajustes",
      label: "Que ajustes os resultados sugerem?",
      hint: "O que mudar na oferta com base no aprendizado.",
      placeholder: "Ex.: Simplificar onboarding e subir preço para R$ 390.",
    },
    {
      heading: "Decisão",
      label: "Qual é a decisão: seguir, pivotar ou parar?",
      hint: "A conclusão deste ciclo de validação.",
      placeholder: "Ex.: Seguir e escalar a captação para o mesmo perfil.",
    },
  ],
  "validacao/primeiros-clientes": [
    {
      heading: "Clientes",
      label: "Quem são seus primeiros clientes?",
      hint: "Nomes ou perfis dos que já pagaram ou usaram.",
      placeholder: "Ex.: 5 escritórios boutique em SP e BH, 4–10 advogados cada.",
    },
    {
      heading: "Como chegaram",
      label: "Como eles chegaram até você?",
      hint: "Canal e caminho — indicação, busca, prospecção.",
      placeholder: "Ex.: 3 por indicação, 2 por prospecção no LinkedIn.",
    },
    {
      heading: "O que compraram",
      label: "O que exatamente compraram e por quanto?",
      hint: "Oferta, ticket e frequência.",
      placeholder: "Ex.: Plano mensal a R$ 290; ticket médio ~R$ 300.",
    },
    {
      heading: "Aprendizados",
      label: "O que você aprendeu com eles?",
      hint: "Padrões, objeções e o que mais valorizaram.",
      placeholder: "Ex.: Valorizam o relatório mensal mais do que a automação em si.",
    },
    {
      heading: "Próximos passos",
      label: "Quais são os próximos passos com base nisso?",
      hint: "O que fazer para conquistar os próximos clientes.",
      placeholder: "Ex.: Transformar o relatório em destaque do pitch e pedir indicações.",
    },
  ],

  // ------------------------------------------------------------------ caixa
  "caixa/fluxo-de-caixa": [
    {
      heading: "Resumo do mês",
      label: "Como foi o mês em caixa, em uma frase?",
      hint: "O panorama geral do período.",
      placeholder: "Ex.: Mês positivo: receita cresceu 12% e a queima caiu.",
    },
    {
      heading: "Entradas",
      label: "Quais foram as principais entradas?",
      hint: "De onde veio o dinheiro e quanto.",
      placeholder: "Ex.: R$ 22 mil de mensalidades + R$ 4 mil de setup.",
    },
    {
      heading: "Saídas",
      label: "Quais foram as principais saídas?",
      hint: "Para onde foi o dinheiro e quanto.",
      placeholder: "Ex.: R$ 9 mil de infra e ferramentas + R$ 6 mil de PJ.",
    },
    {
      heading: "Saldo e runway",
      label: "Qual o saldo atual e por quantos meses ele dura?",
      hint: "Caixa disponível e runway na queima atual.",
      placeholder: "Ex.: R$ 80 mil em caixa; ~10 meses de runway.",
    },
    {
      heading: "Premissas",
      label: "Que premissas sustentam essa projeção?",
      hint: "O que você assumiu sobre receita e custos.",
      placeholder: "Ex.: Crescimento de 8%/mês e custos estáveis.",
    },
  ],
  "caixa/erp": [
    {
      heading: "Sistema e ferramentas",
      label: "Que sistema e ferramentas você usa para a gestão financeira?",
      hint: "ERP, planilhas, banco, contador.",
      placeholder: "Ex.: Conta PJ + planilha + contador terceirizado.",
    },
    {
      heading: "Regime e obrigações",
      label: "Qual o regime tributário e as obrigações?",
      hint: "Regime, impostos e prazos que precisa cumprir.",
      placeholder: "Ex.: Simples Nacional; DAS todo dia 20.",
    },
    {
      heading: "Processos",
      label: "Como funcionam os processos financeiros hoje?",
      hint: "Quem lança, quem concilia e com que frequência.",
      placeholder: "Ex.: Eu lanço semanalmente; o contador concilia no fechamento.",
    },
    {
      heading: "Pendências",
      label: "Quais pendências ou riscos financeiros estão abertos?",
      hint: "O que falta organizar ou resolver.",
      placeholder: "Ex.: Separar melhor PF de PJ e emitir notas em dia.",
    },
  ],
};

/** Perguntas de um id; array vazio se a entidade não tiver questionário. */
export function questionnaireFor(id: string): Question[] {
  return QUESTIONNAIRES[id] ?? [];
}

/**
 * Extrai as respostas do corpo Markdown: quebra por headings `##` e captura o
 * texto sob cada um. `_A preencher._` e seções vazias viram string vazia.
 * Retorna um mapa `heading -> resposta` para cada pergunta do questionário.
 */
export function parseAnswers(
  body: string,
  questions: Question[],
): Record<string, string> {
  const sections = new Map<string, string>();
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = (): void => {
    if (current !== null) sections.set(current, buffer.join("\n").trim());
    buffer = [];
  };

  for (const line of body.split(/\r?\n/)) {
    const match = /^##\s+(.*)$/.exec(line);
    if (match) {
      flush();
      current = match[1].trim();
    } else if (current !== null) {
      buffer.push(line);
    }
  }
  flush();

  const answers: Record<string, string> = {};
  for (const q of questions) {
    const raw = sections.get(q.heading) ?? "";
    answers[q.heading] = raw === EMPTY_ANSWER ? "" : raw;
  }
  return answers;
}

/**
 * Remonta o corpo Markdown a partir das respostas: um H1 com o `title` seguido
 * de um `##` por pergunta (na ordem do questionário). Resposta vazia grava o
 * placeholder `_A preencher._`, preservando o template de headings.
 */
export function renderAnswersBody(
  title: string,
  questions: Question[],
  answers: Record<string, string>,
): string {
  const lines: string[] = [`# ${title}`, ""];
  for (const q of questions) {
    lines.push(`## ${q.heading}`, "");
    const answer = (answers[q.heading] ?? "").trim();
    lines.push(answer.length > 0 ? answer : EMPTY_ANSWER, "");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
