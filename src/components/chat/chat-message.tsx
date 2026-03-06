import Image from "next/image";

export type ChatMessageProp = {
  date: Date;
  type: "ai" | "user";
  message: string;
};

const ChatMessage = ({ type, message, date }: ChatMessageProp) => {
  return (
    <div
      className={`${type === "ai" ? "mr-[150px]" : "ml-[150px]"} m-2 p-3 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6`}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div
          className={`flex flex-col w-full gap-6 ${type === "ai" ? "flex-row-reverse" : "flex-row"}`}
        >
          <div className="flex h-[68px] w-[68px]  items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {type === "ai" ? "AI" : "Ali"}
          </div>
          <div className="order-3 xl:order-2">{message}</div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
