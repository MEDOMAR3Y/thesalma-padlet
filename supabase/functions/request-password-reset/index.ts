import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists
    const { data: users } = await supabase.auth.admin.listUsers();
    const userExists = users?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    // Always return success to prevent email enumeration
    if (!userExists) {
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete old tokens for this email
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("email", email.toLowerCase());

    // Create new token
    const { data: tokenData, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert({ email: email.toLowerCase() })
      .select("token")
      .single();

    if (tokenError) throw tokenError;

    const resetLink = `${redirectUrl || "https://id-preview--877941dc-fad1-4a79-99fc-bda122535cf6.lovable.app"}/reset-password?token=${tokenData.token}`;

    // Send via Gmail SMTP
    const gmailUser = Deno.env.get("GMAIL_USER")!;
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD")!;

    const client = new SmtpClient();
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: gmailUser,
      password: gmailPass,
    });

    await client.send({
      from: gmailUser,
      to: email,
      subject: "إعادة تعيين كلمة السر - The Salma Padlet",
      content: `رابط إعادة التعيين: ${resetLink}`,
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #333; margin: 0;">إعادة تعيين كلمة السر</h2>
          </div>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #555; margin: 0 0 16px;">اضغط على الزر أدناه لإعادة تعيين كلمة السر:</p>
            <a href="${resetLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              إعادة تعيين كلمة السر
            </a>
            <p style="color: #999; font-size: 13px; margin: 16px 0 0;">الرابط صالح لمدة ساعة واحدة</p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
            لو ماطلبتش إعادة تعيين كلمة السر، تجاهل الرسالة دي.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">The Salma Padlet</p>
        </div>
      `,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Password reset error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
