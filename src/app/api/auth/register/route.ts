import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/utils/hash";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { name, email, password } = await req.json();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    const hashed = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
