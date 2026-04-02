import { Metadata } from "next";
import AIAgent from "./ai-agent";

export const metadata: Metadata = {
  title: "AI Agent",
  description: "AI Agent",
};

export default function Page() {
  return <AIAgent />;
}
