'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { PromptField } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';

interface Props {
  contentId: string;
  field: PromptField;
  label?: string;
  size?: 'sm' | 'md';
  onResult?: (text: string) => void;
}

export function RegenerateButton({ contentId, field, label, size = 'sm', onResult }: Props) {
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      api<{ field: PromptField; value: string }>(`/contents/${contentId}/regenerate`, {
        method: 'POST',
        json: { field },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      queryClient.invalidateQueries({ queryKey: ['content-versions', contentId] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      queryClient.invalidateQueries({ queryKey: ['ai-cost'] });
      onResult?.(data.value);
    },
    onError: (e: Error) => alert(e.message),
  });

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={() => mut.mutate()}
      disabled={mut.isPending}
      title={`Regerar ${field}`}
    >
      <Sparkles className="h-3.5 w-3.5 mr-1" />
      {mut.isPending ? 'Gerando…' : (label ?? 'Regerar')}
    </Button>
  );
}
