"use client";

import type { ChangeEventHandler } from "react";

import type { BackupPayload } from "@/lib/types";

interface ExportImportProps {
  onExport: () => Promise<BackupPayload>;
  onImport: (payload: BackupPayload) => Promise<void>;
}

export function ExportImport({ onExport, onImport }: ExportImportProps) {
  const handleExport = async () => {
    const payload = await onExport();
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sanctuary-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const payload = JSON.parse(text) as BackupPayload;
    await onImport(payload);
    event.target.value = "";
  };

  return (
    <div className="pageWrap">
      <div className="backupStrip">
        <p>Your writing lives only in this browser &mdash; export regularly to keep it safe</p>
        <div className="backupActions">
          <button type="button" className="btnSmall" onClick={handleExport}>
            Export
          </button>
          <label className="uploadButton">
            Import
            <input type="file" accept="application/json" onChange={handleImport} hidden />
          </label>
        </div>
      </div>
    </div>
  );
}
