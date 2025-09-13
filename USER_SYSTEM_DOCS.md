# Enhanced User Management System

## Overview

The user management system has been significantly expanded to include comprehensive nutritional goals, dietary preferences, meal planning data, and user profile information. This system now supports storing and managing detailed user information for personalized meal planning.

## Database Schema

### Users Table Structure

The `users` table now includes **35 columns** organized into several categories:

#### **Core User Data**
- `id` - Primary key (auto-increment)
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password (bcrypt)

#### **Personal Information**
- `age` - User's age
- `gender` - ENUM: 'male', 'female', 'other', 'prefer_not_to_say'
- `height_cm` - Height in centimeters
- `weight_kg` - Weight in kilograms
- `activity_level` - ENUM: 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'

#### **Nutritional Goals**
- `daily_calories_goal` - Daily calorie target
- `protein_goal_g` - Daily protein goal in grams
- `carbs_goal_g` - Daily carbohydrates goal in grams
- `fat_goal_g` - Daily fat goal in grams
- `fiber_goal_g` - Daily fiber goal in grams
- `sugar_goal_g` - Daily sugar goal in grams
- `sodium_goal_mg` - Daily sodium goal in milligrams

#### **Dietary Preferences & Restrictions**
- `dietary_restrictions` - JSON array (vegetarian, vegan, gluten-free, etc.)
- `allergies` - JSON array of food allergies
- `disliked_foods` - JSON array of disliked foods
- `preferred_cuisines` - JSON array of preferred cuisine types

#### **Meal Planning Preferences**
- `meals_per_day` - Number of meals per day (default: 3)
- `snacks_per_day` - Number of snacks per day (default: 2)
- `cooking_skill_level` - ENUM: 'beginner', 'intermediate', 'advanced'
- `cooking_time_preference` - ENUM: 'quick', 'moderate', 'extensive'
- `budget_preference` - ENUM: 'low', 'medium', 'high'

#### **Weekly Meal Plan Storage**
- `current_meal_plan` - JSON object storing current weekly meal plan
- `meal_plan_history` - JSON array of historical meal plans
- `favorite_recipes` - JSON array of favorite recipe IDs

#### **Timestamps & Settings**
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_login` - Last login timestamp
- `profile_completed` - Boolean indicating if profile is complete
- `notifications_enabled` - Boolean for notification preferences
- `timezone` - User's timezone (default: 'UTC')
- `language` - Preferred language (default: 'en')

## API Endpoints

### Authentication Endpoints

#### **POST /api/auth/register**
- **Purpose**: Register new users with extended profile data
- **Body**: `UserRegistrationData` interface
- **Response**: Complete user object (without password)

#### **POST /api/auth/login**
- **Purpose**: Authenticate users and return complete profile
- **Body**: `{ email: string, password: string }`
- **Response**: Complete user object (without password)

### Profile Management Endpoints

#### **GET /api/auth/profile**
- **Purpose**: Retrieve complete user profile
- **Headers**: `user-id: number`
- **Response**: Complete user object

#### **PUT /api/auth/profile**
- **Purpose**: Update user profile with partial data
- **Headers**: `user-id: number`
- **Body**: `UserProfileUpdate` interface (partial)
- **Response**: Updated user object

## TypeScript Interfaces

### **User Interface**
Complete user object with all available fields (password optional for security).

### **UserRegistrationData Interface**
Required fields for user registration:
- `name`, `email`, `password` (required)
- `age`, `gender`, `height_cm`, `weight_kg`, `activity_level` (optional)

### **UserProfileUpdate Interface**
All user fields as optional for partial updates.

## Components

### **UserProfile Component**
- **Location**: `app/components/UserProfile.tsx`
- **Purpose**: Complete user profile management interface
- **Features**:
  - Personal information editing
  - Nutritional goals management
  - Dietary preferences configuration
  - Meal planning preferences
  - BMI calculation
  - Calorie goal suggestions
  - Real-time validation

## Database Management Scripts

### **Migration Script**
- **File**: `scripts/migrate-users-table.ts`
- **Command**: `npm run migrate-users`
- **Purpose**: Add all new columns to existing users table

### **Database Check Script**
- **File**: `scripts/check-db.ts`
- **Command**: `npm run check-db`
- **Purpose**: View current table structure and user data

### **Add Users Script**
- **File**: `scripts/add-users.ts`
- **Command**: `npm run add-users`
- **Purpose**: Add sample users with extended data

## Features

### **Automatic Calculations**
- **BMI Calculation**: Based on height and weight
- **Calorie Goal Suggestions**: Using Mifflin-St Jeor equation with activity multipliers

### **Data Validation**
- **Type Safety**: Full TypeScript support
- **Input Validation**: Server-side validation for all fields
- **JSON Storage**: Efficient storage of arrays and complex data

### **Security**
- **Password Hashing**: bcrypt with 12 salt rounds
- **Data Sanitization**: Prepared statements prevent SQL injection
- **Sensitive Data Exclusion**: Passwords never returned in API responses

## Usage Examples

### **Register New User**
```typescript
const userData: UserRegistrationData = {
  name: "John Doe",
  email: "john@example.com",
  password: "securepassword",
  age: 30,
  gender: "male",
  height_cm: 175,
  weight_kg: 70,
  activity_level: "moderately_active"
};

const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
});
```

### **Update User Profile**
```typescript
const updateData: UserProfileUpdate = {
  daily_calories_goal: 2000,
  protein_goal_g: 150,
  dietary_restrictions: ["vegetarian"],
  cooking_skill_level: "intermediate"
};

const response = await fetch('/api/auth/profile', {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'user-id': userId.toString()
  },
  body: JSON.stringify(updateData)
});
```

## Migration Notes

- **Backward Compatibility**: Existing users retain all data
- **Default Values**: Sensible defaults provided for new fields
- **Profile Completion**: `profile_completed` flag helps track setup progress
- **JSON Fields**: Arrays stored as JSON for flexibility

## Next Steps

1. **Integrate UserProfile component** into main app
2. **Add meal plan storage** functionality
3. **Implement recipe favorites** system
4. **Create nutritional tracking** features
5. **Add profile completion** onboarding flow
