import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Brain, CheckCircle, AlertCircle, Palette, Layout, Users, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { analyzePowerPointFile, aggregateAnalysis } from "@/services/pptAnalysisService";
import { analysisDataStore } from "@/services/analysisDataStore";

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

  const startAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No Files to Analyze",
        description: "Please upload PowerPoint files first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

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
        
        // Update progress for each analysis step
        for (let step = 0; step < analysisSteps.length; step++) {
          const overallProgress = ((i * analysisSteps.length + step + 1) / (uploadedFiles.length * analysisSteps.length)) * 100;
          setAnalysisProgress(overallProgress);
          
          toast({
            title: `Analyzing ${file.name}`,
            description: analysisSteps[step],
          });
          
          await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        // Perform real analysis
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
      
      // Aggregate all analyses
      const aggregatedResults = aggregateAnalysis(fileAnalyses);
      setAnalysisResults(aggregatedResults);
      
      // Store analysis data for use in lesson generation
      analysisDataStore.setAnalysisData(aggregatedResults);
      
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      
      toast({
        title: "Deep Analysis Complete!",
        description: `Successfully analyzed ${fileAnalyses.length} PowerPoint files. AI knowledge base updated with your teaching methodology.`,
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

  const formatFileSize = (bytes: number) => {
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
            Real PowerPoint Analysis Engine
          </CardTitle>
          <CardDescription>
            Upload .pptx files for comprehensive AI analysis of every design element, layout pattern, and pedagogical sequence
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
                    <Badge variant="outline" className="text-xs">
                      PowerPoint Ready
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Real PowerPoint Analysis in Progress...</span>
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
              {isAnalyzing ? "Analyzing PowerPoint Files..." : "Start Real Analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisComplete && analysisResults && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Real Corpus Analysis Results
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of your actual PowerPoint files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{analysisResults.overview.totalLessons}</div>
                  <div className="text-sm text-blue-700">Files Analyzed</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{analysisResults.overview.totalSlides}</div>
                  <div className="text-sm text-green-700">Total Slides Parsed</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{analysisResults.overview.averageSlidesPerLesson}</div>
                  <div className="text-sm text-purple-700">Avg Slides/File</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-900">{analysisResults.confidence.overallAccuracy}%</div>
                  <div className="text-sm text-orange-700">Analysis Confidence</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Palette className="h-5 w-5 text-purple-600" />
                      Extracted Design System
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Actual Colors Used</h4>
                      <div className="flex gap-2 flex-wrap">
                        {analysisResults.designSystem.dominantColors.map((color: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-gray-600">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Font Families Found</h4>
                      <div className="flex gap-2 flex-wrap">
                        {analysisResults.designSystem.preferredFonts.map((font: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">{font}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Layout Distribution</h4>
                      <div className="space-y-1">
                        {analysisResults.designSystem.commonLayouts.map((layout: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{layout.layout}</span>
                            <span className="text-gray-500">{layout.usage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-green-600" />
                      Pedagogical Patterns Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Teaching Style Detected</h4>
                      <p className="text-sm text-gray-600">{analysisResults.pedagogicalInsights.teachingStyle}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Activity Types Identified</h4>
                      <div className="flex flex-wrap gap-1">
                        {analysisResults.pedagogicalInsights.preferredActivityTypes.map((activity: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{activity}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Lesson Structure Pattern</h4>
                      <div className="space-y-1">
                        {analysisResults.pedagogicalInsights.lessonStructurePattern.map((pattern: string, index: number) => (
                          <div key={index} className="text-xs text-gray-600">{pattern}</div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">AI Knowledge Base Updated</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Successfully parsed and analyzed actual PowerPoint content. The AI now understands your complete teaching methodology,
                      design preferences, and pedagogical patterns for intelligent lesson generation.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Badge className="bg-blue-100 text-blue-800">Design: {analysisResults.confidence.designConsistency}%</Badge>
                      <Badge className="bg-purple-100 text-purple-800">Style: {analysisResults.confidence.styleRecognition}%</Badge>
                      <Badge className="bg-green-100 text-green-800">Pedagogy: {analysisResults.confidence.pedagogicalAlignment}%</Badge>
                      <Badge className="bg-orange-100 text-orange-800">Overall: {analysisResults.confidence.overallAccuracy}%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CorpusAnalyzer;
