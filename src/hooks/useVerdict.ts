"use client";

import { useState, useEffect } from "react";
import { verdictStore, VerdictRecord } from "@/core/verdictStore";

export function useVerdict() {
  const [state, setState] = useState(() => verdictStore.getState());

  useEffect(() => {
    const unsubscribe = verdictStore.subscribe(() => {
      setState(verdictStore.getState());
    });
    return unsubscribe;
  }, []);

  return {
    currentRecord: state.currentRecord,
    history: state.history,
    addVerdict: (record: Omit<VerdictRecord, "id" | "timestamp">) =>
      verdictStore.addVerdict(record),
    clearHistory: () => verdictStore.clearHistory(),
    isDecisive: state.currentRecord ? state.currentRecord.confidence >= 75 : false
  };
}
