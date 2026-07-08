import { Resend } from "resend";
import { ApiError } from "./response.js";

export const reminderSubject = "Nhắc cập nhật ăn trưa hôm nay";
export const reminderBody = [
  "Bạn chưa cập nhật trạng thái ăn trưa hôm nay.",
  "Vào app để chọn: mang cơm, đi ăn ngoài, không ăn hoặc chưa quyết định.",
].join("\n");

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? "resend";
  if (provider !== "resend") {
    throw new ApiError("EMAIL_SEND_FAILED", `Unsupported email provider: ${provider}`);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey) {
    throw new ApiError("EMAIL_SEND_FAILED", "Missing RESEND_API_KEY");
  }
  if (!from) {
    throw new ApiError("EMAIL_SEND_FAILED", "Missing EMAIL_FROM");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, text: body });
  if (result.error) {
    throw new ApiError("EMAIL_SEND_FAILED", result.error.message);
  }
}
