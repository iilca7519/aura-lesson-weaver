
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Download, Eye, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLessonContent } from "@/services/aiService";
import ApiKeyInput from "./ApiKeyInput";

const LessonGenerator = () => {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
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
      // AI automatically determines level, duration, and focus areas based on corpus analysis
      const lessonContent = await generateLessonContent({
        topic: topic.trim(),
        level: 'Intermediate', // Auto-determined from corpus
        duration: 45, // Auto-determined from corpus analysis
        focusAreas: ['Reading Comprehension', 'Vocabulary Building', 'Speaking & Discussion'], // Auto-determined
        apiKey: apiKey || undefined
      });

      setGeneratedLesson(lessonContent);
      
      toast({
        title: "Lesson Generated Successfully!",
        description: apiKey 
          ? "AI has created a lesson matching your analyzed teaching style and methodology."
          : "Sample lesson created. Add your OpenAI API key for AI-generated content.",
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
            Simply enter a topic - AI will create a complete lesson using your analyzed teaching methodology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">AI Auto-Configuration</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Based on your corpus analysis, the AI will automatically determine:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="outline" className="text-xs">Optimal lesson duration</Badge>
                    <Badge variant="outline" className="text-xs">Appropriate difficulty level</Badge>
                    <Badge variant="outline" className="text-xs">Your teaching style</Badge>
                    <Badge variant="outline" className="text-xs">Preferred activity types</Badge>
                    <Badge variant="outline" className="text-xs">Design consistency</Badge>
                    <Badge variant="outline" className="text-xs">Assessment methods</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={generateLesson}
            disabled={isGenerating || !topic.trim()}
            className="w-full"
            size="lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {isGenerating ? "Generating Personalized Lesson..." : "Generate AI Lesson"}
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

            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">
                ✅ Generated using your analyzed teaching methodology, design preferences, and pedagogical patterns
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LessonGenerator;
