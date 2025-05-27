
// Simple activity type detection based on slide titles
export const extractActivityTypeFromTitle = (slideTitle: string): string => {
  // Clean up the title text
  const cleanTitle = slideTitle.trim();
  
  // If we have a meaningful title, use it as the activity type
  if (cleanTitle && cleanTitle.length > 0) {
    return cleanTitle;
  }
  
  // Fallback for slides without clear titles
  return 'Content Slide';
};

// Extract activity types from slide content (no keyword mapping)
export const extractActivityTypesFromSlide = (slideTitle: string, allText: string): string[] => {
  console.log(`Extracting activity type from title: "${slideTitle}"`);
  
  // Use the slide title directly as the activity type
  const activityType = extractActivityTypeFromTitle(slideTitle);
  
  console.log(`Determined activity type: "${activityType}"`);
  
  return [activityType];
};
