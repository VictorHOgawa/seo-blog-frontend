export function formatCostCents(cents: number): string {
  const usd = cents / 100;
  if (usd === 0) return 'US$ 0,00';
  if (usd < 0.01) return `US$ ${usd.toFixed(4)}`;
  return `US$ ${usd.toFixed(2)}`;
}

export function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
