
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Wand2 } from "lucide-react";

interface LessonSettings {
  targetAudience: string;
  lessonDuration: number;
  difficultyLevel: string;
  focusAreas: string[];
  includeVisuals: boolean;
  activityIntensity: number;
  assessmentStyle: string;
  vocabularyCount: number;
  readingLength: string;
  interactionStyle: string;
}

interface LessonGenerationSettingsProps {
  onSettingsChange: (settings: LessonSettings) => void;
  analysisData?: any;
}

const LessonGenerationSettings = ({ onSettingsChange, analysisData }: LessonGenerationSettingsProps) => {
  const [settings, setSettings] = useState<LessonSettings>({
    targetAudience: "intermediate",
    lessonDuration: 45,
    difficultyLevel: "intermediate",
    focusAreas: ["reading", "vocabulary"],
    includeVisuals: true,
    activityIntensity: 3,
    assessmentStyle: "formative",
    vocabularyCount: 8,
    readingLength: "medium",
    interactionStyle: "collaborative"
  });

  const updateSetting = (key: keyof LessonSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const toggleFocusArea = (area: string) => {
    const newAreas = settings.focusAreas.includes(area)
      ? settings.focusAreas.filter(a => a !== area)
      : [...settings.focusAreas, area];
    updateSetting('focusAreas', newAreas);
  };

  const availableFocusAreas = [
    'reading', 'vocabulary', 'grammar', 'speaking', 
    'listening', 'writing', 'culture', 'pronunciation'
  ];

  // Extract analyzed preferences if available
  const suggestedActivityTypes = analysisData?.pedagogicalInsights?.preferredActivityTypes || [];
  const suggestedStyle = analysisData?.pedagogicalInsights?.teachingStyle || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          Lesson Generation Settings
        </CardTitle>
        <CardDescription>
          Customize how AI generates lessons based on your analyzed teaching methodology
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysisData && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Detected Teaching Preferences</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedActivityTypes.map((type: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs bg-white">
                  {type}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-blue-700">
              Style: {suggestedStyle}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-audience">Target Audience</Label>
              <Select value={settings.targetAudience} onValueChange={(value) => updateSetting('targetAudience', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                  <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                  <SelectItem value="mixed">Mixed Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lesson-duration">Lesson Duration (minutes)</Label>
              <div className="pt-2">
                <Slider
                  value={[settings.lessonDuration]}
                  onValueChange={([value]) => updateSetting('lessonDuration', value)}
                  max={120}
                  min={15}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>15min</span>
                  <span className="font-medium">{settings.lessonDuration}min</span>
                  <span>120min</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={settings.difficultyLevel} onValueChange={(value) => updateSetting('difficultyLevel', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="challenging">Challenging</SelectItem>
                  <SelectItem value="adaptive">Adaptive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vocabulary-count">Vocabulary Words</Label>
              <div className="pt-2">
                <Slider
                  value={[settings.vocabularyCount]}
                  onValueChange={([value]) => updateSetting('vocabularyCount', value)}
                  max={20}
                  min={3}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>3</span>
                  <span className="font-medium">{settings.vocabularyCount} words</span>
                  <span>20</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reading-length">Reading Passage Length</Label>
              <Select value={settings.readingLength} onValueChange={(value) => updateSetting('readingLength', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (200-300 words)</SelectItem>
                  <SelectItem value="medium">Medium (400-500 words)</SelectItem>
                  <SelectItem value="long">Long (600-800 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="interaction-style">Interaction Style</Label>
              <Select value={settings.interactionStyle} onValueChange={(value) => updateSetting('interactionStyle', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Work</SelectItem>
                  <SelectItem value="collaborative">Collaborative</SelectItem>
                  <SelectItem value="mixed">Mixed Approach</SelectItem>
                  <SelectItem value="discussion-heavy">Discussion Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assessment-style">Assessment Style</Label>
              <Select value={settings.assessmentStyle} onValueChange={(value) => updateSetting('assessmentStyle', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formative">Formative (During lesson)</SelectItem>
                  <SelectItem value="summative">Summative (End assessment)</SelectItem>
                  <SelectItem value="peer">Peer Assessment</SelectItem>
                  <SelectItem value="self-reflection">Self Reflection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="activity-intensity">Activity Intensity</Label>
              <div className="pt-2">
                <Slider
                  value={[settings.activityIntensity]}
                  onValueChange={([value]) => updateSetting('activityIntensity', value)}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Low</span>
                  <span className="font-medium">Level {settings.activityIntensity}</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-base font-medium mb-3 block">Focus Areas</Label>
          <div className="flex flex-wrap gap-2">
            {availableFocusAreas.map((area) => (
              <Badge
                key={area}
                variant={settings.focusAreas.includes(area) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFocusArea(area)}
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="include-visuals" className="text-base font-medium">Include Visual Elements</Label>
            <p className="text-sm text-gray-600">Add image placeholders and visual activity suggestions</p>
          </div>
          <Switch
            id="include-visuals"
            checked={settings.includeVisuals}
            onCheckedChange={(checked) => updateSetting('includeVisuals', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonGenerationSettings;
