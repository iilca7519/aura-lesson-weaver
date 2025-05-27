
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Brain, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { analyzePowerPointFile, aggregateAnalysis } from "@/services/pptAnalysisService";
import { analysisDataStore } from "@/services/analysisDataStore";
import AnalysisDashboard from "./AnalysisDashboard";
import SavedAnalysesManager from "./SavedAnalysesManager";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  id: string;
  file: File;
}

const CorpusAnalyzer = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [analysisName, setAnalysisName] = useState<string>('');
  const [activeTab, setActiveTab] = useState("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.name.endsWith('.pptx')
    );
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files Detected",
        description: "Only .pptx files are supported for analysis.",
        variant: "destructive",
      });
    }
    
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      id: Math.random().toString(36).substr(2, 9),
      file: file
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Files Uploaded",
      description: `${validFiles.length} PowerPoint file(s) ready for deep analysis`,
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    
    // If we're removing files and there are no more files, reset analysis state
    if (uploadedFiles.length === 1) {
      setAnalysisComplete(false);
      setAnalysisResults(null);
      setAnalysisName('');
      setActiveTab("upload");
    }
    
    toast({
      title: "File Removed",
      description: "File has been removed from analysis queue.",
    });
  };

  const startAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No Files to Analyze",
        description: "Please upload PowerPoint files first.",
        variant: "destructive",
      });
      return;
    }

    // Generate analysis name
    const defaultName = `Analysis_${new Date().toLocaleDateString().replace(/\//g, '-')}_${uploadedFiles.length}files`;
    setAnalysisName(defaultName);

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisComplete(false);

    const analysisSteps = [
      "Extracting .pptx file structure...",
      "Parsing slide XML content...",
      "Analyzing layout patterns and positioning...",
      "Extracting color schemes and theme data...",
      "Processing text formatting and typography...",
      "Identifying image placement and styles...",
      "Mapping pedagogical flow patterns...",
      "Analyzing activity sequences and types...",
      "Building comprehensive style profile...",
      "Generating AI teaching methodology map..."
    ];

    try {
      const fileAnalyses = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        for (let step = 0; step < analysisSteps.length; step++) {
          const overallProgress = ((i * analysisSteps.length + step + 1) / (uploadedFiles.length * analysisSteps.length)) * 100;
          setAnalysisProgress(overallProgress);
          
          toast({
            title: `Analyzing ${file.name}`,
            description: analysisSteps[step],
          });
          
          await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        try {
          const analysis = await analyzePowerPointFile(file.file);
          fileAnalyses.push(analysis);
          
          toast({
            title: "File Analysis Complete",
            description: `Successfully analyzed ${analysis.totalSlides} slides from ${file.name}`,
          });
        } catch (error) {
          console.error(`Error analyzing ${file.name}:`, error);
          toast({
            title: "Analysis Warning",
            description: `Could not fully analyze ${file.name}: ${error.message}`,
            variant: "destructive",
          });
        }
      }
      
      if (fileAnalyses.length === 0) {
        throw new Error("No files could be analyzed successfully");
      }
      
      const aggregatedResults = aggregateAnalysis(fileAnalyses);
      setAnalysisResults(aggregatedResults);
      analysisDataStore.setAnalysisData(aggregatedResults);
      
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      setActiveTab("dashboard");
      
      toast({
        title: "Deep Analysis Complete!",
        description: `Successfully analyzed ${fileAnalyses.length} PowerPoint files with ${aggregatedResults.overview.totalSlides} total slides.`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: `Error: ${error.message}. Please ensure files are valid .pptx format.`,
        variant: "destructive",
      });
    }
  };

  const handleLoadSavedAnalysis = (savedAnalysis: any) => {
    setAnalysisResults(savedAnalysis.data);
    setAnalysisName(savedAnalysis.name);
    setAnalysisComplete(true);
    setActiveTab("dashboard");
    
    // Clear uploaded files since we're loading a saved analysis
    setUploadedFiles([]);
    
    toast({
      title: "Analysis Loaded",
      description: `"${savedAnalysis.name}" has been loaded successfully.`,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
          <TabsTrigger value="dashboard" disabled={!analysisComplete}>
            Analysis Dashboard
          </TabsTrigger>
          <TabsTrigger value="saved">Saved Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                PowerPoint Analysis Engine
              </CardTitle>
              <CardDescription>
                Upload .pptx files for comprehensive AI analysis of design elements, layout patterns, and pedagogical sequences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload PowerPoint Files (.pptx)
                </h3>
                <p className="text-gray-600 mb-4">
                  Real PowerPoint parsing and analysis - every slide, element, and pattern
                </p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Choose .pptx Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Ready for Analysis ({uploadedFiles.length} files)</h4>
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
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            PowerPoint Ready
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Deep PowerPoint Analysis in Progress...</span>
                    <span className="text-sm text-gray-500">{Math.round(analysisProgress)}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                  <p className="text-sm text-gray-600">
                    Parsing actual .pptx files: extracting slides, analyzing layouts, colors, fonts, images, text formatting, 
                    pedagogical sequences, and building your complete teaching methodology profile.
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
                  {isAnalyzing ? "Analyzing PowerPoint Files..." : "Start Deep Analysis"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          {analysisComplete && analysisResults && (
            <AnalysisDashboard
              analysisResults={analysisResults}
              uploadedFiles={uploadedFiles}
              onFileRemove={removeFile}
              onReanalyze={startAnalysis}
              onAddMoreFiles={() => fileInputRef.current?.click()}
              analysisName={analysisName}
            />
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <SavedAnalysesManager onLoadAnalysis={handleLoadSavedAnalysis} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CorpusAnalyzer;
