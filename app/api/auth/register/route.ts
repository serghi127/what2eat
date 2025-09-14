import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { UserRegistrationData } from '../../../types';

// Temporary in-memory user storage for demo purposes
let demoUsers = [
  {
    id: "1",
    email: "demo@example.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    name: "Demo User"
  },
  {
    id: "2", 
    email: "john@example.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    name: "John Doe"
  }
];

// Registration endpoint
export async function POST(req: NextRequest) {
  try {
    const userData: UserRegistrationData = await req.json();
    const { name, email, password } = userData;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      // Use demo users if Supabase is not configured
      console.log('Supabase not configured, using demo registration');
      
      // Check if user already exists
      const existingUser = demoUsers.find(u => u.email === email);
      
      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = {
        id: (demoUsers.length + 1).toString(),
        name,
        email,
        password: hashedPassword
      };

      demoUsers.push(newUser);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = newUser;

      return NextResponse.json({ 
        user: userWithoutPassword,
        message: "Registration successful (demo mode)" 
      });
    }

    // Use Supabase if configured
    const { supabase } = await import("../../../../lib/supabase");
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user into Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 }
      );
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ 
      user: userWithoutPassword,
      message: "Registration successful" 
    });

  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
