import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}
