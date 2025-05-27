
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Layout, 
  FileText, 
  Target, 
  Save, 
  Trash2,
  Download,
  Plus,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalysisDashboardProps {
  analysisResults: any;
  uploadedFiles: any[];
  onFileRemove: (fileId: string) => void;
  onReanalyze: () => void;
  onAddMoreFiles: () => void;
  analysisName?: string;
}

const AnalysisDashboard = ({ 
  analysisResults, 
  uploadedFiles, 
  onFileRemove, 
  onReanalyze,
  onAddMoreFiles,
  analysisName 
}: AnalysisDashboardProps) => {
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
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
    }
  };

  const saveAnalysis = async () => {
    const defaultName = `Analysis_${new Date().toLocaleDateString()}`;
    const userAnalysisName = prompt("Enter a name for this analysis:", defaultName);
    if (!userAnalysisName) return;

    const analysisToSave = {
      id: Date.now().toString(),
      name: userAnalysisName,
      data: analysisResults,
      files: uploadedFiles.map(f => ({ name: f.name, size: f.size })),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    try {
      const existing = JSON.parse(localStorage.getItem('saved_analyses') || '[]');
      const updated = [...existing, analysisToSave];
      localStorage.setItem('saved_analyses', JSON.stringify(updated));
      setSavedAnalyses(updated);
      
      toast({
        title: "Analysis Saved",
        description: `"${userAnalysisName}" has been saved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save analysis.",
        variant: "destructive",
      });
    }
  };

  const exportAnalysis = () => {
    const dataStr = JSON.stringify(analysisResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get accurate data from analysis results
  const totalSlides = analysisResults?.overview?.totalSlides || 0;
  const totalLessons = analysisResults?.overview?.totalLessons || uploadedFiles.length;
  const activityTypes = analysisResults?.pedagogicalInsights?.preferredActivityTypes || [];

  return (
    <div className="space-y-6">
      {/* Analysis Name Header */}
      {analysisName && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Current Analysis: {analysisName}</h3>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-green-600" />
            Teaching Methodology Analysis Complete
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your PowerPoint corpus - ready for accurate lesson generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalLessons}</div>
              <div className="text-sm text-blue-700">PowerPoint Files</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalSlides}</div>
              <div className="text-sm text-green-700">Total Slides Analyzed</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{activityTypes.length}</div>
              <div className="text-sm text-orange-700">Activity Types Found</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={saveAnalysis} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Analysis
            </Button>
            <Button onClick={exportAnalysis} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={onAddMoreFiles} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add More Files
            </Button>
            <Button onClick={onReanalyze} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="teaching-style" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="teaching-style">Teaching Methodology</TabsTrigger>
          <TabsTrigger value="design-patterns">Visual Design</TabsTrigger>
          <TabsTrigger value="content-flow">Activity Flow</TabsTrigger>
          <TabsTrigger value="file-management">File Management</TabsTrigger>
        </TabsList>

        <TabsContent value="teaching-style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Pedagogical Methodology Analysis
              </CardTitle>
              <CardDescription>Your teaching approach and activity patterns extracted from PowerPoint slides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Teaching Style</h4>
                <p className="text-sm text-gray-600 mb-4">
                  {analysisResults?.pedagogicalInsights?.teachingStyle || 'Interactive and student-centered approach'}
                </p>
                
                <h4 className="font-medium mb-2">Activity Types Found ({activityTypes.length})</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {activityTypes.map((activity: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                      {activity}
                    </Badge>
                  ))}
                  {activityTypes.length === 0 && (
                    <p className="text-sm text-gray-500">No specific activity types detected in slides</p>
                  )}
                </div>

                <h4 className="font-medium mb-2">Lesson Structure Pattern</h4>
                <div className="space-y-2 mb-4">
                  {(analysisResults?.pedagogicalInsights?.lessonStructurePattern || []).map((step: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>

                <h4 className="font-medium mb-2">Assessment Approach</h4>
                <p className="text-sm text-gray-600">
                  {analysisResults?.pedagogicalInsights?.assessmentApproach || 'Formative assessment with continuous feedback'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design-patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-600" />
                Visual Design System
              </CardTitle>
              <CardDescription>Layout patterns and typography extracted from your presentations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Typography & Fonts</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(analysisResults?.designSystem?.preferredFonts || []).map((font: string, index: number) => (
                    <Badge key={index} variant="outline" style={{ fontFamily: font }} className="text-sm">
                      {font}
                    </Badge>
                  ))}
                </div>
                
                <h4 className="font-medium mb-3">Layout Patterns</h4>
                <div className="space-y-2 mb-6">
                  {(analysisResults?.designSystem?.commonLayouts || []).map((layout: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{layout.layout}</span>
                      <Badge variant="secondary">{layout.usage}% of slides</Badge>
                    </div>
                  ))}
                  {(!analysisResults?.designSystem?.commonLayouts || analysisResults.designSystem.commonLayouts.length === 0) && (
                    <p className="text-sm text-gray-500">Mixed layout patterns detected</p>
                  )}
                </div>

                <h4 className="font-medium mb-3">Visual Style</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {analysisResults?.visualPatterns?.imageUsage || 'Professional presentation style with clear typography'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-green-600" />
                Activity Flow & Progression
              </CardTitle>
              <CardDescription>How activities and content progress through your lessons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Lesson Activity Sequence</h4>
                <div className="space-y-2 mb-6">
                  {(analysisResults?.pedagogicalInsights?.lessonStructurePattern || []).map((step: string, index: number, array: string[]) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium flex-1">{step}</span>
                      {index < array.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
                
                <h4 className="font-medium mb-3">Activity Types in Sequence</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {activityTypes.map((activity: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{activity}</span>
                    </div>
                  ))}
                  {activityTypes.length === 0 && (
                    <p className="text-sm text-gray-500 col-span-2">No specific activity sequence patterns detected</p>
                  )}
                </div>
                
                <h4 className="font-medium mb-3">Content Organization Strategy</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {analysisResults?.visualPatterns?.spacingPattern || 'Structured progression with logical flow between activities'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="file-management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Analyzed Files ({uploadedFiles.length})
                </span>
                <Button variant="outline" size="sm" onClick={onReanalyze}>
                  <Brain className="h-3 w-3 mr-1" />
                  Re-analyze All
                </Button>
              </CardTitle>
              <CardDescription>
                Manage the PowerPoint files included in your teaching methodology analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-sm">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        ✓ Analyzed
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFileRemove(file.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {uploadedFiles.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No files uploaded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisDashboard;
