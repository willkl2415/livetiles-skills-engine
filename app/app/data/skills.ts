export type Skill = {
  role: string;        // e.g., "Manager"
  title: string;       // Card headline
  description: string; // Card details
};

export const skills: Skill[] = [
  {
    role: "Manager",
    title: "📊 Decision Making",
    description: "Make faster, better decisions with AI-powered insights.",
  },
  {
    role: "Manager",
    title: "🤝 Team Coaching",
    description: "Deliver instant guidance and keep teams on track.",
  },
  {
    role: "Developer",
    title: "💻 Debug Smarter",
    description: "Use AI micro-tips to spot errors faster than ever.",
  },
  {
    role: "Developer",
    title: "⚡ Code Efficiency",
    description: "Write clean, scalable code with instant AI suggestions.",
  },
];
