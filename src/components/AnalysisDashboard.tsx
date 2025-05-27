
import { useState } from "react";
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
  Download
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
  const [analysisName, setAnalysisName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    design: true,
    pedagogy: true,
    visual: true
  });
  const { toast } = useToast();

  const saveAnalysis = async () => {
    if (!analysisName.trim()) {
      toast({
        title: "Analysis Name Required",
        description: "Please enter a name for this analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const savedAnalyses = JSON.parse(localStorage.getItem('saved_analyses') || '[]');
      const newAnalysis = {
        id: Date.now().toString(),
        name: analysisName.trim(),
        data: analysisResults,
        files: uploadedFiles.map(f => ({ name: f.name, size: f.size })),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      savedAnalyses.push(newAnalysis);
      localStorage.setItem('saved_analyses', JSON.stringify(savedAnalyses));
      
      toast({
        title: "Analysis Saved",
        description: `Analysis "${analysisName}" has been saved successfully.`,
      });
      
      setAnalysisName("");
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving the analysis.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const exportAnalysis = () => {
    const dataStr = JSON.stringify(analysisResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-${analysisName || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Analysis Management Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Analysis Dashboard
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportAnalysis}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={onAddMoreFiles}>
                <FileText className="h-3 w-3 mr-1" />
                Add Files
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of {uploadedFiles.length} PowerPoint files with {analysisResults.overview.totalSlides} total slides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="analysis-name">Save Analysis As:</Label>
              <Input
                id="analysis-name"
                placeholder="e.g., 'ESL Methodology Analysis - December 2024'"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={saveAnalysis} disabled={isSaving || !analysisName.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Analysis"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Detailed Analysis Results */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="design">Design System</TabsTrigger>
          <TabsTrigger value="pedagogy">Pedagogy</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analysis Overview</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('overview')}
                >
                  {expandedSections.overview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {expandedSections.overview && (
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">{analysisResults.overview.totalLessons}</div>
                    <div className="text-sm text-blue-700">PowerPoint Files</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">{analysisResults.overview.totalSlides}</div>
                    <div className="text-sm text-green-700">Total Slides</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900">{analysisResults.overview.averageSlidesPerLesson}</div>
                    <div className="text-sm text-purple-700">Avg per File</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-900">{analysisResults.confidence.overallAccuracy}%</div>
                    <div className="text-sm text-orange-700">Confidence</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Analysis Confidence Breakdown</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Design Consistency</span>
                        <span>{analysisResults.confidence.designConsistency}%</span>
                      </div>
                      <Progress value={analysisResults.confidence.designConsistency} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Style Recognition</span>
                        <span>{analysisResults.confidence.styleRecognition}%</span>
                      </div>
                      <Progress value={analysisResults.confidence.styleRecognition} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Pedagogical Alignment</span>
                        <span>{analysisResults.confidence.pedagogicalAlignment}%</span>
                      </div>
                      <Progress value={analysisResults.confidence.pedagogicalAlignment} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-600" />
                Extracted Design System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Color Palette Analysis</h4>
                  <div className="space-y-3">
                    {analysisResults.designSystem.dominantColors.map((color: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded border-2 border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                          <div>
                            <div className="font-medium text-sm">{color}</div>
                            <div className="text-xs text-gray-500">Primary Color {index + 1}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Frequent
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Typography System</h4>
                  <div className="space-y-3">
                    {analysisResults.designSystem.preferredFonts.map((font: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm" style={{ fontFamily: font }}>
                            {font}
                          </div>
                          <div className="text-xs text-gray-500">
                            {index === 0 ? 'Primary Font' : index === 1 ? 'Secondary Font' : 'Supporting Font'}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Used
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Layout Pattern Distribution</h4>
                <div className="grid grid-cols-2 gap-3">
                  {analysisResults.designSystem.commonLayouts.map((layout: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{layout.layout}</span>
                        <Badge variant="secondary" className="text-xs">{layout.usage}%</Badge>
                      </div>
                      <Progress value={layout.usage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedagogy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Pedagogical Pattern Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Teaching Style Profile</h4>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium mb-2">Identified Approach:</p>
                    <p className="text-sm text-green-700">{analysisResults.pedagogicalInsights.teachingStyle}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Assessment Strategy</h4>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium mb-2">Primary Method:</p>
                    <p className="text-sm text-blue-700">{analysisResults.pedagogicalInsights.assessmentApproach}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Preferred Activity Types</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.pedagogicalInsights.preferredActivityTypes.map((activity: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                      {activity}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Lesson Structure Pattern</h4>
                <div className="space-y-2">
                  {analysisResults.pedagogicalInsights.lessonStructurePattern.map((pattern: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm">{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Visual Communication Patterns</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h5 className="text-sm font-medium mb-1">Image Usage</h5>
                      <p className="text-xs text-gray-600">{analysisResults.visualPatterns.imageUsage}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="text-sm font-medium mb-1">Text Formatting</h5>
                      <p className="text-xs text-gray-600">{analysisResults.visualPatterns.textFormatting}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="text-sm font-medium mb-1">Spacing Strategy</h5>
                      <p className="text-xs text-gray-600">{analysisResults.visualPatterns.spacingPattern}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-900 mb-1">Consistency Score</h5>
                      <p className="text-xs text-blue-700">
                        Your design consistency is {analysisResults.confidence.designConsistency}%. 
                        {analysisResults.confidence.designConsistency > 85 
                          ? " Excellent brand coherence across materials."
                          : " Consider standardizing color and font usage for stronger brand identity."
                        }
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="text-sm font-medium text-green-900 mb-1">Teaching Alignment</h5>
                      <p className="text-xs text-green-700">
                        Pedagogical patterns show {analysisResults.confidence.pedagogicalAlignment}% alignment. 
                        Strong methodological consistency detected in lesson flow and activity sequencing.
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h5 className="text-sm font-medium text-purple-900 mb-1">Style Recognition</h5>
                      <p className="text-xs text-purple-700">
                        AI confidence in style recognition: {analysisResults.confidence.styleRecognition}%. 
                        Clear visual and pedagogical patterns identified for accurate lesson generation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisDashboard;
