import { Metadata } from "next";
import Chat from "./chat";

export const metadata: Metadata = {
  title: "چت",
  description: "چت",
};

export default function Page() {
  return <Chat />;
}
