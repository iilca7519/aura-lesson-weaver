
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Archive, 
  Trash2, 
  Eye, 
  Search, 
  Calendar,
  FileText,
  Download,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analysisDataStore } from "@/services/analysisDataStore";

interface SavedAnalysis {
  id: string;
  name: string;
  data: any;
  files: Array<{ name: string; size: number }>;
  createdAt: string;
  lastModified: string;
}

interface SavedAnalysesManagerProps {
  onLoadAnalysis: (analysis: SavedAnalysis) => void;
}

const SavedAnalysesManager = ({ onLoadAnalysis }: SavedAnalysesManagerProps) => {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  const loadSavedAnalyses = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_analyses') || '[]');
      setSavedAnalyses(saved);
    } catch (error) {
      console.error('Error loading saved analyses:', error);
      toast({
        title: "Load Error",
        description: "Failed to load saved analyses.",
        variant: "destructive",
      });
    }
  };

  const deleteAnalysis = (id: string) => {
    try {
      const updated = savedAnalyses.filter(analysis => analysis.id !== id);
      localStorage.setItem('saved_analyses', JSON.stringify(updated));
      setSavedAnalyses(updated);
      
      toast({
        title: "Analysis Deleted",
        description: "Analysis has been permanently removed.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the analysis.",
        variant: "destructive",
      });
    }
  };

  const loadAnalysis = (analysis: SavedAnalysis) => {
    analysisDataStore.setAnalysisData(analysis.data);
    onLoadAnalysis(analysis);
    setSelectedAnalysis(analysis.id);
    
    toast({
      title: "Analysis Loaded",
      description: `"${analysis.name}" is now active for lesson generation.`,
    });
  };

  const exportAnalysis = (analysis: SavedAnalysis) => {
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysis.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredAnalyses = savedAnalyses.filter(analysis =>
    analysis.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-blue-600" />
          Saved Analyses ({savedAnalyses.length})
        </CardTitle>
        <CardDescription>
          Manage and load previously saved corpus analyses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search saved analyses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredAnalyses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Archive className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {searchTerm ? "No analyses match your search." : "No saved analyses yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedAnalysis === analysis.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1 truncate">{analysis.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(analysis.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {analysis.files.length} files
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {analysis.data.overview?.totalSlides || 'N/A'} slides
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {analysis.data.confidence?.overallAccuracy || 0}% confidence
                      </Badge>
                      {selectedAnalysis === analysis.id && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadAnalysis(analysis)}
                      disabled={selectedAnalysis === analysis.id}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportAnalysis(analysis)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAnalysis(analysis.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedAnalysesManager;
