import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

// Temporary in-memory user storage for demo purposes
const demoUsers = [
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

// Login endpoint
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      // Use demo users if Supabase is not configured
      console.log('Supabase not configured, using demo users');
      
      const user = demoUsers.find(u => u.email === email);
      
      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Check password (demo password is "password")
      const isValidPassword = password === "password" || await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json({ 
        user: userWithoutPassword,
        message: "Login successful (demo mode)" 
      });
    }

    // Use Supabase if configured
    const { supabase } = await import("../../../../lib/supabase");
    
    // Find user by email in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ 
      user: userWithoutPassword,
      message: "Login successful" 
    });

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
