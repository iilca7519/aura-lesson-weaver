import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Palette, 
  Layout, 
  FileText, 
  Target, 
  Save, 
  Edit2, 
  Trash2,
  Eye,
  EyeOff,
  Download,
  Plus,
  RefreshCw
} from "lucide-react";
import { analysisDataStore } from "@/services/analysisDataStore";
import { useToast } from "@/hooks/use-toast";

interface AnalysisDashboardProps {
  analysisResults: any;
  uploadedFiles: any[];
  onFileRemove: (fileId: string) => void;
  onReanalyze: () => void;
  onAddMoreFiles: () => void;
}

const AnalysisDashboard = ({ 
  analysisResults, 
  uploadedFiles, 
  onFileRemove, 
  onReanalyze,
  onAddMoreFiles 
}: AnalysisDashboardProps) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
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

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const removeSelectedFiles = () => {
    selectedFiles.forEach(fileId => onFileRemove(fileId));
    setSelectedFiles([]);
    toast({
      title: "Files Removed",
      description: `${selectedFiles.length} file(s) removed from analysis.`,
    });
  };

  const saveAnalysis = async () => {
    const analysisName = prompt("Enter a name for this analysis:");
    if (!analysisName) return;

    const analysisToSave = {
      id: Date.now().toString(),
      name: analysisName,
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
        description: `"${analysisName}" has been saved successfully.`,
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

  // Calculate actual total slides from analysis data
  const totalSlides = analysisResults?.overview?.totalSlides || 0;
  const totalLessons = analysisResults?.overview?.totalLessons || uploadedFiles.length;

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-green-600" />
            Teaching Methodology Analysis Complete
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your PowerPoint corpus - ready for lesson generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalLessons}</div>
              <div className="text-sm text-blue-700">PowerPoint Files</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalSlides}</div>
              <div className="text-sm text-green-700">Total Slides</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analysisResults?.designSystem?.dominantColors?.length || 0}
              </div>
              <div className="text-sm text-purple-700">Colors Identified</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analysisResults?.pedagogicalInsights?.preferredActivityTypes?.length || 0}
              </div>
              <div className="text-sm text-orange-700">Activity Types</div>
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
          <TabsTrigger value="teaching-style">Teaching Style</TabsTrigger>
          <TabsTrigger value="design-patterns">Visual Design</TabsTrigger>
          <TabsTrigger value="content-structure">Content Flow</TabsTrigger>
          <TabsTrigger value="file-management">File Management</TabsTrigger>
        </TabsList>

        <TabsContent value="teaching-style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedagogical Methodology</CardTitle>
              <CardDescription>Your teaching approach and activity preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Teaching Style</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {analysisResults?.pedagogicalInsights?.teachingStyle || 'Interactive and student-centered approach'}
                </p>
                
                <h4 className="font-medium mb-2">Preferred Activity Types</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(analysisResults?.pedagogicalInsights?.preferredActivityTypes || []).map((activity: string, index: number) => (
                    <Badge key={index} variant="secondary">{activity}</Badge>
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
              <CardTitle>Visual Design System</CardTitle>
              <CardDescription>Colors, fonts, and layout patterns from your presentations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Color Palette</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(analysisResults?.designSystem?.dominantColors || []).map((color: string, index: number) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded border-2 border-gray-200"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                
                <h4 className="font-medium mb-2">Typography</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(analysisResults?.designSystem?.preferredFonts || []).map((font: string, index: number) => (
                    <Badge key={index} variant="outline" style={{ fontFamily: font }}>
                      {font}
                    </Badge>
                  ))}
                </div>
                
                <h4 className="font-medium mb-2">Layout Patterns</h4>
                <div className="space-y-2">
                  {(analysisResults?.designSystem?.commonLayouts || []).map((layout: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{layout.layout}</span>
                      <Badge variant="secondary">{layout.usage}% usage</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Organization</CardTitle>
              <CardDescription>How you structure and organize lesson content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Lesson Structure Pattern</h4>
                <div className="space-y-2">
                  {(analysisResults?.pedagogicalInsights?.lessonStructurePattern || []).map((step: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
                
                <h4 className="font-medium mb-2 mt-4">Visual Content Usage</h4>
                <p className="text-sm text-gray-600">
                  {analysisResults?.visualPatterns?.imageUsage || 'Balanced use of visual elements to support learning'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="file-management" className="space-y-4">
          {/* File Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analyzed Files ({uploadedFiles.length})</span>
                <Button variant="outline" size="sm" onClick={onReanalyze}>
                  <Brain className="h-3 w-3 mr-1" />
                  Re-analyze
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium text-sm">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Analyzed
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFileRemove(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisDashboard;
