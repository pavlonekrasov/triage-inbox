/*
 * Reviewed resource templates for wellbeing cases (brief 9.1). People wrote and reviewed them, so
 * they are not AI text: they carry no violet, and the composer offers them but never fills them in.
 */

export const WELLBEING_TEMPLATE = {
  id: "tpl-distress-us-v3",
  title: "Reaching out after distress (US)",
  reviewed: "Reviewed by the Wellbeing team on 2 May",
  body: (firstName: string) =>
    `Hi ${firstName}, thank you for telling us how you feel. I'm a person on the Nebula support team, and I'm here to listen. A reading can't decide what happens in your relationship or in your life. If you're thinking about hurting yourself, please call or text 988 to reach the Suicide & Crisis Lifeline, any time of day or night. Would you like to tell me a little more about what's happening?`,
};
