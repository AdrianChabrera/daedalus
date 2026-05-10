import { useState, useCallback } from 'react';
import { generateBuildPdf } from '../services/pdf/buildPdfExportService';
import type { BuildDetail } from '../types/BuildDetails.type';

export interface UseBuildPdfExportResult {
  exporting: boolean;
  error: string | null;
  exportPdf: (build: BuildDetail) => Promise<void>;
}

export function useBuildPdfExport(): UseBuildPdfExportResult {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async (build: BuildDetail) => {
    setExporting(true);
    setError(null);
    try {
      await generateBuildPdf(build);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, error, exportPdf };
}