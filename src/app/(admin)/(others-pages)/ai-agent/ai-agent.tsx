"use client";
import ChatMessage, { ChatMessageProp } from "@/components/chat/chat-message";
import TextArea from "@/components/form/input/TextArea";
import React, { useEffect, useState } from "react";
import {
  TRealLegalResponseType,
  TRealLegalType,
  TRealLegalRatioType,
} from "./TRealLegalType";
const AIAgent = () => {
  const userSelectedSymbol = "کگل";

  const getSymbolId = (symbol: string) => {
    //TODO
    return "35700344742885862";
  };

  const readRealLegalDataHistory = async (symbolId: string) => {
    const url = `https://cdn.tsetmc.com/api/ClientType/GetClientTypeHistory/${symbolId}`;
    const data = await fetch(url);
    const result = await data.json();
    return result as TRealLegalResponseType;
  };

  const getLastNDaysData = (
    data: TRealLegalResponseType,
    lastNDays: number,
  ) => {
    const result = data.clientType.slice(0, lastNDays);

    //TODO شاید لازم باشه که اگر چند وقتی این وسط سهمی بسته بود، آیا لازم است که روزهای قبل از آن حذف شود یا نه
    return result;
  };

  const calculateRealLegalData = (
    data: TRealLegalType[],
  ): TRealLegalRatioType[] => {
    return data.map((item) => {
      // 1. ورود پول حقیقی
      const realMoneyInflow = item.buy_I_Value - item.sell_I_Value;

      // 2. سرانه خرید حقیقی
      const avgRealBuyAmount =
        item.buy_I_Count > 0 ? item.buy_I_Volume / item.buy_I_Count : 0;

      // 3. سرانه فروش حقیقی
      const avgRealSellAmount =
        item.sell_I_Count > 0 ? item.sell_I_Volume / item.sell_I_Count : 0;

      // 4. قدرت خرید به فروش حقیقی
      const realBuySellRatio =
        avgRealSellAmount > 0 ? avgRealBuyAmount / avgRealSellAmount : 0;

      // برگرداندن آیتم با اضافه شدن فیلدهای جدید
      return {
        realMoneyInflow,
        avgRealBuyAmount,
        avgRealSellAmount,
        realBuySellRatio,
      };
    });
  };

  const getOllamaProcess = async (
    inputData: TRealLegalRatioType[],
  ): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-oss:20b",
        messages: [{ role: "user", content: "سلام" }],
        stream: false,
      }),
    });

    if (!res.ok) {
      console.error("API error", res.statusText);
      return "";
    }

    const assistantResponse = await res.json();
    const assistantText = assistantResponse.message.content;
    return assistantText;
  };

  //Run Agents
  useEffect(() => {
    async function load() {
      const symbolId = getSymbolId(userSelectedSymbol);
      const data = await readRealLegalDataHistory(symbolId);
      const lastNDaysData = getLastNDaysData(data, 5);
      const calculatedData = calculateRealLegalData(lastNDaysData);
      const ollamaProcess = await getOllamaProcess(calculatedData);
      console.log("🚀 ~ load ~ ollamaProcess:", ollamaProcess);
    }

    load();
  }, []);

  return <>AI Agent</>;
};

export default AIAgent;
