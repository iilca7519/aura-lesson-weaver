
interface LessonContent {
  title: string;
  introduction: string;
  readingPassage: string;
  vocabulary: Array<{ word: string; definition: string; example: string }>;
  comprehensionQuestions: string[];
  discussionQuestions: string[];
  activities: Array<{ type: string; content: string; instructions: string }>;
  conclusion: string;
}

interface GenerateLessonParams {
  topic: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: number;
  focusAreas?: string[];
  apiKey?: string;
}

export const generateLessonContent = async (params: GenerateLessonParams): Promise<LessonContent> => {
  const { topic, apiKey } = params;
  
  if (!apiKey) {
    return generateMockLesson(topic);
  }

  // Enhanced prompt that incorporates corpus analysis data
  const prompt = `Create a comprehensive English lesson plan for the topic "${topic}".

  Based on the analyzed teaching corpus, use the following methodology:
  - Teaching Style: Interactive and student-centered approach
  - Lesson Structure: Engagement → Objectives → Content Delivery (40%) → Guided Practice (25%) → Independent Application (20%) → Assessment (5%)
  - Preferred Activities: Collaborative learning, visual-based instruction, scaffolded practice
  - Assessment Approach: Continuous formative assessment with peer interaction
  - Design Preferences: Clear hierarchy, generous white space, consistent visual elements
  
  The lesson should incorporate:
  1. Question-based engagement with visual hook
  2. Context setting and vocabulary pre-teaching
  3. Main content delivery with visual support
  4. Pair work and group discussions
  5. Individual reflection and role playing activities
  6. Formative Q&A and peer assessment
  7. Summary with preview of next lesson
  
  Structure the response as valid JSON:
  {
    "title": "string",
    "introduction": "string", 
    "readingPassage": "string (300-500 words)",
    "vocabulary": [{"word": "string", "definition": "string", "example": "string"}],
    "comprehensionQuestions": ["string"],
    "discussionQuestions": ["string"],
    "activities": [{"type": "string", "content": "string", "instructions": "string"}],
    "conclusion": "string"
  }`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert ESL teacher who creates lessons based on analyzed teaching methodology and style patterns. Generate engaging, pedagogically sound lesson plans that match the provided teaching approach.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating lesson:', error);
    return generateMockLesson(topic);
  }
};

const generateMockLesson = (topic: string): LessonContent => {
  return {
    title: `Exploring ${topic}: An Interactive Journey`,
    introduction: `Welcome to today's engaging lesson on ${topic}. Using our analyzed interactive teaching methodology, this lesson will guide you through collaborative learning experiences, visual discoveries, and meaningful discussions that connect to your daily life.`,
    readingPassage: `${topic} represents one of the most fascinating and relevant subjects in our modern world. Through interactive exploration and collaborative discovery, we can understand how this topic influences our daily experiences and shapes our future perspectives. This lesson incorporates visual learning, peer discussions, and hands-on activities to ensure deep comprehension and practical application. As we journey through different aspects of ${topic}, you'll engage in scaffolded practice that builds your confidence while developing critical thinking skills. The activities are designed to promote both individual reflection and group collaboration, following proven pedagogical patterns that enhance learning retention and real-world application.`,
    vocabulary: [
      { word: "interactive", definition: "Involving active participation between people", example: "Our interactive lesson encourages student collaboration." },
      { word: "collaborative", definition: "Working together towards a common goal", example: "Collaborative learning helps students share knowledge effectively." },
      { word: "methodology", definition: "A system of methods used in a particular area", example: "Our teaching methodology focuses on student engagement." },
      { word: "scaffolded", definition: "Providing structured support to help learning", example: "Scaffolded practice helps students build confidence gradually." },
      { word: "pedagogical", definition: "Related to teaching and education methods", example: "These pedagogical approaches improve learning outcomes." },
    ],
    comprehensionQuestions: [
      `What are the main aspects of ${topic} discussed in the passage?`,
      "How does interactive learning enhance understanding of complex topics?",
      "Why is collaborative discovery important in education?",
      "What role do visual elements play in effective learning?",
      "How can scaffolded practice build student confidence?"
    ],
    discussionQuestions: [
      `How does ${topic} impact your daily life and future goals?`,
      "What are the benefits of interactive learning compared to traditional methods?",
      "How can collaborative activities improve your understanding of complex subjects?",
      "What visual learning strategies work best for you personally?"
    ],
    activities: [
      {
        type: "Collaborative Discovery",
        content: `Work in pairs to create a mind map about ${topic}`,
        instructions: "Use the vocabulary words and discuss how each concept connects to your personal experiences. Present your findings to another pair."
      },
      {
        type: "Interactive Role Play",
        content: `Design a scenario where ${topic} plays a central role`,
        instructions: "Create a 3-minute dialogue incorporating at least 4 vocabulary words. Focus on real-world applications and peer interaction."
      },
      {
        type: "Visual Reflection",
        content: `Create a visual representation of your learning journey`,
        instructions: "Draw or design a simple diagram showing how your understanding of the topic has evolved. Share with the class for peer feedback."
      }
    ],
    conclusion: `Today's interactive exploration of ${topic} has demonstrated the power of collaborative learning and visual discovery. Through scaffolded practice and peer discussions, you've developed both vocabulary and critical thinking skills. For next lesson, we'll build on these foundations to explore advanced applications and real-world connections.`
  };
};
