export interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'released';
  category: string;
  priority: 'low' | 'medium' | 'high';
  targetRelease?: string;
  component?: () => Promise<{ default: React.ComponentType<any> }>;
}

export const features: Feature[] = [
  {
    id: 'ai-code-completion',
    title: 'AI Code Completion',
    description: 'Intelligent code suggestions as you type',
    status: 'released',
    category: 'Code',
    priority: 'high',
    targetRelease: 'v1.0.0',
  },

  // Add more features as needed
];

export function getFeaturesByStatus(status: Feature['status']) {
  return features.filter((feature) => feature.status === status);
}

export function getAllCategories() {
  return Array.from(new Set(features.map((feature) => feature.category)));
}

export function getFeatureById(id: string): Feature | undefined {
  return features.find((feature) => feature.id === id);
}
