import { supabase } from '@/integrations/supabase/client';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: params,
  });

  if (error) throw error;
  return data;
}

export function buildBoardInviteEmail(boardTitle: string, inviterName: string, boardLink: string) {
  return {
    subject: `${inviterName} دعاك للمشاركة في "${boardTitle}"`,
    html: `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #333; margin: 0;">دعوة للمشاركة في لوحة</h2>
        </div>
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #555;">
            <strong>${inviterName}</strong> دعاك للمشاركة في اللوحة:
          </p>
          <h3 style="margin: 0 0 16px; color: #333;">"${boardTitle}"</h3>
          <a href="${boardLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            فتح اللوحة
          </a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          The Salma Padlet
        </p>
      </div>
    `,
  };
}
