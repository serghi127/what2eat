import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      dietary_restrictions = [],
      disliked_foods = [],
      preferred_ingredients = [],
      daily_calories = 2000,
      daily_protein = 150,
      servings_per_meal = 1,
      kitchen_tools = [],
      specific_cravings = []
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create a temporary preferences file for the Python script
    const preferences = {
      dietary_restrictions,
      disliked_foods,
      preferred_ingredients,
      daily_calories,
      daily_protein,
      servings_per_meal,
      kitchen_tools,
      specific_cravings
    };

    const tempPrefsFile = path.join(process.cwd(), 'temp_preferences.json');
    fs.writeFileSync(tempPrefsFile, JSON.stringify(preferences, null, 2));

    // Run the Python meal planner script with database saving
    const pythonScript = path.join(process.cwd(), 'weekly_meal_planner.py');
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        pythonScript, 
        '--preferences', tempPrefsFile,
        '--user-id', user_id,
        '--save-to-db',
        '--output-format', 'json'
      ], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempPrefsFile);
        } catch (err) {
          console.warn('Could not delete temp preferences file:', err);
        }

        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          reject(NextResponse.json(
            { error: 'Meal planning failed', details: errorOutput },
            { status: 500 }
          ));
          return;
        }

        try {
          // Look for the generated JSON file
          const files = fs.readdirSync(process.cwd());
          const jsonFiles = files.filter(file => 
            file.startsWith('weekly_meal_ids_') && file.endsWith('.json')
          );
          
          if (jsonFiles.length === 0) {
            reject(NextResponse.json(
              { error: 'No meal plan file generated' },
              { status: 500 }
            ));
            return;
          }

          // Get the most recent file
          const latestFile = jsonFiles.sort().pop();
          const mealPlanPath = path.join(process.cwd(), latestFile!);
          
          // Read the generated meal plan
          const mealPlanData = JSON.parse(fs.readFileSync(mealPlanPath, 'utf8'));
          
          // Clean up the generated file
          try {
            fs.unlinkSync(mealPlanPath);
          } catch (err) {
            console.warn('Could not delete generated meal plan file:', err);
          }

          resolve(NextResponse.json({
            success: true,
            mealPlan: mealPlanData,
            preferences: preferences,
            message: 'Meal plan generated and saved to database successfully'
          }));

        } catch (parseError) {
          console.error('Error parsing meal plan:', parseError);
          reject(NextResponse.json(
            { error: 'Failed to parse meal plan data' },
            { status: 500 }
          ));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(NextResponse.json(
          { error: 'Failed to start meal planning process' },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    console.error('Meal plan API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
