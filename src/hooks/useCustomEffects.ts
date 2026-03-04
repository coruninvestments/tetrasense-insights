import { useState, useEffect } from "react";

const STORAGE_KEY = "signalleaf_custom_effects";

export interface CustomEffectDef {
  name: string;
}

export function useCustomEffects() {
  const [customEffects, setCustomEffects] = useState<CustomEffectDef[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customEffects));
  }, [customEffects]);

  const addCustomEffect = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (customEffects.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) return;
    setCustomEffects((prev) => [...prev, { name: trimmed }]);
  };

  const removeCustomEffect = (name: string) => {
    setCustomEffects((prev) => prev.filter((e) => e.name !== name));
  };

  return { customEffects, addCustomEffect, removeCustomEffect };
}
