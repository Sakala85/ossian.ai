"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Downloads rows as a CSV file (semicolon-separated, opens directly in French Excel). */
export function CsvButton({ rows, filename, label = "Exporter CSV" }: { rows: Record<string, unknown>[]; filename: string; label?: string }) {
  const download = () => {
    const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    const csv = [headers.map(cell).join(";"), ...rows.map((r) => headers.map((h) => cell(r[h])).join(";"))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button variant="outline" size="sm" onClick={download} disabled={!rows.length}>
      <Download /> {label}
    </Button>
  );
}
