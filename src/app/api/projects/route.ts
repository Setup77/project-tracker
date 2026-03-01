import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Establish the connection
    await connectDB();

    // 2. Use Mongoose model (not prisma)
    const users = await User.find({});

    return NextResponse.json(users);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" }, 
      { status: 500 }
    );
  }
}
