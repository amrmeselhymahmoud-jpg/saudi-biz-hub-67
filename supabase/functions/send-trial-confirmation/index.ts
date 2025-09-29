import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrialConfirmationRequest {
  fullName: string;
  email: string;
  companyName: string;
  businessType: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, companyName, businessType }: TrialConfirmationRequest = await req.json();

    console.log("Sending trial confirmation email to:", email);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Qoyod <onboarding@resend.dev>",
        to: [email],
        subject: "مرحباً بك في قيود - تم تسجيل طلب التجربة المجانية بنجاح",
        html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; font-size: 28px; margin: 0;">مرحباً بك في قيود</h1>
              <div style="width: 60px; height: 3px; background-color: #3b82f6; margin: 15px auto;"></div>
            </div>
            
            <h2 style="color: #374151; font-size: 20px; margin-bottom: 20px;">عزيزي ${fullName}،</h2>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              شكراً لك على اهتمامك بنظام قيود للمحاسبة وإدارة الأعمال. لقد تم تسجيل طلب التجربة المجانية بنجاح!
            </p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">تفاصيل طلبك:</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="padding: 5px 0; color: #374151;"><strong>الاسم:</strong> ${fullName}</li>
                <li style="padding: 5px 0; color: #374151;"><strong>اسم الشركة:</strong> ${companyName}</li>
                <li style="padding: 5px 0; color: #374151;"><strong>نوع النشاط:</strong> ${businessType}</li>
                <li style="padding: 5px 0; color: #374151;"><strong>البريد الإلكتروني:</strong> ${email}</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              سيتواصل معك فريقنا المختص خلال 24 ساعة لترتيب حسابك التجريبي وتزويدك بجميع المعلومات المطلوبة للبدء.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #3b82f6; color: white; padding: 15px 30px; border-radius: 6px; display: inline-block;">
                <strong>مدة التجربة المجانية: 30 يوماً</strong>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              في هذه الأثناء، يمكنك زيارة موقعنا الإلكتروني للتعرف أكثر على مميزات النظام والخدمات المتاحة.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                مع تحيات فريق قيود
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
                نظام المحاسبة الأول في المنطقة
              </p>
            </div>
          </div>
        </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Error sending email:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "تم إرسال رسالة التأكيد بنجاح",
      emailId: emailData.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-trial-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);