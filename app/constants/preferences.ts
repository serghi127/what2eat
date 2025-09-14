export const PREFERENCE_MAPPINGS = {
  dietary_restrictions: {
    'vegetarian': ['vegetarian', 'veggie'],
    'vegan': ['vegan'],
    'gluten-free': ['gluten-free', 'gf'],
    'dairy-free': ['dairy-free'],
    'low-carb': ['low-carb', 'keto']
  },
  meal_type: {
    'breakfast': ['breakfast', 'brunch'],
    'lunch': ['lunch'],
    'dinner': ['dinner'],
    'snack': ['snack', 'appetizer'],
    'dessert': ['dessert', 'sweet']
  },
  cooking_time: {
    'quick': ['quick', 'weeknight', 'easy'],
    'slow': ['slow', 'braiser', 'project']
  },
  course: {
    'pasta': ['pasta'],
    'salad': ['salad'],
    'soup': ['soup'],
    'bread': ['bread'],
    'pizza': ['pizza']
  },
  cuisine: {
    'italian': ['italian'],
    'french': ['french'],
    'asian': ['chinese', 'japanese', 'thai', 'vietnamese'],
    'mexican': ['tex-mex', 'mexican'],
    'indian': ['indian'],
    'middle eastern': ['middle eastern', 'israeli']
  },
  ingredients: {
    'chicken': ['chicken'],
    'beef': ['beef'],
    'pork': ['pork'],
    'seafood': ['seafood'],
    'vegetables': ['vegetable'],
    'cheese': ['cheese'],
    'chocolate': ['chocolate']
  }
} as const;

// Helper function to get all preference options for a category
export const getPreferenceOptions = (category: keyof typeof PREFERENCE_MAPPINGS): string[] => {
  return Object.keys(PREFERENCE_MAPPINGS[category]);
};

// Default preferences for new users
export const DEFAULT_PREFERENCES = {
  dietaryRestrictions: [],
  mealType: [],
  cookingTime: [],
  course: [],
  cuisine: [],
  ingredients: [],
  dislikes: '',
  caloriesGoal: 2000,
  proteinGoal: 100,
  budget: 50,
  timePerDay: 30,
  servings: 1,
  tools: [],
  specificCravings: '',
  age: undefined,
  gender: undefined,
  height_cm: undefined,
  weight_kg: undefined,
  activity_level: undefined
};
