import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScreenshotUpload from "@/components/fantasy/ScreenshotUpload";
import AnalysisResult from "@/components/fantasy/AnalysisResult";

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelected = (selected) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setAnalysis(null);
    setError(null);
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const response = await base44.functions.invoke("analyzeScreenshot", { file_url });
      setAnalysis(response.data);
    } catch (err) {
      setError(
        (err.response?.data?.error) || err.message || "Something went wrong analyzing your screenshot."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Fantasy Companion</h1>
          <p className="mt-2 text-slate-500">
            Snap a screenshot of your fantasy app — get instant start/sit, waiver, and trade advice.
          </p>
        </header>

        <div className="space-y-6">
          <ScreenshotUpload preview={preview} onFileSelected={handleFileSelected} onReset={handleReset} />

          {file && !analysis && (
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-slate-900 py-6 text-base font-semibold hover:bg-slate-800"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Reading your screen…
                </>
              ) : (
                <>
                  <ScanSearch className="mr-2 h-5 w-5" /> Analyze screenshot
                </>
              )}
            </Button>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {analysis && <AnalysisResult analysis={analysis} />}

          {analysis && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Analyze another screenshot
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}