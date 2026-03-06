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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to manage verifications
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Delete old OTPs for this user
    await supabase
      .from("email_verifications")
      .delete()
      .eq("user_id", user.id);

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        user_id: user.id,
        email: user.email,
        otp_code: otp,
      });

    if (insertError) throw insertError;

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
      to: user.email!,
      subject: "كود تأكيد حسابك - The Salma Padlet",
      content: `كود التأكيد: ${otp}`,
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #333; margin: 0;">تأكيد حسابك</h2>
          </div>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #555; margin: 0 0 16px;">استخدم الكود التالي لتأكيد حسابك:</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6366f1; background: white; border-radius: 8px; padding: 16px; display: inline-block; border: 2px solid #e5e7eb;">
              ${otp}
            </div>
            <p style="color: #999; font-size: 13px; margin: 16px 0 0;">الكود صالح لمدة 10 دقائق</p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">The Salma Padlet</p>
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
    console.error("OTP send error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
