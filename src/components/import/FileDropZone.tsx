"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";

interface FileDropZoneProps {
  onImportComplete: (count: number) => void;
}

export function FileDropZone({ onImportComplete }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [textInput, setTextInput] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      setError("");
      setWarning("");
      setIsLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      if (textInput) formData.append("text", textInput);

      try {
        const res = await fetch("/api/import", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Import başarısız");
        }

        if (data.warning) setWarning(data.warning);
        onImportComplete(data.count);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    },
    [textInput, onImportComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleTextImport = async () => {
    if (!textInput.trim()) return;
    setError("");
    setWarning("");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("text", textInput);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import başarısız");
      }

      if (data.warning) setWarning(data.warning);
      onImportComplete(data.count);
      setTextInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-tider-green/30 bg-tider-green-light/20 py-20">
        <LoadingSpinner size="lg" message="Görevler çıkarılıyor..." />
        <div className="mt-6 flex items-center gap-2 text-sm text-tider-green">
          <Sparkles className="h-4 w-4 animate-pulse-soft" />
          <span>AI veya yerel ayrıştırıcı çalışıyor</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 transition-all",
          isDragging
            ? "border-tider-green bg-tider-green-light/30"
            : "border-gray-200 bg-white hover:border-tider-green/50 hover:bg-gray-50/50"
        )}
      >
        <div className="mb-4 rounded-full bg-tider-green-light p-4">
          <Upload className="h-8 w-8 text-tider-green" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Dosyayı buraya sürükleyin
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          CSV, TXT veya Excel — n8n yoksa yerel ayrıştırıcı kullanılır
        </p>
        <label className="mt-6 cursor-pointer">
          <span className="inline-flex items-center gap-2 rounded-lg bg-tider-green px-4 py-2 text-sm font-medium text-white hover:bg-tider-green-dark transition-colors">
            <FileSpreadsheet className="h-4 w-4" />
            Dosya Seç
          </span>
          <input
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv,.txt,.tsv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">
          Metin olarak girin
        </h4>
        <p className="text-xs text-gray-500 mb-3">
          Her satır bir görev. CSV: Görev Adı, Açıklama, E-posta
        </p>
        <textarea
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-tider-green focus:outline-none focus:ring-2 focus:ring-tider-green/20"
          rows={5}
          placeholder={"Gıda paketi dağıtımı, Cumartesi 09:00, gonullu@tider.org\nToplantı notları hazırla\nBütçe raporu"}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <Button
            onClick={handleTextImport}
            disabled={!textInput.trim()}
            variant="secondary"
          >
            <Sparkles className="h-4 w-4" />
            Görevleri Çıkar
          </Button>
        </div>
      </div>

      {warning && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {warning}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
