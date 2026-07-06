// ─── Dicionário de Ajuda (Conteúdo dos Artigos) ───────────────────────────

const HELP_ARTICLES: Record<string, { titulo: string; o_que_e: string; como_descobrir: string; por_que_importa: string }> = {
  posicionamento_mercado: {
    titulo: "Posicionamento de Mercado",
    o_que_e: "É a categoria que define o perfil da sua loja perante o cliente: Popular (foco em preço baixo e alto volume), Médio (equilíbrio entre preço e qualidade) ou Premium (peças exclusivas, atendimento diferenciado e ticket mais alto).",
    como_descobrir: "Observe onde sua loja está localizada, o perfil do seu cliente atual, o valor médio das peças que você vende e como você se compara aos concorrentes da região. Se a maioria das suas vendas depende de preço baixo, você é Popular. Se seus clientes pagam mais por exclusividade e atendimento, você é Premium.",
    por_que_importa: "Esse posicionamento influencia diretamente a Margem de Lucro Desejada e o Preço Piso sugerido pelo sistema. Lojas Populares trabalham com margens menores e giro alto, enquanto lojas Premium sustentam margens maiores com giro mais baixo."
  },
  regime_tributario: {
    titulo: "Regime Tributário",
    o_que_e: "É o modelo de tributação escolhido pela sua empresa junto à Receita Federal, que define como os impostos são calculados: Simples Nacional (mais comum para pequenas e médias empresas, com alíquota única mensal via DAS), Lucro Presumido (tributação sobre uma margem de lucro presumida por lei) ou Lucro Real (tributação sobre o lucro efetivamente apurado, mais comum em empresas de maior porte).",
    como_descobrir: "Consulte seu contador ou verifique o Cartão CNPJ da sua empresa, que informa o regime tributário atual. A maioria das lojas de roupa de pequeno e médio porte está enquadrada no Simples Nacional.",
    por_que_importa: "O regime tributário define como a Alíquota de Imposto é calculada e aplicada sobre cada venda. Errar o regime na configuração pode fazer o sistema calcular um Preço Piso incorreto, subestimando ou superestimando o imposto embutido no preço."
  },
  custo_fixo_mensal: {
    titulo: "Custo Fixo Mensal",
    o_que_e: "São todas as contas que chegam todo mês na sua loja, independentemente de você vender 1 peça ou 1.000 peças.",
    como_descobrir: "Some os valores médios de: Aluguel do ponto, Conta de Luz, Água, Internet, Mensalidade do Contador, Pró-labore (seu salário fixo) e a mensalidade do sistema.",
    por_que_importa: "O sistema pega esse valor total e divide pela sua estimativa de vendas para saber quantos reais cada peça de roupa precisa ajudar a pagar para manter a loja de portas abertas."
  },
  margem_lucro_desejada: {
    titulo: "Margem de Lucro Desejada",
    o_que_e: "É o percentual de lucro líquido que você quer que sobre no seu bolso após pagar o custo de compra da peça, os impostos, as taxas de cartão e a parcela do custo fixo.",
    como_descobrir: "Isso depende muito do seu público e posicionamento. Lojas populares (focadas em volume) costumam girar em torno de 20% a 30%. Lojas premium (peças exclusivas) podem trabalhar com 50% ou mais.",
    por_que_importa: "É o coração da sua precificação inteligente. O sistema vai usar esse número exato como alvo para calcular o 'Preço Piso' de todos os seus produtos."
  },
  aliquota_efetiva: {
    titulo: "Alíquota de Imposto",
    o_que_e: "É o percentual exato do valor de uma venda que vai para o governo na forma de impostos. Para quem vende roupas (comércio), essa taxa não é fixa: ela aumenta conforme o faturamento anual da sua loja cresce.",
    como_descobrir: "Para descobrir sozinho (se você for do Simples Nacional): Pegue o PDF do extrato da sua última guia DAS (o documento gerado junto com o boleto mensal). Procure pela linha escrita 'Alíquota Efetiva'. Outra forma é acessar o portal do Simples Nacional (PGDAS-D) usando seu login Gov.br e consultar o extrato de apuração do mês anterior. Se a sua loja for Lucro Presumido ou Real, a conta é manual: some todos os impostos pagos no mês (ICMS, PIS, COFINS, IRPJ, CSLL) e divida pelo faturamento total do mês para achar a porcentagem real.",
    por_que_importa: "Se você não embutir esse percentual certinho no cálculo do seu Preço Piso, o dinheiro do imposto vai sair direto da sua margem de lucro. A loja pode acabar tendo prejuízo mesmo vendendo muito, porque você estará 'pagando para trabalhar'."
  },
  volume_vendas_esperado: {
    titulo: "Volume de Vendas Esperado",
    o_que_e: "É a estimativa de quantas peças de roupa individuais saem da sua loja e são vendidas por mês.",
    como_descobrir: "Se você já tem histórico, basta olhar seus relatórios de vendas passados. Se a loja for nova, faça uma estimativa conservadora baseada na sua meta de faturamento dividida pelo ticket médio esperado.",
    por_que_importa: "Esse número é usado exclusivamente para ratear o Custo Fixo. Se o custo fixo é R$ 2.000 e você vende 200 peças, cada peça precisa embutir R$ 10,00 de custo fixo no preço."
  },
  faturamento_medio_mensal: {
    titulo: "Faturamento Médio Mensal",
    o_que_e: "É o valor total, em reais, que a sua loja costuma receber em vendas ao longo de um mês, antes de descontar qualquer custo, imposto ou taxa.",
    como_descobrir: "Some o total de todas as vendas dos últimos 3 a 6 meses e divida pela quantidade de meses. Se a loja for nova, use como base a sua meta de faturamento ou a média do seu segmento na região.",
    por_que_importa: "Esse valor é essencial para descobrir corretamente a sua faixa de alíquota no Simples Nacional (que muda conforme o quanto você fatura) e também para avaliar se o seu Custo Fixo Mensal está em uma proporção saudável em relação ao que a loja arrecada."
  },
  taxa_canais_venda: {
    titulo: "Taxa dos Canais de Venda",
    o_que_e: "É o percentual (ou valor fixo) que cada canal de venda desconta do valor da peça antes de repassar o dinheiro para você. Loja Física costuma ter taxa de cartão de crédito/débito, Instagram/Whatsapp costuma ter taxa de gateway de pagamento (Pix, cartão), e MarketPlace geralmente cobra uma comissão mais alta pela intermediação e exposição do produto.",
    como_descobrir: "Verifique as taxas cobradas pela sua maquininha de cartão, pelo aplicativo de pagamento que você usa nas redes sociais e pelo regulamento de comissões do marketplace onde você vende (como Shopee, Mercado Livre ou Elo7).",
    por_que_importa: "Cada canal de venda 'come' uma parte diferente do preço final. Sem considerar essa taxa específica de cada canal, o Preço Piso calculado pode parecer lucrativo na teoria, mas na prática devolver menos dinheiro do que o esperado dependendo de onde a peça foi vendida."
  }
};

export { HELP_ARTICLES };