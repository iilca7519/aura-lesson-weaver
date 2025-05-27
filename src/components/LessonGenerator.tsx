
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, FileText, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const LessonGenerator = () => {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [focus, setFocus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedLesson, setGeneratedLesson] = useState(null);
  const { toast } = useToast();

  const generateLesson = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a lesson topic to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // Simulate AI generation process
    const steps = [
      "Analyzing topic context...",
      "Accessing knowledge base...",
      "Generating lesson structure...",
      "Creating reading passages...",
      "Designing vocabulary exercises...",
      "Generating discussion questions...",
      "Applying visual design system...",
      "Finalizing lesson content..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(((i + 1) / steps.length) * 100);
      
      toast({
        title: "AI Generation Progress",
        description: steps[i],
      });
    }

    // Simulate generated lesson data
    setGeneratedLesson({
      title: `${topic}: A Comprehensive Lesson`,
      sections: [
        "Introduction & Warm-up",
        "Reading Passage",
        "Vocabulary Focus",
        "Comprehension Questions",
        "Discussion Activities",
        "Practical Application",
        "Wrap-up & Reflection"
      ],
      wordCount: 1247,
      estimatedDuration: "45-60 minutes",
      difficultyLevel: level || "Intermediate"
    });

    setIsGenerating(false);
    toast({
      title: "Lesson Generated Successfully!",
      description: "Your AI-powered lesson is ready for review.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Lesson Generator
          </CardTitle>
          <CardDescription>
            Describe your lesson topic and let AI create a complete, contextually relevant lesson
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Lesson Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Environmental Challenges, The Future of Work, Healthy Eating"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="level">Proficiency Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select level (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                    <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="focus">Special Focus</Label>
                <Select value={focus} onValueChange={setFocus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Optional emphasis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vocabulary">Vocabulary Building</SelectItem>
                    <SelectItem value="speaking">Speaking Practice</SelectItem>
                    <SelectItem value="reading">Reading Comprehension</SelectItem>
                    <SelectItem value="culture">Cultural Awareness</SelectItem>
                    <SelectItem value="business">Business Context</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific requirements, themes, or adjustments you'd like the AI to consider..."
                  className="mt-1 h-32"
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  AI-Powered
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Style-Consistent
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Context-Aware
                </Badge>
              </div>
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generating Lesson...</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={generateLesson} 
              disabled={isGenerating || !topic.trim()}
              className="flex-1"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Complete Lesson"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedLesson && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Generated Lesson: {generatedLesson.title}
            </CardTitle>
            <CardDescription>
              AI has created a complete lesson based on your specifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Word Count</div>
                <div className="text-gray-600">{generatedLesson.wordCount} words</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Duration</div>
                <div className="text-gray-600">{generatedLesson.estimatedDuration}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Level</div>
                <div className="text-gray-600">{generatedLesson.difficultyLevel}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Lesson Structure:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {generatedLesson.sections.map((section, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                      {index + 1}
                    </div>
                    <span className="text-blue-900">{section}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Preview Lesson
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export to PowerPoint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LessonGenerator;
