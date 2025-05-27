
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
  analysisData?: any; // Real analysis data from corpus
  apiKey?: string;
}

export const generateLessonContent = async (params: GenerateLessonParams): Promise<LessonContent> => {
  const { topic, analysisData, apiKey } = params;
  
  if (!apiKey) {
    return generateMockLesson(topic, analysisData);
  }

  // Enhanced prompt that incorporates real corpus analysis data
  const analysisPrompt = analysisData ? `
  Based on comprehensive analysis of the user's PowerPoint corpus, use the following REAL methodology data:
  
  DESIGN SYSTEM:
  - Primary Colors: ${analysisData.designSystem?.dominantColors?.join(', ') || 'Not analyzed'}
  - Preferred Fonts: ${analysisData.designSystem?.preferredFonts?.join(', ') || 'Not analyzed'}
  - Common Layouts: ${analysisData.designSystem?.commonLayouts?.map(l => l.layout).join(', ') || 'Not analyzed'}
  
  PEDAGOGICAL PATTERNS:
  - Teaching Style: ${analysisData.pedagogicalInsights?.teachingStyle || 'Interactive approach'}
  - Preferred Activities: ${analysisData.pedagogicalInsights?.preferredActivityTypes?.join(', ') || 'Mixed activities'}
  - Assessment Approach: ${analysisData.pedagogicalInsights?.assessmentApproach || 'Formative assessment'}
  - Lesson Structure: ${analysisData.pedagogicalInsights?.lessonStructurePattern?.join(' → ') || 'Standard flow'}
  
  VISUAL PATTERNS:
  - Image Usage: ${analysisData.visualPatterns?.imageUsage || 'Moderate visual support'}
  - Text Formatting: ${analysisData.visualPatterns?.textFormatting || 'Clear hierarchy'}
  - Spacing Pattern: ${analysisData.visualPatterns?.spacingPattern || 'Balanced layout'}
  
  CONFIDENCE METRICS:
  - Design Consistency: ${analysisData.confidence?.designConsistency || 0}%
  - Pedagogical Alignment: ${analysisData.confidence?.pedagogicalAlignment || 0}%
  - Style Recognition: ${analysisData.confidence?.styleRecognition || 0}%
  ` : `
  No corpus analysis available. Use general best practices for English language teaching.
  `;

  const prompt = `Create a comprehensive English lesson plan for the topic "${topic}".

  ${analysisPrompt}
  
  IMPORTANT: Match the analyzed teaching methodology exactly. Use the specific activity types, assessment methods, and lesson structure patterns identified from the corpus analysis.
  
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
            content: 'You are an expert ESL teacher who creates lessons based on real analyzed teaching methodology and style patterns. Generate engaging, pedagogically sound lesson plans that precisely match the provided corpus analysis data.'
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
    return generateMockLesson(topic, analysisData);
  }
};

const generateMockLesson = (topic: string, analysisData?: any): LessonContent => {
  const activityTypes = analysisData?.pedagogicalInsights?.preferredActivityTypes || ['Interactive Learning', 'Collaborative Work'];
  const teachingStyle = analysisData?.pedagogicalInsights?.teachingStyle || 'Interactive and engaging approach';
  
  return {
    title: `Exploring ${topic}: ${teachingStyle}`,
    introduction: `Welcome to today's lesson on ${topic}. Based on your analyzed teaching methodology, this lesson incorporates ${activityTypes.join(' and ')} to ensure maximum engagement and learning outcomes.`,
    readingPassage: `${topic} represents a fascinating subject that connects to our daily experiences in meaningful ways. Through the lens of your established teaching methodology, we explore this topic using proven pedagogical approaches that have been identified through corpus analysis. Your teaching style emphasizes ${teachingStyle.toLowerCase()}, which we'll implement throughout this lesson. The content is structured to match your preferred lesson flow patterns, incorporating the specific activity types and assessment methods that characterize your teaching approach. Students will engage with visual elements, collaborative discussions, and hands-on activities that reflect your established pedagogical preferences. This ensures consistency with your teaching brand while delivering fresh content on ${topic}.`,
    vocabulary: [
      { word: "methodology", definition: "A systematic approach to teaching and learning", example: "Our methodology focuses on student engagement and real-world application." },
      { word: "pedagogical", definition: "Related to teaching methods and educational theory", example: "The pedagogical approach used in this lesson promotes active learning." },
      { word: "corpus", definition: "A large collection of written or spoken material for analysis", example: "The corpus analysis revealed consistent patterns in teaching style." },
      { word: "engagement", definition: "Active participation and involvement in learning", example: "Student engagement increases when lessons match familiar teaching patterns." },
      { word: "collaborative", definition: "Working together towards a common educational goal", example: "Collaborative activities enhance peer learning and knowledge sharing." },
    ],
    comprehensionQuestions: [
      `How does ${topic} relate to the teaching methodology identified in your corpus?`,
      "What are the key pedagogical patterns that make this lesson effective?",
      "How do the analyzed teaching preferences enhance student understanding?",
      "What role does corpus analysis play in creating personalized lessons?"
    ],
    discussionQuestions: [
      `How can ${topic} be integrated into your existing teaching framework?`,
      "What aspects of your teaching style contribute most to student success?",
      "How might corpus analysis inform future lesson development?",
      "What connections do you see between this topic and your pedagogical approach?"
    ],
    activities: activityTypes.map((type, index) => ({
      type: type,
      content: `${type} activity focused on ${topic}`,
      instructions: `Implement this ${type.toLowerCase()} using your established teaching methodology. Follow the lesson structure patterns identified in your corpus analysis.`
    })),
    conclusion: `Today's exploration of ${topic} has demonstrated how corpus analysis can inform personalized lesson creation. The lesson structure and activities reflect your established teaching methodology, ensuring consistency with your pedagogical brand while delivering engaging content.`
  };
};
