
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Users, Brain, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLessonContent } from "@/services/aiService";
import ApiKeyInput from "./ApiKeyInput";

const LessonGenerator = () => {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [duration, setDuration] = useState(45);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
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

  const availableFocusAreas = [
    "Reading Comprehension", "Vocabulary Building", "Grammar Practice",
    "Speaking & Discussion", "Listening Skills", "Writing Practice",
    "Cultural Awareness", "Real-world Application"
  ];

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      setFocusAreas(prev => [...prev, area]);
    } else {
      setFocusAreas(prev => prev.filter(item => item !== area));
    }
  };

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
        level: level as 'Beginner' | 'Intermediate' | 'Advanced',
        duration,
        focusAreas,
        apiKey: apiKey || undefined
      });

      setGeneratedLesson(lessonContent);
      
      toast({
        title: "Lesson Generated Successfully!",
        description: apiKey 
          ? "AI has created a new lesson using advanced language models."
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
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Lesson Generator
          </CardTitle>
          <CardDescription>
            Create engaging English lessons with minimal input using advanced AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Lesson Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Environmental Challenges, Technology in Daily Life"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="level">Proficiency Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="120"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label>Focus Areas</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableFocusAreas.map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area}
                      checked={focusAreas.includes(area)}
                      onCheckedChange={(checked) => handleFocusAreaChange(area, checked as boolean)}
                    />
                    <Label htmlFor={area} className="text-sm">{area}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button 
            onClick={generateLesson}
            disabled={isGenerating || !topic.trim()}
            className="w-full"
            size="lg"
          >
            <Brain className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating Lesson..." : "Generate AI Lesson"}
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
                  Export
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LessonGenerator;
