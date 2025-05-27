
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
  ANALYZED TEACHING METHODOLOGY (Match this EXACTLY):
  
  PEDAGOGICAL PATTERNS FROM YOUR CORPUS:
  - Teaching Style: ${analysisData.pedagogicalInsights?.teachingStyle || 'Interactive'}
  - Your Specific Activity Types: ${analysisData.pedagogicalInsights?.preferredActivityTypes?.join(', ') || 'Mixed activities'}
  - Your Lesson Structure Pattern: ${analysisData.pedagogicalInsights?.lessonStructurePattern?.join(' → ') || 'Standard flow'}
  - Your Assessment Approach: ${analysisData.pedagogicalInsights?.assessmentApproach || 'Formative'}
  
  DESIGN CONSISTENCY (Apply these patterns):
  - Your Color Palette: ${analysisData.designSystem?.dominantColors?.join(', ') || 'Professional colors'}
  - Your Typography: ${analysisData.designSystem?.preferredFonts?.join(', ') || 'Clear fonts'}
  - Your Layout Patterns: ${analysisData.designSystem?.commonLayouts?.map(l => `${l.layout} (${l.usage}% usage)`).join(', ') || 'Standard layouts'}
  
  VISUAL APPROACH FROM YOUR STYLE:
  - Image Usage: ${analysisData.visualPatterns?.imageUsage || 'Moderate visual support'}
  - Content Organization: ${analysisData.visualPatterns?.spacingPattern || 'Balanced layout'}
  - Text Hierarchy: ${analysisData.visualPatterns?.textFormatting || 'Clear structure'}
  
  CRITICAL: Use the EXACT activity types found in your corpus. Do not deviate from your established patterns.
  ` : 'No corpus analysis available. Use general ESL best practices.';

  const settingsPrompt = lessonSettings ? `
  LESSON CUSTOMIZATION (Apply these specifications):
  - Target Audience: ${lessonSettings.targetAudience || 'intermediate'}
  - Duration: ${lessonSettings.lessonDuration || 45} minutes
  - Difficulty: ${lessonSettings.difficultyLevel || 'intermediate'}  
  - Focus Areas: ${lessonSettings.focusAreas?.join(', ') || 'reading, vocabulary'}
  - Vocabulary Count: EXACTLY ${lessonSettings.vocabularyCount || 8} words
  - Reading Length: ${lessonSettings.readingLength || 'medium'} passage
  - Interaction Style: ${lessonSettings.interactionStyle || 'collaborative'}
  - Activity Intensity: Level ${lessonSettings.activityIntensity || 3}/5
  - Assessment Type: ${lessonSettings.assessmentStyle || 'formative'}
  - Visual Elements: ${lessonSettings.includeVisuals ? 'Include visual placeholders' : 'Text-focused'}
  ` : 'Use standard lesson parameters.';

  const prompt = `Create a comprehensive English lesson on "${topic}" that PERFECTLY matches the analyzed teaching methodology.

  ${analysisPrompt}
  
  ${settingsPrompt}
  
  CRITICAL REQUIREMENTS:
  1. REPLICATE the exact activity types from the corpus analysis - do not create generic activities
  2. FOLLOW the specific lesson structure pattern identified in the analysis
  3. MATCH the teaching style and interaction patterns exactly
  4. APPLY the visual and organizational patterns from the corpus
  5. CREATE activities that feel authentic to the user's established approach
  6. MAINTAIN the same progression style and timing as the analyzed lessons
  
  The lesson must feel like it was created by the same teacher who made the analyzed PowerPoints.
  
  Return valid JSON:
  {
    "title": "string",
    "introduction": "string (match introduction style from corpus)", 
    "readingPassage": "string (${lessonSettings?.readingLength || 'medium'} length, match content style)",
    "vocabulary": [{"word": "string", "definition": "string", "example": "string"}] (exactly ${lessonSettings?.vocabularyCount || 8} words),
    "comprehensionQuestions": ["string"] (match question style and ${lessonSettings?.difficultyLevel || 'intermediate'} level),
    "discussionQuestions": ["string"] (match ${lessonSettings?.interactionStyle || 'collaborative'} approach),
    "activities": [{"type": "string", "content": "string", "instructions": "string"}] (use ONLY the activity types from corpus analysis),
    "conclusion": "string (match conclusion style from corpus)"
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
            content: 'You are an expert at replicating teaching styles. You analyze PowerPoint corpora and generate lessons that perfectly match the original teacher\'s methodology, activity types, progression patterns, and style. Your goal is authentic replication, not generic lesson creation.'
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
  
  // Use ACTUAL activity types from analysis, not generic ones
  const analyzedActivityTypes = analysisData?.pedagogicalInsights?.preferredActivityTypes || [];
  const activityTypes = analyzedActivityTypes.length > 0 ? analyzedActivityTypes : [
    'Discussion Activity', 'Pair Work', 'Reading Activity', 'Vocabulary Building'
  ];
  
  const teachingStyle = analysisData?.pedagogicalInsights?.teachingStyle || 'Interactive and systematic';
  const lessonStructure = analysisData?.pedagogicalInsights?.lessonStructurePattern || [
    'Lesson Introduction', 'Content Presentation', 'Interactive Activities', 'Assessment'
  ];
  
  const readingPassages = {
    short: `${topic} is a fascinating subject that connects to our daily lives. This lesson follows your established ${teachingStyle.toLowerCase()} approach, incorporating the specific activity patterns found in your PowerPoint corpus. Through ${interactionStyle} learning, students will explore this topic using your proven methodological framework.`,
    medium: `${topic} represents an engaging subject area that offers multiple opportunities for meaningful learning experiences. This lesson has been carefully designed to mirror your established teaching methodology, incorporating the specific ${activityTypes.join(', ').toLowerCase()} patterns identified in your PowerPoint analysis. Following your typical ${lessonStructure.join(' → ').toLowerCase()} progression, students will engage with authentic materials while participating in activities that reflect your consistent pedagogical approach. The content structure maintains your preferred ${interactionStyle} interaction style, ensuring students experience the familiar yet effective teaching patterns that characterize your educational methodology. Through this systematic approach to ${topic}, learners will develop both subject knowledge and language skills using the proven techniques identified in your corpus analysis.`,
    long: `${topic} is a comprehensive subject area that provides extensive opportunities for deep learning and skill development. This detailed lesson has been meticulously crafted to replicate your unique teaching methodology as identified through systematic analysis of your PowerPoint corpus. The lesson incorporates your specific ${activityTypes.join(', ').toLowerCase()} activity patterns and maintains the ${teachingStyle.toLowerCase()} approach that defines your educational philosophy. Students will progress through your established ${lessonStructure.join(' → ').toLowerCase()} framework, experiencing the same systematic content delivery and interaction patterns that characterize your most effective lessons. Each component has been tailored to match your specific preferences for timing, student engagement, and assessment approaches. The ${interactionStyle} activities build upon one another following your documented progression patterns, ensuring students receive instruction that maintains the quality and consistency of your established teaching methodology. Throughout this exploration of ${topic}, learners will encounter vocabulary development, reading comprehension, and discussion opportunities that not only advance their understanding of the subject matter but also reinforce language skills through the proven pedagogical techniques identified in your corpus. The lesson maintains your visual organization patterns and content hierarchy while introducing fresh perspectives on ${topic} that align with your educational objectives and student engagement strategies.`
  };

  const readingLength = settings?.readingLength || 'medium';
  
  // Generate activities based on ACTUAL analyzed activity types
  const lessonActivities = activityTypes.slice(0, settings?.activityIntensity || 3).map((type, index) => {
    const activityContent = {
      'Discussion Activity': `Lead a structured discussion about ${topic}, encouraging students to share perspectives and build on each other's ideas`,
      'Pair Work': `Students work in pairs to analyze aspects of ${topic}, then share findings with the class`,
      'Group Activity': `Small groups collaborate to explore different dimensions of ${topic} and present their conclusions`,
      'Reading Activity': `Guided reading of the ${topic} passage with focus on comprehension and analysis`,
      'Vocabulary Building': `Interactive vocabulary development related to ${topic} terminology and concepts`,
      'Q&A Session': `Structured question and answer session to assess understanding of ${topic}`,
      'Matching Exercise': `Students match concepts, terms, or ideas related to ${topic}`,
      'Gap Fill Activity': `Complete sentences or paragraphs about ${topic} to reinforce key concepts`,
      'Role Playing': `Students take on roles related to ${topic} to explore different perspectives`,
      'Writing Activity': `Structured writing task to express understanding of ${topic} concepts`,
      'Listening Activity': `Audio-based exercise to enhance comprehension of ${topic} content`,
      'Content Presentation': `Teacher-led presentation of key ${topic} concepts with student interaction`
    };

    return {
      type: type,
      content: activityContent[type] || `${type} focused on ${topic} concepts`,
      instructions: `Implement this ${type.toLowerCase()} following your established ${interactionStyle} methodology. Duration: ${Math.floor(duration / (settings?.activityIntensity || 3))} minutes. This activity maintains your documented teaching patterns.`
    };
  });
  
  return {
    title: `${topic}: ${duration}-Minute Lesson (${difficulty} level)`,
    introduction: `Welcome to today's ${duration}-minute exploration of ${topic}. Following your established ${teachingStyle.toLowerCase()} methodology, this lesson incorporates ${activityTypes.slice(0, 2).join(' and ').toLowerCase()} to ensure maximum engagement. We'll progress through your documented ${lessonStructure[0]?.toLowerCase()} approach.`,
    readingPassage: readingPassages[readingLength],
    vocabulary: Array.from({ length: vocabCount }, (_, i) => {
      const topicWords = [
        { word: "methodology", definition: "A systematic approach or set of methods", example: `The teaching methodology for ${topic} emphasizes interactive learning.` },
        { word: "systematic", definition: "Done according to a organized plan", example: `A systematic approach to ${topic} ensures comprehensive understanding.` },
        { word: "framework", definition: "A basic structure underlying a system", example: `This ${topic} framework guides our learning process.` },
        { word: "comprehensive", definition: "Complete and including everything", example: `Our comprehensive study of ${topic} covers all major aspects.` },
        { word: "authentic", definition: "Real and genuine", example: `Authentic materials help students connect ${topic} to real life.` },
        { word: "interaction", definition: "Communication between people", example: `Student interaction enhances ${topic} comprehension.` },
        { word: "progression", definition: "Forward movement through stages", example: `The lesson progression for ${topic} builds understanding gradually.` },
        { word: "analysis", definition: "Detailed examination", example: `Our analysis of ${topic} reveals important patterns.` }
      ];
      return {
        ...topicWords[i % topicWords.length],
        example: topicWords[i % topicWords.length].example.replace('${topic}', topic)
      };
    }),
    comprehensionQuestions: [
      `How does the ${topic} content relate to your previous learning experiences?`,
      `What are the key concepts we've explored about ${topic} in this lesson?`,
      `How do the teaching methods used here compare to your expectations about ${topic}?`,
      `What connections can you make between ${topic} and other subjects you've studied?`,
      `Which aspects of ${topic} do you find most challenging and why?`
    ],
    discussionQuestions: [
      `In your opinion, what is the most significant aspect of ${topic} we've discussed today?`,
      `How might your understanding of ${topic} be useful in your future academic or professional life?`,
      `What questions do you still have about ${topic} that you'd like to explore further?`,
      `How can we apply the principles we've learned about ${topic} in real-world situations?`,
      `What surprised you most about ${topic} during today's lesson?`
    ],
    activities: lessonActivities,
    conclusion: `Today's systematic exploration of ${topic} demonstrates how personalized lesson generation maintains your established teaching methodology while delivering fresh content. The ${duration}-minute structure, ${difficulty} difficulty level, and ${activityTypes.join(', ').toLowerCase()} activity sequence match your documented pedagogical patterns, ensuring consistency with your proven approach while engaging students with new perspectives on ${topic}.`
  };
};
