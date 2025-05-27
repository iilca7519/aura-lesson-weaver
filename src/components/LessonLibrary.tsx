
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Filter, Download, Eye, Edit, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LessonLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterType, setFilterType] = useState("");

  // Sample lesson data
  const lessons = [
    {
      id: 1,
      title: "Environmental Challenges in Modern Society",
      description: "Comprehensive lesson covering climate change, pollution, and sustainable solutions",
      level: "Intermediate",
      type: "AI Generated",
      duration: "50 minutes",
      wordCount: 1247,
      rating: 4.8,
      dateCreated: "2024-05-25",
      tags: ["Environment", "Discussion", "Vocabulary"]
    },
    {
      id: 2,
      title: "The Future of Work and Technology",
      description: "Exploring how AI and automation are changing the workplace",
      level: "Advanced",
      type: "AI Generated",
      duration: "45 minutes",
      wordCount: 1156,
      rating: 4.9,
      dateCreated: "2024-05-24",
      tags: ["Technology", "Future", "Business"]
    },
    {
      id: 3,
      title: "Healthy Eating Habits for Busy Professionals",
      description: "Practical nutrition advice and meal planning strategies",
      level: "Beginner",
      type: "Original",
      duration: "40 minutes",
      wordCount: 892,
      rating: 4.6,
      dateCreated: "2024-05-23",
      tags: ["Health", "Lifestyle", "Practical"]
    },
    {
      id: 4,
      title: "Cultural Diversity in Global Business",
      description: "Understanding cultural differences in international business contexts",
      level: "Intermediate",
      type: "AI Generated",
      duration: "55 minutes",
      wordCount: 1334,
      rating: 4.7,
      dateCreated: "2024-05-22",
      tags: ["Culture", "Business", "Communication"]
    }
  ];

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !filterLevel || lesson.level === filterLevel;
    const matchesType = !filterType || lesson.type === filterType;
    
    return matchesSearch && matchesLevel && matchesType;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-blue-100 text-blue-800";
      case "Advanced": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type) => {
    return type === "AI Generated" 
      ? "bg-orange-100 text-orange-800" 
      : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            Lesson Library
          </CardTitle>
          <CardDescription>
            Browse, search, and manage your collection of generated and original lessons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search lessons by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="AI Generated">AI Generated</SelectItem>
                  <SelectItem value="Original">Original</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredLessons.length} of {lessons.length} lessons
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLessons.map((lesson) => (
          <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{lesson.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {lesson.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{lesson.rating}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getLevelColor(lesson.level)}>
                  {lesson.level}
                </Badge>
                <Badge className={getTypeColor(lesson.type)}>
                  {lesson.type}
                </Badge>
                {lesson.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <div className="font-medium text-gray-900">{lesson.duration}</div>
                  <div>Duration</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{lesson.wordCount}</div>
                  <div>Words</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{lesson.dateCreated}</div>
                  <div>Created</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find lessons.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LessonLibrary;
