// hooks/useDashboard.ts
'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/src/lib/api';

type TendenciaDia = {
  data: string;
  label: string;
  faturamento: number;
  lucro: number;
};

type DashboardData = {
  resumo_dia: {
    faturamento: number;
    lucro_bruto: number;
    pecas_vendidas: number;
    ticket_medio: number;
  };
  tendencia_7dias: TendenciaDia[];
  top_produtos_semana: { nome: string; total_vendas: number }[];
  alertas_estoque: {
    produto_nome: string;
    tamanho: string;
    quantidade_estoque: number;
  }[];
  ultimas_transacoes: {
    nome: string;
    quantidade: number;
    preco_unitario_vendido: number;
    data_venda: string;
  }[];
};

export function useDashboard() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    apiFetch('/api/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar dashboard.');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}