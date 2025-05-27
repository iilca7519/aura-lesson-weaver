
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
  analysisData?: any;
  lessonSettings?: any;
  apiKey?: string;
}

export const generateLessonContent = async (params: GenerateLessonParams): Promise<LessonContent> => {
  const { topic, analysisData, lessonSettings, apiKey } = params;
  
  if (!apiKey) {
    return generateMockLesson(topic, analysisData, lessonSettings);
  }

  // Build comprehensive prompt using analysis data and settings
  const analysisPrompt = analysisData ? `
  ANALYZED TEACHING METHODOLOGY (Use this as your foundation):
  
  PEDAGOGICAL STYLE:
  - Teaching Approach: ${analysisData.pedagogicalInsights?.teachingStyle || 'Interactive'}
  - Preferred Activities: ${analysisData.pedagogicalInsights?.preferredActivityTypes?.join(', ') || 'Mixed activities'}
  - Assessment Method: ${analysisData.pedagogicalInsights?.assessmentApproach || 'Formative'}
  - Lesson Structure: ${analysisData.pedagogicalInsights?.lessonStructurePattern?.join(' → ') || 'Standard flow'}
  
  DESIGN PREFERENCES:
  - Color Palette: ${analysisData.designSystem?.dominantColors?.join(', ') || 'Professional colors'}
  - Typography: ${analysisData.designSystem?.preferredFonts?.join(', ') || 'Clear fonts'}
  - Layout Style: ${analysisData.designSystem?.commonLayouts?.map(l => l.layout).join(', ') || 'Standard layouts'}
  
  VISUAL PATTERNS:
  - Image Usage: ${analysisData.visualPatterns?.imageUsage || 'Moderate visual support'}
  - Text Formatting: ${analysisData.visualPatterns?.textFormatting || 'Clear hierarchy'}
  - Content Organization: ${analysisData.visualPatterns?.spacingPattern || 'Balanced layout'}
  ` : 'No corpus analysis available. Use general ESL best practices.';

  const settingsPrompt = lessonSettings ? `
  LESSON CUSTOMIZATION REQUIREMENTS:
  - Target Audience: ${lessonSettings.targetAudience || 'intermediate'}
  - Duration: ${lessonSettings.lessonDuration || 45} minutes
  - Difficulty: ${lessonSettings.difficultyLevel || 'intermediate'}
  - Focus Areas: ${lessonSettings.focusAreas?.join(', ') || 'reading, vocabulary'}
  - Vocabulary Count: ${lessonSettings.vocabularyCount || 8} words
  - Reading Length: ${lessonSettings.readingLength || 'medium'}
  - Interaction Style: ${lessonSettings.interactionStyle || 'collaborative'}
  - Activity Intensity: Level ${lessonSettings.activityIntensity || 3}/5
  - Assessment: ${lessonSettings.assessmentStyle || 'formative'}
  - Include Visuals: ${lessonSettings.includeVisuals ? 'Yes' : 'No'}
  ` : 'Use standard lesson parameters.';

  const prompt = `Create a comprehensive English lesson plan for "${topic}".

  ${analysisPrompt}
  
  ${settingsPrompt}
  
  CRITICAL INSTRUCTIONS:
  1. MATCH the analyzed teaching methodology exactly - use the same activity types, progression, and style
  2. APPLY the customization settings precisely - respect duration, difficulty, and focus areas
  3. MAINTAIN consistency with the user's established pedagogical patterns
  4. CREATE content that feels authentic to the user's teaching voice and approach
  
  Generate lesson content as valid JSON:
  {
    "title": "string",
    "introduction": "string (match the user's introduction style)", 
    "readingPassage": "string (${lessonSettings?.readingLength || 'medium'} length)",
    "vocabulary": [{"word": "string", "definition": "string", "example": "string"}] (exactly ${lessonSettings?.vocabularyCount || 8} words),
    "comprehensionQuestions": ["string"] (${lessonSettings?.difficultyLevel || 'intermediate'} level),
    "discussionQuestions": ["string"] (match ${lessonSettings?.interactionStyle || 'collaborative'} style),
    "activities": [{"type": "string", "content": "string", "instructions": "string"}] (intensity level ${lessonSettings?.activityIntensity || 3}/5),
    "conclusion": "string (match user's conclusion style)"
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
            content: 'You are an expert ESL teacher who creates lessons that perfectly match analyzed teaching methodologies. Your goal is to generate content that feels like it was created by the original teacher, maintaining their style, approach, and preferences while adapting to new topics.'
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
    return generateMockLesson(topic, analysisData, lessonSettings);
  }
};

const generateMockLesson = (topic: string, analysisData?: any, settings?: any): LessonContent => {
  const duration = settings?.lessonDuration || 45;
  const vocabCount = settings?.vocabularyCount || 8;
  const difficulty = settings?.difficultyLevel || 'intermediate';
  const interactionStyle = settings?.interactionStyle || 'collaborative';
  const activityTypes = analysisData?.pedagogicalInsights?.preferredActivityTypes || ['Interactive Learning', 'Group Discussion'];
  const teachingStyle = analysisData?.pedagogicalInsights?.teachingStyle || 'Interactive and engaging';
  
  const readingPassages = {
    short: `${topic} is a fascinating subject that connects to our daily lives in many ways. Through ${teachingStyle.toLowerCase()}, we can explore this topic effectively. This lesson incorporates proven methods from your teaching corpus, ensuring students engage meaningfully with the content while following familiar patterns and approaches.`,
    medium: `${topic} represents a complex and engaging subject that offers numerous opportunities for language learning and cultural exploration. Based on your analyzed teaching methodology, this lesson incorporates ${interactionStyle} approaches and maintains the ${teachingStyle.toLowerCase()} style you consistently use. Students will encounter authentic materials and participate in activities that mirror your established pedagogical preferences. The content is structured to follow your typical lesson progression, incorporating the specific activity types and assessment methods that characterize your teaching approach. This ensures consistency with your educational philosophy while introducing fresh content on ${topic}. Through carefully designed interactions and scaffolded learning experiences, students will develop both language skills and cultural awareness related to this important topic.`,
    long: `${topic} is a multifaceted subject that offers rich opportunities for comprehensive language learning and deep cultural exploration. This extensive lesson has been carefully designed to reflect your unique teaching methodology, as identified through detailed analysis of your PowerPoint corpus. The lesson incorporates your preferred ${interactionStyle} interaction style and maintains the ${teachingStyle.toLowerCase()} approach that defines your educational philosophy. Students will engage with authentic, real-world materials while participating in carefully structured activities that mirror your established pedagogical patterns. The content progression follows your typical lesson flow, beginning with engaging hooks, moving through systematic content delivery, and concluding with meaningful assessment and reflection. Each component has been tailored to match your specific preferences for activity types, timing, and student interaction patterns. Throughout the lesson, students will encounter vocabulary, reading passages, and discussion topics that not only teach about ${topic} but also reinforce language skills through methods that feel familiar and comfortable based on your teaching style. The activities progress from individual reflection to pair work and group discussions, following the collaborative patterns identified in your corpus analysis. This comprehensive approach ensures that students receive instruction that maintains the quality and effectiveness of your established teaching methodology while exploring new and engaging content related to ${topic}.`
  };

  const readingLength = settings?.readingLength || 'medium';
  
  return {
    title: `Exploring ${topic}: A ${duration}-Minute ${difficulty} Lesson`,
    introduction: `Welcome to today's ${duration}-minute lesson on ${topic}. Based on your analyzed teaching methodology, this lesson incorporates ${activityTypes.join(' and ')} to ensure maximum engagement. We'll follow your established ${teachingStyle.toLowerCase()} approach throughout.`,
    readingPassage: readingPassages[readingLength],
    vocabulary: Array.from({ length: vocabCount }, (_, i) => {
      const words = [
        { word: "methodology", definition: "A systematic approach to teaching", example: "Our methodology focuses on student engagement." },
        { word: "analysis", definition: "Detailed examination of elements", example: "The analysis revealed clear patterns in teaching style." },
        { word: "engagement", definition: "Active participation in learning", example: "Student engagement increases with familiar teaching patterns." },
        { word: "authentic", definition: "Real and genuine materials", example: "Authentic materials connect learning to real life." },
        { word: "collaborative", definition: "Working together cooperatively", example: "Collaborative activities enhance peer learning." },
        { word: "scaffolded", definition: "Providing structured support", example: "Scaffolded instruction helps students build confidence." },
        { word: "comprehensive", definition: "Complete and thorough", example: "A comprehensive approach covers all skill areas." },
        { word: "systematic", definition: "Done in an organized way", example: "Systematic teaching follows clear progression patterns." }
      ];
      return words[i % words.length];
    }),
    comprehensionQuestions: [
      `How does ${topic} relate to your daily experience?`,
      `What are the main concepts we explored about ${topic}?`,
      `How do the teaching methods used here compare to your expectations?`,
      `What connections can you make between ${topic} and other subjects?`
    ],
    discussionQuestions: [
      `In your opinion, what is the most important aspect of ${topic}?`,
      `How might ${topic} be relevant in your future career or studies?`,
      `What questions do you still have about ${topic}?`,
      `How can we apply what we learned about ${topic} in real situations?`
    ],
    activities: activityTypes.slice(0, settings?.activityIntensity || 3).map((type, index) => ({
      type: type,
      content: `${type} activity focused on ${topic} concepts`,
      instructions: `Implement this ${type.toLowerCase()} following your established ${interactionStyle} methodology. Duration: ${Math.floor(duration / (settings?.activityIntensity || 3))} minutes.`
    })),
    conclusion: `Today's exploration of ${topic} demonstrates how personalized lesson generation can maintain your teaching style while delivering fresh content. The ${duration}-minute structure and ${difficulty} level match your specified preferences, ensuring consistency with your pedagogical approach.`
  };
};
