import { Resend } from "resend";

let customResendClient = null;

const getResend = () => {
    if (customResendClient) {
        return customResendClient;
    }

    if (!process.env.RESEND_API_KEY) {
        throw new Error("Email service is not configured: RESEND_API_KEY is missing");
    }

    return new Resend(process.env.RESEND_API_KEY);
};

const setResendClient = (client) => {
    customResendClient = client;
};

const sendEmail = async ({ to, subject, html, text }) => {
    const from = process.env.EMAIL_FROM || "Amazing Store <onboarding@resend.dev>";
    const resend = getResend();

    const { data, error } = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text
    });

    if (error) {
        console.error(`[EmailService] Resend API error: ${error.name || "Error"} - ${error.message || JSON.stringify(error)}`);
        throw new Error(error.message || "Unable to send email");
    }

    return data;
};

export { sendEmail, getResend, setResendClient };
