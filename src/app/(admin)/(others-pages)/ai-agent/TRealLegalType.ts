export type TRealLegalRatioType = {
  realMoneyInflow: number; //ورود پول حقیقی
  avgRealBuyAmount: number; //سرانه خرید حقیقی
  avgRealSellAmount: number; //سرانه فروش حقیقی
  realBuySellRatio: number; //قدرت خرید به فروش حقیقی
};

export type TRealLegalType = {
  recDate: number; //تاریخ میلادی
  insCode: string; //کد سهام
  buy_I_Volume: number; //حجم خرید حقیقی
  buy_N_Volume: number; //حجم خرید حقوقی
  buy_I_Value: number; //ارزش خرید حقیقی
  buy_N_Value: number; //ارزش خرید حقوقی
  buy_I_Count: number; // تعداد خرید حقیقی
  buy_N_Count: number; //تعداد خرید حقوقی
  sell_I_Volume: number; //حجم فروش حقیقی
  sell_N_Volume: number; //حجم فروش حقوقی
  sell_I_Value: number; //ارزش فروش حقیقی
  sell_N_Value: number; //ارزش فروش حقوقی
  sell_I_Count: number; //تعداد فروش حقیقی
  sell_N_Count: number; //تعداد فروش حقوقی
};

export type TRealLegalResponseType = {
  clientType: TRealLegalType[];
};
