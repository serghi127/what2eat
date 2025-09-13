import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";

// GET handler already exists
export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM users");
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

    const [result] = await db.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    );

    // For MySQL, the insert result usually has an insertId
    const insertedId = (result as any).insertId;

    return NextResponse.json({ id: insertedId, name, email });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to add user" },
      { status: 500 }
    );
  }
}
