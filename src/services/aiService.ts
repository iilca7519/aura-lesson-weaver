
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
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  focusAreas: string[];
  apiKey?: string;
}

export const generateLessonContent = async (params: GenerateLessonParams): Promise<LessonContent> => {
  const { topic, level, duration, focusAreas, apiKey } = params;
  
  if (!apiKey) {
    // Return mock data for now when no API key is provided
    return generateMockLesson(topic, level);
  }

  const prompt = `Create a comprehensive English lesson plan for the topic "${topic}" at ${level} level.
  
  The lesson should be ${duration} minutes long and focus on: ${focusAreas.join(', ')}.
  
  Please structure the lesson as follows:
  1. Title and brief introduction
  2. Reading passage (200-400 words appropriate for ${level} level)
  3. Key vocabulary (8-12 words with definitions and example sentences)
  4. Comprehension questions (5-7 questions)
  5. Discussion questions (3-5 open-ended questions)
  6. Practice activities (2-3 varied activities)
  7. Lesson conclusion and summary
  
  Use clear, engaging language appropriate for ESL students. Make the content practical and relevant.
  
  Return the response in valid JSON format matching this structure:
  {
    "title": "string",
    "introduction": "string", 
    "readingPassage": "string",
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
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert ESL teacher and curriculum designer. Create engaging, pedagogically sound lesson plans in JSON format.'
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
    // Fallback to mock data if API fails
    return generateMockLesson(topic, level);
  }
};

const generateMockLesson = (topic: string, level: string): LessonContent => {
  return {
    title: `${topic}: A Comprehensive Study`,
    introduction: `Welcome to today's lesson on ${topic}. This ${level.toLowerCase()}-level lesson will help you develop your English skills while exploring this fascinating topic.`,
    readingPassage: `${topic} is an important subject that affects many aspects of our daily lives. Understanding this topic will help you communicate more effectively in English and broaden your knowledge of the world around us. Through this lesson, you will learn key vocabulary, practice reading comprehension, and engage in meaningful discussions that will enhance your language skills.`,
    vocabulary: [
      { word: "significant", definition: "Important or notable", example: "This topic has significant impact on society." },
      { word: "comprehensive", definition: "Complete and thorough", example: "We need a comprehensive understanding of the subject." },
      { word: "relevant", definition: "Closely connected or appropriate", example: "This information is very relevant to our discussion." },
    ],
    comprehensionQuestions: [
      `What is the main focus of this lesson about ${topic}?`,
      "Why is this topic important to study?",
      "How can learning about this topic improve your English skills?"
    ],
    discussionQuestions: [
      `What is your personal experience with ${topic}?`,
      "How does this topic relate to your daily life?",
      "What questions do you have about this subject?"
    ],
    activities: [
      {
        type: "Vocabulary Practice",
        content: "Match the vocabulary words with their definitions",
        instructions: "Work in pairs to complete the vocabulary matching exercise"
      },
      {
        type: "Role Play",
        content: `Create a dialogue discussing ${topic}`,
        instructions: "Use at least 3 vocabulary words from today's lesson"
      }
    ],
    conclusion: `Today we explored ${topic} and learned valuable vocabulary and concepts. Remember to practice using these new words in your daily conversations.`
  };
};
