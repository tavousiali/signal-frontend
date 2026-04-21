"use server";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signInAction(formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");

  // Simple static validation
  if (username !== "ali" || password !== "123") {
    return { ok: false, message: "نام کاربری یا رمز عبور اشتباه است" };
  }

  // Create JWT payload
  const token = jwt.sign({ username: "ali" }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  // Set JWT into cookie
  // Use await here to get the actual cookies object
  const cookieStore = await cookies(); // cookies() returns a promise
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: true, // Make sure this is true in production, and false in development if needed
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // Expires in 7 days
  });

  redirect("/");

  return { ok: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/signin");
}
