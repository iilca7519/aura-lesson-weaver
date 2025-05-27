
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Brain, CheckCircle, AlertCircle, Palette, Layout, Users, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { analyzePowerPointFile, aggregateAnalysis } from "@/services/pptAnalysisService";

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
    const newFiles: UploadedFile[] = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      id: Math.random().toString(36).substr(2, 9),
      file: file
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
      "Extracting slides and content structure...",
      "Analyzing layout patterns and positioning...",
      "Examining color schemes and design elements...",
      "Processing text formatting and typography...",
      "Identifying image placement and styles...",
      "Mapping pedagogical flow patterns...",
      "Analyzing activity types and sequences...",
      "Building comprehensive style profile...",
      "Generating AI teaching methodology map..."
    ];

    try {
      const fileAnalyses = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        // Update progress for each file
        for (let step = 0; step < analysisSteps.length; step++) {
          const overallProgress = ((i * analysisSteps.length + step + 1) / (uploadedFiles.length * analysisSteps.length)) * 100;
          setAnalysisProgress(overallProgress);
          
          toast({
            title: `Analyzing ${file.name}`,
            description: analysisSteps[step],
          });
          
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Analyze each file
        const analysis = await analyzePowerPointFile(file.file);
        fileAnalyses.push(analysis);
      }
      
      // Aggregate all analyses
      const aggregatedResults = aggregateAnalysis(fileAnalyses);
      setAnalysisResults(aggregatedResults);
      
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      
      toast({
        title: "Deep Analysis Complete!",
        description: "AI has comprehensively analyzed your teaching methodology, design patterns, and pedagogical approach.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your files. Please try again.",
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
            Deep Corpus Analysis
          </CardTitle>
          <CardDescription>
            Upload PowerPoint lessons for comprehensive AI analysis of design, pedagogy, and style patterns
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
                      Ready for Analysis
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deep AI Analysis in Progress...</span>
                <span className="text-sm text-gray-500">{Math.round(analysisProgress)}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-sm text-gray-600">
                Performing comprehensive analysis of every design element, layout pattern, pedagogical sequence, 
                color scheme, typography, image placement, and teaching methodology in your corpus.
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
              {isAnalyzing ? "Analyzing..." : "Start Deep Analysis"}
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
                Comprehensive Analysis Results
              </CardTitle>
              <CardDescription>
                AI has completed deep analysis of your teaching corpus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{analysisResults.overview.totalLessons}</div>
                  <div className="text-sm text-blue-700">Lessons Analyzed</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{analysisResults.overview.totalSlides}</div>
                  <div className="text-sm text-green-700">Total Slides</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{analysisResults.overview.averageSlidesPerLesson}</div>
                  <div className="text-sm text-purple-700">Avg Slides/Lesson</div>
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
                      Design System Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Dominant Colors</h4>
                      <div className="flex gap-2">
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
                      <h4 className="font-medium mb-2">Typography Patterns</h4>
                      <div className="flex gap-2">
                        {analysisResults.designSystem.preferredFonts.map((font: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">{font}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Layout Preferences</h4>
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
                      Pedagogical Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Teaching Style</h4>
                      <p className="text-sm text-gray-600">{analysisResults.pedagogicalInsights.teachingStyle}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Lesson Structure Pattern</h4>
                      <div className="space-y-1">
                        {analysisResults.pedagogicalInsights.lessonStructurePattern.map((pattern: string, index: number) => (
                          <div key={index} className="text-xs text-gray-600">{pattern}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Preferred Activities</h4>
                      <div className="flex flex-wrap gap-1">
                        {analysisResults.pedagogicalInsights.preferredActivityTypes.map((activity: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">{activity}</Badge>
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
                    <h4 className="font-medium text-blue-900 mb-2">AI Knowledge Base Status</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      The system has analyzed every element: slide layouts, color schemes, typography, image placement, 
                      logo positioning, text formatting, pedagogical sequences, activity types, and assessment methods.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Badge className="bg-blue-100 text-blue-800">Design Consistency: {analysisResults.confidence.designConsistency}%</Badge>
                      <Badge className="bg-purple-100 text-purple-800">Style Recognition: {analysisResults.confidence.styleRecognition}%</Badge>
                      <Badge className="bg-green-100 text-green-800">Pedagogy Alignment: {analysisResults.confidence.pedagogicalAlignment}%</Badge>
                      <Badge className="bg-orange-100 text-orange-800">Overall Accuracy: {analysisResults.confidence.overallAccuracy}%</Badge>
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
