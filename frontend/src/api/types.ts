/** Tipos espelhando os schemas da API (backend/app/schemas). */

export type PerfilAcesso = 'Administrador' | 'Gestor' | 'Analista' | 'Visualizador';
export type StatusProcesso = 'Ativo' | 'Inativo';
export type PosicaoRenault = 'Polo Ativo' | 'Polo Passivo';
export type FaixaRisco = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo: string | null;
  perfil: PerfilAcesso;
  status: 'Ativo' | 'Inativo';
  iniciais: string;
  ultimo_acesso: string | null;
  data_cadastro: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

export interface Movimentacao {
  id: number;
  data: string | null;
  tipo: 'audiencia' | 'despacho' | 'recurso' | 'sentenca' | 'citacao' | 'outros';
  descricao: string;
}

export interface HistoricoAlteracao {
  id: number;
  data: string;
  usuario_nome: string | null;
  campo: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  origem: string;
}

export interface Processo {
  id: number;
  numero_autos: string;
  status: StatusProcesso;
  autor_reu: string;
  natureza: string;
  vara: string | null;
  comarca: string | null;
  data_inicio: string | null;
  posicao_renault: PosicaoRenault;
  defesa_realizada: boolean;
  fase_processual: string;
  valor_causa: number;
  valor_risco: number;
  risco: FaixaRisco;
  escritorio: string | null;
  ultima_movimentacao: string | null;
  total_movimentacoes: number;
}

export interface ProcessoDetalhe extends Processo {
  resumo: string | null;
  movimentacoes_texto: string | null;
  criado_em: string;
  atualizado_em: string;
  movimentacoes: Movimentacao[];
  historico: HistoricoAlteracao[];
}

export interface ProcessoLista {
  itens: Processo[];
  total: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
}

export interface Kpi {
  valor: number;
  variacao_percentual: number | null;
  positivo: boolean;
}

export interface DashboardResponse {
  kpis: {
    total_processos: Kpi;
    processos_ativos: Kpi;
    processos_inativos: Kpi;
    valor_causa_total: Kpi;
    valor_risco_total: Kpi;
    defesa_pendente: Kpi;
  };
  evolucao: { mes: string; processos: number; valor_causa: number; valor_risco: number }[];
  por_natureza: ItemCategoria[];
  por_fase: ItemCategoria[];
  por_risco: ItemCategoria[];
  por_posicao: ItemCategoria[];
  risco_por_natureza: ItemCategoria[];
  pontos_atencao: PontoAtencao[];
  processos_recentes: Processo[];
}

export interface ItemCategoria {
  label: string;
  quantidade: number;
  valor_risco: number;
  valor_causa: number;
}

export interface PontoAtencao {
  tipo: string;
  texto: string;
  quantidade: number;
  severidade: 'info' | 'alerta' | 'critico';
}

export interface FiltroOpcoes {
  naturezas: string[];
  comarcas: string[];
  varas: string[];
  fases: string[];
  escritorios: string[];
  riscos: string[];
  status: string[];
  posicoes: string[];
}

export interface Inconsistencia {
  id: number;
  linha: number;
  campo: string;
  problema: string;
  valor_original: string | null;
  numero_autos: string | null;
  bloqueante: boolean;
  status: 'Pendente' | 'Corrigido' | 'Ignorado' | 'Revisar depois';
}

export interface Importacao {
  id: number;
  arquivo: string;
  escritorio: string | null;
  data: string;
  usuario_nome: string | null;
  total_processos: number;
  registros_validos: number;
  total_inconsistencias: number;
  criados: number;
  atualizados: number;
  status: 'Processando' | 'Concluído' | 'Concluído com alertas' | 'Erro';
  duracao_ms: number | null;
}

export interface ImportacaoDetalhe extends Importacao {
  mensagem_erro: string | null;
  inconsistencias: Inconsistencia[];
}

export interface EtapaProcessamento {
  nome: string;
  concluida: boolean;
  detalhe: string | null;
}

export interface ImportacaoResultado {
  importacao: Importacao;
  etapas: EtapaProcessamento[];
  inconsistencias: Inconsistencia[];
  processos_ativos: number;
  valor_risco_total: number;
  valor_causa_total: number;
}

export interface PreviewPlanilha {
  arquivo: string;
  total_linhas: number;
  colunas: { coluna_planilha: string; campo_sistema: string | null; reconhecida: boolean }[];
  colunas_obrigatorias_ausentes: string[];
  amostra: Record<string, string | null>[];
}

export interface Insight {
  texto: string;
  tipo: 'positivo' | 'alerta' | 'critico' | 'info';
}

export interface AnalisesResponse {
  evolucao: { mes: string; processos: number; valor_causa: number; valor_risco: number }[];
  naturezas_maior_exposicao: ItemCategoria[];
  comarcas_maior_concentracao: ItemCategoria[];
  fases_maior_volume: ItemCategoria[];
  processos_alto_risco: number;
  processos_sem_defesa: number;
  processos_sem_movimentacao: number;
  valor_risco_alto_critico: number;
  insights: Insight[];
}

export interface RelatorioPreview {
  total_processos: number;
  valor_causa_total: number;
  valor_risco_total: number;
  processos_ativos: number;
  processos_criticos: number;
  por_natureza: ItemCategoria[];
  amostra: Processo[];
}

/** Filtros globais aceitos por dashboard, processos, análises e relatórios. */
export interface FiltrosProcesso {
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  natureza?: string;
  comarca?: string;
  vara?: string;
  posicao?: string;
  fase?: string;
  escritorio?: string;
  risco?: string;
  busca?: string;
}
