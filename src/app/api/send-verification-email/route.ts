// app/api/send-verification-email/route.ts

import { VerifyEmailTemplate } from "@/components/EmailTemplates/verify-email";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    // Check if RESEND_KEY is configured
    if (!process.env.RESEND_KEY) {
      console.error("RESEND_KEY is not configured in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Email service is not configured. Please contact support." 
        }),
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_KEY);
    const { firstName, email, verificationUrl } = await request.json();

    // Validate required fields
    if (!email || !firstName || !verificationUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields for email" }),
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Gimzo — Molecular Research Platform <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your email",
      react: VerifyEmailTemplate({ firstName, verificationUrl }),
    });

    if (error) {
      console.error("Resend API error:", error);
      return new Response(
        JSON.stringify({ 
          error: error.message || "Failed to send email via Resend API" 
        }),
        { status: 500 }
      );
    }

    console.log("Verification email sent successfully to:", email);
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred while sending email" 
      }),
      { status: 500 }
    );
  }
}
