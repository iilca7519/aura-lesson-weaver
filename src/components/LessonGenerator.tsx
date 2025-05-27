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

const LessonGenerator = () => {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [analysisData, setAnalysisData] = useState<any>(null);
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
        apiKey: apiKey || undefined
      });

      setGeneratedLesson(lessonContent);
      
      toast({
        title: "Lesson Generated Successfully!",
        description: analysisData 
          ? "AI created a lesson using your real analyzed teaching methodology and design patterns."
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
            Enter any topic - AI will create a complete lesson using your analyzed teaching methodology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!analysisData && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-1" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">No Corpus Analysis Available</h4>
                  <p className="text-sm text-amber-700">
                    Upload and analyze PowerPoint files first to enable personalized lesson generation based on your teaching methodology.
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
                placeholder="e.g., Environmental Conservation, Digital Technology, Cultural Traditions..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-2 text-lg p-4 h-14"
              />
            </div>

            {analysisData ? (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">Real Analysis Data Available</h4>
                    <p className="text-sm text-green-700 mb-3">
                      Using your actual analyzed teaching methodology from {analysisData.overview?.totalLessons} PowerPoint files:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="outline" className="text-xs bg-white">
                        {analysisData.pedagogicalInsights?.teachingStyle || 'Teaching Style Analyzed'}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white">
                        {analysisData.designSystem?.dominantColors?.length || 0} Colors Extracted
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white">
                        {analysisData.designSystem?.preferredFonts?.length || 0} Fonts Identified
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white">
                        {analysisData.pedagogicalInsights?.preferredActivityTypes?.length || 0} Activity Types
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Standard Lesson Generation</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Without corpus analysis, the AI will use general teaching best practices:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="outline" className="text-xs">Interactive approach</Badge>
                      <Badge variant="outline" className="text-xs">Standard activities</Badge>
                      <Badge variant="outline" className="text-xs">General design</Badge>
                      <Badge variant="outline" className="text-xs">Common patterns</Badge>
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
                ? "Generate AI Lesson (Using Your Methodology)" 
                : "Generate Standard AI Lesson"
            }
          </Button>
        </CardContent>
      </Card>

      {generatedLesson && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Lesson Preview</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Full Preview
                </Button>
                <Button size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Export as PowerPoint
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{generatedLesson.title}</h3>
              <p className="text-gray-600">{generatedLesson.introduction}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Reading Passage</h4>
              <p className="text-sm bg-gray-50 p-3 rounded">{generatedLesson.readingPassage}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Key Vocabulary ({generatedLesson.vocabulary.length} words)</h4>
              <div className="flex flex-wrap gap-2">
                {generatedLesson.vocabulary.slice(0, 6).map((vocab, index) => (
                  <Badge key={index} variant="outline">{vocab.word}</Badge>
                ))}
                {generatedLesson.vocabulary.length > 6 && (
                  <Badge variant="outline">+{generatedLesson.vocabulary.length - 6} more</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Comprehension Questions</h4>
                <p className="text-sm text-gray-600">{generatedLesson.comprehensionQuestions.length} questions</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Discussion Topics</h4>
                <p className="text-sm text-gray-600">{generatedLesson.discussionQuestions.length} topics</p>
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${analysisData ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-sm ${analysisData ? 'text-green-700' : 'text-blue-700'}`}>
                {analysisData 
                  ? '✅ Generated using your real analyzed teaching methodology, design preferences, and pedagogical patterns'
                  : '📝 Generated using standard teaching practices. Analyze your corpus for personalized methodology.'
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
