
// Store for managing analysis data across the application
class AnalysisDataStore {
  private static instance: AnalysisDataStore;
  private analysisData: any = null;

  private constructor() {}

  public static getInstance(): AnalysisDataStore {
    if (!AnalysisDataStore.instance) {
      AnalysisDataStore.instance = new AnalysisDataStore();
    }
    return AnalysisDataStore.instance;
  }

  public setAnalysisData(data: any): void {
    this.analysisData = data;
    // Also store in localStorage for persistence
    localStorage.setItem('corpus_analysis_data', JSON.stringify(data));
  }

  public getAnalysisData(): any {
    if (!this.analysisData) {
      // Try to load from localStorage
      const stored = localStorage.getItem('corpus_analysis_data');
      if (stored) {
        this.analysisData = JSON.parse(stored);
      }
    }
    return this.analysisData;
  }

  public clearAnalysisData(): void {
    this.analysisData = null;
    localStorage.removeItem('corpus_analysis_data');
  }

  public hasAnalysisData(): boolean {
    return this.getAnalysisData() !== null;
  }
}

export const analysisDataStore = AnalysisDataStore.getInstance();
