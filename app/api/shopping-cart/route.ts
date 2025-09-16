import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Step 1: Get the user's meal plan from the database
    console.log(`🔍 Fetching meal plan for user ${user_id}...`);
    
    const { data: mealPlanData, error: mealError } = await supabase
      .from('meal_table')
      .select('weekly_plan')
      .eq('id', user_id)
      .single();

    if (mealError || !mealPlanData?.weekly_plan) {
      return NextResponse.json(
        { error: 'No meal plan found for this user' },
        { status: 404 }
      );
    }

    const weeklyPlan = mealPlanData.weekly_plan;
    console.log('✅ Found meal plan:', Object.keys(weeklyPlan));

    // Step 2: Create a temporary file with the meal plan data
    const tempMealPlanFile = path.join(process.cwd(), 'temp_meal_plan.json');
    fs.writeFileSync(tempMealPlanFile, JSON.stringify(weeklyPlan, null, 2));

    // Step 3: Run the smart shopping cart Python script
    console.log('🛒 Generating smart shopping list...');
    
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(process.cwd(), 'smart_shopping_cart', 'generate_shopping_list.py');
      
      const pythonProcess = spawn('python3', [
        pythonScript,
        '--meal-plan', tempMealPlanFile,
        '--user-id', user_id,
        '--output-format', 'json'
      ], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Python output:', data.toString());
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Python error:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempMealPlanFile);
        } catch (err) {
          console.warn('Could not delete temp meal plan file:', err);
        }

        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          reject(NextResponse.json(
            { error: 'Shopping list generation failed', details: errorOutput },
            { status: 500 }
          ));
          return;
        }

        try {
          // Look for the generated shopping list JSON file
          const files = fs.readdirSync(process.cwd());
          const jsonFiles = files.filter(file => 
            file.startsWith('shopping_list_') && file.endsWith('.json')
          );
          
          if (jsonFiles.length === 0) {
            reject(NextResponse.json(
              { error: 'No shopping list file generated' },
              { status: 500 }
            ));
            return;
          }

          // Get the most recent file
          const latestFile = jsonFiles.sort().pop();
          const shoppingListPath = path.join(process.cwd(), latestFile!);
          
          // Read the generated shopping list
          const shoppingListData = JSON.parse(fs.readFileSync(shoppingListPath, 'utf8'));
          
          // Clean up the generated file
          try {
            fs.unlinkSync(shoppingListPath);
          } catch (err) {
            console.warn('Could not delete generated shopping list file:', err);
          }

          resolve(NextResponse.json({
            success: true,
            shoppingList: shoppingListData,
            message: 'Smart shopping list generated successfully'
          }));

        } catch (parseError) {
          console.error('Error parsing shopping list:', parseError);
          reject(NextResponse.json(
            { error: 'Failed to parse shopping list data' },
            { status: 500 }
          ));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(NextResponse.json(
          { error: 'Failed to start shopping list generation process' },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    console.error('Shopping cart API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing shopping lists
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get recent shopping lists for the user
    const { data: shoppingLists, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch shopping lists' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shoppingLists: shoppingLists || []
    });

  } catch (error) {
    console.error('Shopping cart GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
