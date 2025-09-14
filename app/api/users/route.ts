import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// GET handler already exists
export async function GET() {
  try {
    const { data: rows, error } = await supabase.from('users').select('*');
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }
}

// POST handler to add a new user
export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ name, email })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to insert user" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to add user" },
      { status: 500 }
    );
  }
}
