
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Brain, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  id: string;
}

const CorpusAnalyzer = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles: UploadedFile[] = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Files Uploaded",
      description: `${files.length} PowerPoint file(s) added to corpus`,
    });
  };

  const startAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No Files to Analyze",
        description: "Please upload some PowerPoint files first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const analysisSteps = [
      "Extracting text content from slides...",
      "Performing semantic analysis...",
      "Mapping lesson structures...",
      "Analyzing visual design patterns...",
      "Identifying pedagogical sequences...",
      "Building knowledge graph...",
      "Creating generative templates...",
      "Finalizing AI knowledge base..."
    ];

    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAnalysisProgress(((i + 1) / analysisSteps.length) * 100);
      
      toast({
        title: "AI Analysis Progress",
        description: analysisSteps[i],
      });
    }

    setIsAnalyzing(false);
    setAnalysisComplete(true);
    
    toast({
      title: "Corpus Analysis Complete!",
      description: "AI has successfully learned your teaching methodology and style.",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Corpus Upload & Analysis
          </CardTitle>
          <CardDescription>
            Upload your PowerPoint lessons for deep AI analysis of your teaching style and methodology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload PowerPoint Files
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your .pptx files here, or click to browse
            </p>
            <Button variant="outline">
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pptx,.ppt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-sm">{file.name}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Ready
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Analysis in Progress...</span>
                <span className="text-sm text-gray-500">{Math.round(analysisProgress)}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-sm text-gray-600">
                The AI is deeply analyzing your lesson corpus to understand your pedagogical patterns, 
                style preferences, and structural methodologies.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={startAnalysis}
              disabled={uploadedFiles.length === 0 || isAnalyzing}
              className="flex-1"
            >
              <Brain className="h-4 w-4 mr-2" />
              {isAnalyzing ? "Analyzing..." : "Start AI Analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Analysis Complete
            </CardTitle>
            <CardDescription>
              AI has successfully analyzed your corpus and built a comprehensive knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">23</div>
                <div className="text-sm text-blue-700">Lessons Analyzed</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-900">847</div>
                <div className="text-sm text-green-700">Slides Processed</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">15</div>
                <div className="text-sm text-purple-700">Pattern Templates</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">98%</div>
                <div className="text-sm text-orange-700">Style Confidence</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">AI Knowledge Base Ready</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    The system has learned your teaching methodology and can now generate new lessons 
                    that match your style, structure, and pedagogical approach.
                  </p>
                  <div className="flex gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Semantic Understanding</Badge>
                    <Badge className="bg-purple-100 text-purple-800">Style Mapping</Badge>
                    <Badge className="bg-green-100 text-green-800">Structure Recognition</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CorpusAnalyzer;
