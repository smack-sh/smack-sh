export interface Feature {
  id: string;
  name: string;
  description: string;
  viewed: boolean;
  releaseDate: string;
}

// Internal mutable mock data for feature flags
const mockFeatures: Feature[] = [
  {
    id: 'feature-1',
    name: 'Dark Mode',
    description: 'Enable dark mode for better night viewing',
    viewed: true,
    releaseDate: '2024-03-15',
  },
  {
    id: 'feature-2',
    name: 'Tab Management',
    description: 'Customize your tab layout',
    viewed: false,
    releaseDate: '2024-03-20',
  },
];

export const getFeatureFlags = async (): Promise<Feature[]> => {
  /*
   * TODO: Implement actual feature flags logic
   * This is a mock implementation
   */
  /*
   * Return a shallow copy of the internal mock features and their objects
   * to prevent external direct mutation of the internal state.
   */
  return mockFeatures.map((feature) => ({ ...feature }));
};

export const markFeatureViewed = async (featureId: string): Promise<void> => {
  /* TODO: Implement actual feature viewed logic */
  const featureIndex = mockFeatures.findIndex((f) => f.id === featureId);

  if (featureIndex !== -1) {
    /*
     * Update the 'viewed' status by creating a new object to maintain
     * a sense of immutability for objects within the array,
     * reflecting the change in the shared mock state.
     */
    mockFeatures[featureIndex] = { ...mockFeatures[featureIndex], viewed: true };
    console.log(`Marked feature ${featureId} as viewed`);
  } else {
    console.warn(`Feature with id "${featureId}" not found for marking as viewed.`);
  }
};
