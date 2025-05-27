
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, BookOpen, Sparkles, Upload, Plus, FileText, Settings } from "lucide-react";
import LessonGenerator from "@/components/LessonGenerator";
import CorpusAnalyzer from "@/components/CorpusAnalyzer";
import LessonLibrary from "@/components/LessonLibrary";

const Index = () => {
  const [activeTab, setActiveTab] = useState("generator");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Lesson Designer</h1>
                <p className="text-sm text-gray-600">Autonomous Educational Content Creation</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Intelligent Lesson Creation System
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl">
            Upload your lesson corpus, let AI analyze your teaching style and methodology, 
            then generate new contextually relevant lessons with minimal input.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Analyze Corpus
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Lesson
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Lesson Library
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyzer" className="space-y-6">
            <CorpusAnalyzer />
          </TabsContent>

          <TabsContent value="generator" className="space-y-6">
            <LessonGenerator />
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <LessonLibrary />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Knowledge Base Insights
                </CardTitle>
                <CardDescription>
                  Understanding your teaching patterns and methodologies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Pedagogical Patterns</h4>
                    <p className="text-sm text-blue-700">
                      Identified 15 common lesson structures and 8 activity sequences in your corpus.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Style Analysis</h4>
                    <p className="text-sm text-green-700">
                      Conversational tone, intermediate complexity, with emphasis on practical application.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">Visual Consistency</h4>
                    <p className="text-sm text-purple-700">
                      Extracted design system: 6 color themes, 12 layout templates, 200+ curated images.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
