'use client';

import { Select } from '@/components/ui/select';
import { useCurrentSite } from '@/components/providers/current-site-provider';

export function SiteSwitcher() {
  const { sites, currentSiteId, setCurrentSiteId, loading } = useCurrentSite();

  if (loading) {
    return <div className="h-10 w-48 rounded-md bg-muted animate-pulse" />;
  }
  if (sites.length === 0) {
    return <span className="text-sm text-muted-foreground">Nenhum site</span>;
  }

  return (
    <Select
      value={currentSiteId ?? ''}
      onChange={(e) => setCurrentSiteId(e.target.value)}
      className="w-48"
    >
      {sites.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </Select>
  );
}
