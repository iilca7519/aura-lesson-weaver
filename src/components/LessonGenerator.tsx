
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Download, Eye, Wand2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLessonContent } from "@/services/aiService";
import { analysisDataStore } from "@/services/analysisDataStore";
import ApiKeyInput from "./ApiKeyInput";
import LessonGenerationSettings from "./LessonGenerationSettings";

const LessonGenerator = () => {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [lessonSettings, setLessonSettings] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    // Load analysis data
    const data = analysisDataStore.getAnalysisData();
    setAnalysisData(data);
  }, []);

  const generateLesson = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a lesson topic before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const lessonContent = await generateLessonContent({
        topic: topic.trim(),
        analysisData: analysisData,
        lessonSettings: lessonSettings,
        apiKey: apiKey || undefined
      });

      setGeneratedLesson(lessonContent);
      
      toast({
        title: "Lesson Generated Successfully!",
        description: analysisData 
          ? "AI created a personalized lesson matching your teaching style and preferences."
          : apiKey 
            ? "Lesson generated with OpenAI. Upload PowerPoint files for personalized methodology."
            : "Sample lesson created. Add API key and analyze corpus for full personalization.",
      });
    } catch (error) {
      console.error('Error generating lesson:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating the lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <ApiKeyInput 
        onApiKeySet={setApiKey}
        currentApiKey={apiKey}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            AI Lesson Generator
          </CardTitle>
          <CardDescription>
            Create lessons that match your analyzed teaching methodology and style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!analysisData && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-1" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">No Analysis Data Available</h4>
                  <p className="text-sm text-amber-700">
                    Upload and analyze PowerPoint files to enable personalized lesson generation that matches your exact teaching methodology.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="topic" className="text-base font-medium">What topic would you like to teach?</Label>
              <Input
                id="topic"
                placeholder="e.g., Climate Change, Digital Communication, Cultural Diversity..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-2 text-lg p-4 h-14"
              />
            </div>

            {analysisData && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">Using Your Teaching Methodology</h4>
                    <p className="text-sm text-green-700 mb-3">
                      AI will generate lessons using patterns from your {analysisData.overview?.totalLessons} analyzed files:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="outline" className="text-xs bg-white">
                        {analysisData.pedagogicalInsights?.teachingStyle || 'Teaching Style Analyzed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white">
                        {analysisData.designSystem?.dominantColors?.length || 0} Color Palette
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white">
                        {analysisData.designSystem?.preferredFonts?.length || 0} Font Preferences
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white">
                        {analysisData.pedagogicalInsights?.preferredActivityTypes?.length || 0} Activity Patterns
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={generateLesson}
            disabled={isGenerating || !topic.trim()}
            className="w-full"
            size="lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {isGenerating 
              ? "Generating Personalized Lesson..." 
              : analysisData 
                ? "Generate Lesson (Your Style)" 
                : "Generate Standard Lesson"
            }
          </Button>
        </CardContent>
      </Card>

      <LessonGenerationSettings 
        onSettingsChange={setLessonSettings}
        analysisData={analysisData}
      />

      {generatedLesson && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Lesson: {generatedLesson.title}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Export PowerPoint
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Lesson Overview</h4>
              <p className="text-sm text-gray-700">{generatedLesson.introduction}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">📖 Reading Passage</h4>
                <p className="text-xs text-gray-600 mb-2">
                  {generatedLesson.readingPassage.split(' ').length} words
                </p>
                <p className="text-sm line-clamp-3">{generatedLesson.readingPassage}</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">📝 Vocabulary ({generatedLesson.vocabulary.length})</h4>
                <div className="space-y-2">
                  {generatedLesson.vocabulary.slice(0, 3).map((vocab, index) => (
                    <div key={index} className="text-xs">
                      <span className="font-medium">{vocab.word}</span>
                      <p className="text-gray-600 truncate">{vocab.definition}</p>
                    </div>
                  ))}
                  {generatedLesson.vocabulary.length > 3 && (
                    <p className="text-xs text-gray-500">+{generatedLesson.vocabulary.length - 3} more</p>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">🎯 Activities ({generatedLesson.activities.length})</h4>
                <div className="space-y-2">
                  {generatedLesson.activities.slice(0, 2).map((activity, index) => (
                    <div key={index} className="text-xs">
                      <span className="font-medium">{activity.type}</span>
                      <p className="text-gray-600 truncate">{activity.content}</p>
                    </div>
                  ))}
                  {generatedLesson.activities.length > 2 && (
                    <p className="text-xs text-gray-500">+{generatedLesson.activities.length - 2} more</p>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">❓ Comprehension</h4>
                <p className="text-xs text-gray-600">{generatedLesson.comprehensionQuestions.length} questions</p>
                <p className="text-sm mt-2 line-clamp-2">{generatedLesson.comprehensionQuestions[0]}</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">💬 Discussion</h4>
                <p className="text-xs text-gray-600">{generatedLesson.discussionQuestions.length} topics</p>
                <p className="text-sm mt-2 line-clamp-2">{generatedLesson.discussionQuestions[0]}</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">🎯 Conclusion</h4>
                <p className="text-sm line-clamp-3">{generatedLesson.conclusion}</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${analysisData ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-sm ${analysisData ? 'text-green-700' : 'text-blue-700'}`}>
                {analysisData 
                  ? '✅ This lesson was generated using your analyzed teaching methodology, style preferences, and pedagogical patterns'
                  : '📝 This lesson uses standard teaching practices. Upload and analyze your PowerPoint files to enable personalized generation'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LessonGenerator;
