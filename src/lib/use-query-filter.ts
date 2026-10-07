"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useQueryFilter(key: string) {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const value = search.get(key) ?? "";

  function setValue(next: string) {
    const params = new URLSearchParams(search.toString());
    if (next) params.set(key, next);
    else params.delete(key);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return [value, setValue] as const;
}
