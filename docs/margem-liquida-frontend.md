# Pergunta de lucro limpo e tradução em tempo real

Branch `margem-liquida`, criada da `new-front`. Sem merge, push, PR ou deploy. Identidade do histórico recente: MarkusF502 <markusfilipe502@gmail.com>.

## Entrega

`MargemLiquidaInput` é usado no onboarding tradicional, na pendência de margem do wizard, na revisão da IA e nas configurações. O campo recebe fração decimal, mostra percentual entre 1 e 60, explica lucro limpo e permite alterar o custo de exemplo de R$ 50.

A tradução usa exclusivamente os números de `POST /api/precificacao/simular`, por `apiFetch`. Há debounce de 300 ms, cancelamento com AbortController e descarte de respostas de efeitos anteriores. Uma tradução de dados anteriores desaparece imediatamente ao editar. A região tem `aria-live="polite"`, `aria-atomic` e vínculo com o campo; a inviabilidade marca `aria-invalid`. O limite máximo devolvido pela API é exibido com até quatro casas percentuais para não arredondar um limite truncado para cima.

HTTP inválido, resposta incompleta, erro de rede ou endpoint indisponível deixam o campo editável, sem tradução. Não há fórmulas locais de preço, novas dependências ou mocks commitados.

O onboarding tradicional e o wizard identificam a margem inicial como sugestão para o posicionamento. A menção à extração da margem e o percentual de lucro foram removidos da descrição e do exemplo da IA. A ajuda explica as bases, distingue piso de preço sugerido e remove faixas sem fonte. O KPI foi renomeado para “Lucro limpo alvo”.

## Dados enviados e dependência da API

- Tradicional: usa custo fixo, volume, alíquota e a maior taxa dos canais já disponíveis na revisão.
- Revisão IA: usa custo fixo e volume atualmente editados. Alíquota e taxas vêm do endpoint determinístico existente `/api/loja/onboarding/inferir`; somente as premissas tributárias são aproveitadas, sem substituir os custos descritos pelo lojista. A maior taxa é selecionada entre os canais recebidos da API.
- Configurações: envia somente margem e custo de exemplo. Custos e taxas são os salvos na loja, conforme o contrato solicitado.
- Wizard: aceita os dados conhecidos da análise e o bloco opcional `dados_simulacao` das respostas de análise/pendências. As premissas tributárias também podem vir do endpoint determinístico acima.

**Dependência pendente:** a implementação atual do `maremu-api` devolve custo fixo e volume como nulos enquanto houver qualquer pendência, inclusive a própria margem. Portanto, para traduzir no wizard com os valores efetivamente resolvidos, a API precisa expor esses valores antes da conclusão. Foi solicitada autorização para complementar o backend; ele não foi alterado nesta tarefa. O consumidor está preparado para o seguinte bloco adicional:

```json
{
  "dados_simulacao": {
    "custo_fixo_mensal": 2700,
    "volume_vendas_esperado": 180,
    "aliquota_efetiva": 0.06,
    "taxa_canal": 0.035
  }
}
```

Sem esses dados ou uma loja já cadastrada, a API de simulação retorna 422 no wizard; o campo continua funcionando, sem tradução. O teste de tradução nesse ponto interceptou esse bloco adicional, não representa integração completa com o backend atual. Os outros pontos não dependem desse complemento.

## Decisões adicionais

- O endpoint determinístico de inferência é reutilizado para obter premissas tributárias na revisão IA; não chama IA nem persiste loja. A faixa enviada é `ate_10k`, pois a API atual define alíquota apenas por regime. Se esse contrato passar a considerar faixa, esse helper deverá acompanhar a mudança.
- A barra lateral fixa de 252 px tornava as configurações inutilizáveis em 390×844. Em telas menores ela agora mostra ícones, preservando os nomes acessíveis; em desktop mantém texto e largura originais. As configurações passam a usar uma coluna no celular, com espaçamentos menores, e o conteúdo principal permite encolhimento.
- Títulos da ajuda e do resumo financeiro que ainda associavam a margem ao preço piso foram alinhados ao conceito de lucro limpo.
- O exemplo numérico do pedido foi tratado como ilustrativo; a interface exibe os números devolvidos pela API, sem valores de preço fixos.

## Verificação

- `npm run lint`: os mesmos 7 problemas do baseline (4 erros e 3 warnings); nenhum novo problema. Arquivos preexistentes: cadastro, login, pdv, relatório e CountUp.
- `npm run build`: passou. A fonte Inter precisou de rede durante o build, como já ocorre no projeto.
- Navegador Chromium, com interceptações CDP em memória e scripts apenas em `/tmp`, sem acessar a IA ou gravar na API real: onboarding tradicional, wizard, revisão IA e configurações.
- Em cada ponto: tradução normal, custo de exemplo alterado, inviabilidade e marcação do campo, endpoint 503, resposta antiga mais lenta descartada, debounce de 300 ms, percentual fora da faixa, largura e campo utilizável em 390×844. Capturas móveis inspecionadas visualmente.
- Configurações: confirmado que o request não envia custos nem taxas. Tradicional: sugestão de posicionamento preenchida e identificada.
- `git diff --check`: sem erros.
