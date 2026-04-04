"use client";
import React, { useEffect, useState } from "react";
import {
  TRealLegalResponseType,
  TRealLegalType,
  TRealLegalRatioType,
} from "./TRealLegalType";
import { useSearchParams } from "next/navigation";

const AIAgent = () => {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol") || "";

  const milaliToShamsiConvertor = (miladiDate: number) => {
    const date = miladiDate.toString();
    const year = parseInt(date.slice(0, 4), 10);
    const month = parseInt(date.slice(4, 6), 10) - 1;

    const day = parseInt(date.slice(6, 8), 10);
    const d = new Date(year, month, day);
    const persian = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(d);

    return persian;
  };

  const getSymbolId = async (symbol: string) => {
    const res = await fetch(
      `http://localhost:3000/api/stocks?symbol=${symbol}`,
      {
        cache: "no-store",
      },
    );
    const result = await res.json();
    return result.rows[0].id;
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
    maxDate?: number, //اگر فرستاده شود، تمام اطلاعات قبل از این تاریخ در محاسبات در نظر گرفته می‌شود
  ) => {
    let realLegalArray = data.clientType;
    if (maxDate) {
      realLegalArray = realLegalArray.filter((x) => x.recDate <= maxDate);
    }
    realLegalArray = realLegalArray.slice(0, lastNDays);

    //TODO شاید لازم باشه که اگر چند وقتی این وسط سهمی بسته بود، آیا لازم است که روزهای قبل از آن حذف شود یا نه
    realLegalArray.map(
      (x) => (x.shamsiDate = milaliToShamsiConvertor(x.recDate)),
    );
    return realLegalArray;
  };

  const processedRealLegalData = (
    data: TRealLegalType[],
  ): TRealLegalRatioType[] => {
    return data.map((item) => {
      // 1. ورود پول حقیقی
      const realMoneyInflow = item.buy_I_Value - item.sell_I_Value;

      // 2. سرانه خرید حقیقی
      const avgRealBuyAmount =
        item.buy_I_Count > 0 ? item.buy_I_Value / item.buy_I_Count : 0;
      // 3. سرانه فروش حقیقی
      const avgRealSellAmount =
        item.sell_I_Count > 0 ? item.sell_I_Value / item.sell_I_Count : 0;
      // 4. قدرت خرید به فروش حقیقی
      const realBuySellRatio =
        avgRealSellAmount > 0 ? avgRealBuyAmount / avgRealSellAmount : 0;

      return {
        shamsiDate: item.shamsiDate,
        realMoneyInflow: realMoneyInflow,
        avgRealBuyAmount: Math.round(avgRealBuyAmount * 100) / 100,
        avgRealSellAmount: Math.round(avgRealSellAmount * 100) / 100,
        realBuySellRatio: Math.round(realBuySellRatio * 100) / 100,
      };
    });
  };

  const getOllamaProcess = async (
    lastNDaysData: TRealLegalType[],
    processedData: TRealLegalRatioType[],
  ): Promise<string> => {
    console.log(lastNDaysData, processedData);

    const systemMessage = `تو یه متخصص حرفه ای در زمینه پیشنهاد سهم در معاملات بازار بورس ایران هستی
    وظیفه تو اینه که سهم رو بررسی کنی و پیشنهاد بدی که این خرید این سهم خوبه یا نه.
    پاسخ هات باید دقیق و کامل باشن
    
    این ها هم چند نمونه از اطلاعات ورودی و خروجی هست.
    <examples>
      <example-1>
        <topic>
        این اطلاعات 5 روز اخیر معاملات حقیقی و حقوقی سهم «زفکا» 
    توی بازار بورس ایران هست.
    
    [{"recDate":20251229,"insCode":"5427792638736934","buy_I_Volume":39640391,"buy_N_Volume":1710000,"buy_I_Value":202112761106,"buy_N_Value":8736267408,"buy_N_Count":5,"sell_I_Volume":40550761,"buy_I_Count":475,"sell_N_Volume":799630,"sell_I_Value":206811102929,"sell_N_Value":4037925585,"sell_N_Count":5,"sell_I_Count":455,"shamsiDate":"۱۴۰۴/۱۰/۸"},{"recDate":20251228,"insCode":"5427792638736934","buy_I_Volume":20753826,"buy_N_Volume":22704690,"buy_I_Value":105358084240,"buy_N_Value":115714658517,"buy_N_Count":3,"sell_I_Volume":25477623,"buy_I_Count":227,"sell_N_Volume":17980893,"sell_I_Value":129424710236,"sell_N_Value":91648032521,"sell_N_Count":5,"sell_I_Count":263,"shamsiDate":"۱۴۰۴/۱۰/۷"},{"recDate":20251227,"insCode":"5427792638736934","buy_I_Volume":61585025,"buy_N_Volume":29332000,"buy_I_Value":304707148330,"buy_N_Value":145219149381,"buy_N_Count":9,"sell_I_Volume":35254791,"buy_I_Count":665,"sell_N_Volume":55662234,"sell_I_Value":174342723943,"sell_N_Value":275583573768,"sell_N_Count":5,"sell_I_Count":316,"shamsiDate":"۱۴۰۴/۱۰/۶"},{"recDate":20251224,"insCode":"5427792638736934","buy_I_Volume":45440388,"buy_N_Volume":24400000,"buy_I_Value":218389030708,"buy_N_Value":117335652738,"buy_N_Count":7,"sell_I_Volume":20619702,"buy_I_Count":424,"sell_N_Volume":49220686,"sell_I_Value":99143504122,"sell_N_Value":236581179324,"sell_N_Count":10,"sell_I_Count":195,"shamsiDate":"۱۴۰۴/۱۰/۳"},{"recDate":20251223,"insCode":"5427792638736934","buy_I_Volume":32594720,"buy_N_Volume":3540807,"buy_I_Value":152314979251,"buy_N_Value":16487899178,"buy_N_Count":5,"sell_I_Volume":15296710,"buy_I_Count":432,"sell_N_Volume":20838817,"sell_I_Value":71359413539,"sell_N_Value":97443464890,"sell_N_Count":10,"sell_I_Count":176,"shamsiDate":"۱۴۰۴/۱۰/۲"}]

    در زیر هم همین اطلاعات رو پردازش کردم:
    [{"shamsiDate":"۱۴۰۴/۱۰/۸","realMoneyInflow":-469834182300,"avgRealBuyAmount":83453.45,"avgRealSellAmount":89122.55,"realBuySellRatio":0.94},{"shamsiDate":"۱۴۰۴/۱۰/۷","realMoneyInflow":-2406662599600,"avgRealBuyAmount":91426.55,"avgRealSellAmount":96873.09,"realBuySellRatio":0.94},{"shamsiDate":"۱۴۰۴/۱۰/۶","realMoneyInflow":13036442438700,"avgRealBuyAmount":92609.06,"avgRealSellAmount":111565.79,"realBuySellRatio":0.83},{"shamsiDate":"۱۴۰۴/۱۰/۳","realMoneyInflow":11924552658600,"avgRealBuyAmount":107170.73,"avgRealSellAmount":105742.06,"realBuySellRatio":1.01},{"shamsiDate":"۱۴۰۴/۱۰/۲","realMoneyInflow":8095556571200,"avgRealBuyAmount":75450.74,"avgRealSellAmount":86913.13,"realBuySellRatio":0.87}]
    realMoneyInflow --> ورود پول حقیقی
    avgRealBuyAmount --> سرانه خرید حقیقی
    avgRealSellAmount --> سرانه فروش حقیقی
    realBuySellRatio --> قدرت خرید به فروش حقیقی

    من این محاسبات رو برای تصمیم گیری راحت تر برای تو انجام داده ام. هر جایی که لازمه خودت محاسبات کامل و بیشتر رو انجام بده و بگو که چی کار کردی.

    این سهم رو بر اساس استراتژی ایچیموکو پیدا کردم. سیگنال ایچیموکو رو به این صورت گرفته ام که:
    ۱- قیمت بالاتر از ابر کومو باشه
    ۲- تنکنسن، کیجونسن رو به سمت بالا قطع کرده باشه
    ۳- چیکو هم بالاتر از قیمت پایانی باشه
    ۴- و همچنین چیکو بالاتر از ابر کومو بشاه 
    پس یه سیگنال تکنیکال قوی هست.

    حالا من ازت میخوام که سهم رو بر اساس معاملات حقیقی و حقوقی و تاریخ shamsiDate موجود در داده ها برام تحلیل کنی.
    این قسمت خیلی مهمه. باید دقت کنی. ارقام بر اساس ریال هستن. 
    هر جایی که میخوای بهم توضیح بدی که چقدر پول وارد یا خارج یا ... شده، بر اساس میلیون تومان یا میلیارد تومان یا ... بگو.
    مثلا 8095556571200 رو بگو حدود ۸۰۰ میلیارد تومان (دقت کن که این عدد به ریال بوده و من توی مثال یه صفر رو حذف کردم و به تومان گفته ام)
    یا عدد ۷۵۴۵۰  رو باید بگی حدود ۷ میلیون و نیم
     
    از علائم < یا < یا چیزهایی شبیه به این استفاده نکن و کامل توضیح بده که بزرگتر یا کوچکتر بوده.
    روزها رو از اول به آخر بررسی کن تا ببینم روند به چه صورت بوده
    
        </topic>
        <generated-result>
        در ادامه یک تحلیل کاملاً مرحله‌به‌مرحله و **روزشمار** از جریان پول حقیقی و رفتار سرمایه‌گذاران در سهم «زفکا» بر اساس داده‌هایی که دادی ارائه می‌کنم.  
اعداد را هم همانطور که خواستی به **تومان** و در قالب **میلیون/میلیارد تومان** تفسیر می‌کنم.

---

## روند ۵ روز اخیر (از قدیمی‌ترین تا جدیدترین)

---

# روز اول  
### تاریخ ۱۴۰۴/۱۰/۲  
### **ورود پول حقیقی: حدود ۸۱۰ میلیارد تومان ورود**
این یکی از **بزرگ‌ترین ورودهای پول حقیقی** در داده‌های توست.  
این میزان ورود یعنی حقیقی‌ها **چند برابر حقوقی‌ها خریدار بوده‌اند** و با قدرت بالایی سهم را جمع کرده‌اند.

### سرانه خرید حقیقی: حدود ۷ میلیون و نیم تومان  
### سرانه فروش حقیقی: حدود ۸ میلیون و نیم تومان  
سرانه فروش کمی بیشتر بوده، ولی ورود پول بسیار زیاد نشان می‌دهد که تعداد زیادی حقیقی خریدار بوده‌اند و سمت سفارش‌های خرید بسیار قوی‌تر بوده است.

### نسبت قدرت خرید به فروش حقیقی: حدود ۰.۸۷  
قدرت خرید حقیقی کمتر از قدرت فروش بوده، اما چون حجم ورود پول بسیار زیاد بوده، **این ضعف سرانه را جبران کرده است**.

**جمع‌بندی روز:**  
در مجموع یک روز **کاملاً مثبت** از نظر ورود پول حقیقی.  
شروع روند با یک ورود سنگین همراه بوده که نشان‌دهنده آغاز موج تقاضا است.

---

# روز دوم  
### تاریخ ۱۴۰۴/۱۰/۳  
### **ورود پول حقیقی: حدود ۱۲۰۰۰ میلیارد تومان ورود**
این **ورود بسیار سنگین‌تر** از تمام روزهاست.  
ورودی حدود دوازده هزار میلیارد تومان به زبان ساده یعنی موجی قوی از تقاضای حقیقی وارد سهم شده است.

### سرانه خرید حقیقی: حدود ۱۰۷ میلیون تومان  
### سرانه فروش حقیقی: حدود ۱۰۵ میلیون تومان  
این‌بار سرانه خرید حقیقی از سرانه فروش کمی بیشتر شده که نشانه ورود خریداران با دست قوی‌تر است.

### نسبت قدرت خرید به فروش حقیقی: حدود ۱.۰۱  
تقریباً برابر، ولی کمی کفه ترازو به سمت خرید است.

**جمع‌بندی روز:**  
این روز بسیار قدرتمندتر از روز قبل بوده و نشان می‌دهد **تقاضا روز دوم قوی‌تر از روز اول بوده**.  
یک ورود پول فوق‌العاده سنگین داریم که معمولاً در سهام کوچک‌تر می‌تواند نشان از ورود بازیگر یا شروع روند صعودی باشد.

---

# روز سوم  
### تاریخ ۱۴۰۴/۱۰/۶  
### **ورود پول حقیقی: حدود ۱۳ هزار میلیارد تومان ورود**
ورودی دوباره بسیار قوی و حتی کمی بیشتر از روز قبل.

این ادامه‌دار شدن ورودهای سنگین، نشانه یک **روند با ثبات صعودی** از نظر رفتار حقیقی‌هاست.

### سرانه خرید حقیقی: حدود ۹۲ میلیون تومان  
### سرانه فروش حقیقی: حدود ۱۱۱ میلیون تومان  
سرانه خرید کمتر بوده، اما حجم خرید حقیقی همچنان بسیار بالاست.

### نسبت قدرت خرید به فروش حقیقی: حدود ۰.۸۳  
قدرت فروش حقیقی بیشتر بوده، ولی همانطور که قبل هم گفتیم **ورودی پول حجم را جبران کرده است**.

**جمع‌بندی روز:**  
روز سوم همچنان با ورود پول بسیار قوی بوده.  
در این نقطه ما سه روز پشت‌سرهم **ورود بسیار سنگین** داریم که الگوی خوبی برای ادامه روند صعودی است.

---

# روز چهارم  
### تاریخ ۱۴۰۴/۱۰/۷  
### **خروج پول حقیقی: حدود ۲۴۰ میلیارد تومان خروج**
برای اولین‌بار جریان پول حقیقی منفی می‌شود.  
بعد از سه روز ورود بسیار سنگین، اولین نشانه از فشار فروش حقیقی‌ها دیده می‌شود.

### سرانه خرید حقیقی: حدود ۹۱ میلیون تومان  
### سرانه فروش حقیقی: حدود ۹۷ میلیون تومان  
سرانه فروش کمی بالاتر بوده و این هم‌راستا با خروج پول است.

### نسبت قدرت خرید به فروش حقیقی: حدود ۰.۹۴  
قدرت خرید کم‌تر شده اما فاصله زیاد نیست.

**جمع‌بندی روز:**  
در مجموع یک روز نسبتاً خنثی تا کمی منفی است.  
خروج ۲۴۰ میلیارد تومانی نسبت به ورودهای چند هزار میلیاردی قبلی بسیار کوچک است، بنابراین روند صعودی اصلی هنوز تخریب نشده.

---

# روز پنجم (آخرین روز)  
### تاریخ ۱۴۰۴/۱۰/۸  
### **خروج پول حقیقی: حدود ۴۷ میلیارد تومان خروج**
مجدداً خروج پول داریم ولی مقدار آن خیلی کوچک است.

### سرانه خرید حقیقی: حدود ۸۳ میلیون تومان  
### سرانه فروش حقیقی: حدود ۸۹ میلیون تومان  
سرانه فروش بیشتر بوده.

### نسبت قدرت خرید به فروش حقیقی: حدود ۰.۹۴  
قدرت خرید حقیقی همچنان کمی ضعیف‌تر است.

**جمع‌بندی روز:**  
روز دوم خروج، ولی مقدار خروج همچنان ناچیز است.  
بعد از چند روز ورود بسیار قوی، طبیعی است که یکی دو روز استراحت در معاملات حقیقی دیده شود.

---

# جمع‌بندی نهایی روند ۵ روزه

### ۱. **سه روز ابتدایی: موج ورود سنگین**  
ورودهای بسیار بزرگ حدود ۸۰۰ میلیارد، ۱۲۰۰۰ میلیارد و ۱۳۰۰۰ میلیارد تومان  
این سه روز نشان‌دهنده یک **فاز انباشت (accumulation)** است.  
این رفتار معمولاً توسط سرمایه‌گذاران بزرگ یا بازیگر اتفاق می‌افتد.

### ۲. **دو روز اخیر: خروج بسیار خفیف**  
خروج‌های روز چهارم و پنجم بسیار کوچک هستند.  
این احتمال دارد که صرفاً **فروش کوتاه‌مدت برخی حقیقی‌ها** باشد و هنوز نشانه‌ای از برگشت روند سنگین وجود ندارد.

### ۳. **سرانه‌ها در کل بالا بوده‌اند**  
سرانه‌های ۸۰ تا ۱۱۰ میلیون تومانی یعنی سهم مورد توجه حقیقی‌های با سرمایه قابل توجه است.

### ۴. **الگوی کلی جریان پول: مثبت و صعودی**
با اینکه دو روز آخر خروج داشته‌ایم، اما ورودهای قبلی آنقدر بزرگ بوده‌اند که این دو روز وزن زیادی ندارند.

این الگو نشان می‌دهد که:
ورود سنگین → ضعف بسیار کوچک → احتمال ادامه روند صعودی  
مخصوصاً وقتی آن را کنار **سیگنال تکنیکال قوی ایچیموکو** قرار بدهیم.

---

# نتیجه‌گیری برای تصمیم‌گیری:

* سهم در سه روز اول با **ورودهای بسیار بزرگ** حقیقی روبه‌رو شده است.  
* دو روز خروج داریم ولی مقدارش بسیار ناچیز است.  
* در کل روند **کاملاً مثبت و رو به بالا** است.  
* جریان پول حقیقی هنوز نشانه‌ای از برگشت روند یا هشدار جدی نمی‌دهد.  
* با توجه به سیگنال‌های تکنیکالی قوی که گفتی، این رفتار حقیقی‌ها **هم‌راستا با تحلیل تکنیکال** است.

        </generated-result>
      </example-1>
      <example-2>
        <topic>
        </topic>
        <generated-result>
        </generated-result>
      </example-2>
      <example-3>
        <topic>
        </topic>
        <generated-result>
        </generated-result>
      </example-3>
    </examples>

    لطفا خروجی رو با همین زبان، ساختار و لحن و
    به زبان html/markdown
    برام تولید کن.
    لطفا از همین مثال ها استفاده نکن!
    `;

    const userMessage = `این اطلاعات ${lastNDaysData.length} روز اخیر معاملات حقیقی و حقوقی سهم «${symbol}» 
    توی بازار بورس ایران هست.
    
    ${JSON.stringify(lastNDaysData)}

    در زیر هم همین اطلاعات رو پردازش کردم:
    ${JSON.stringify(processedData)}
    realMoneyInflow --> ورود پول حقیقی
    avgRealBuyAmount --> سرانه خرید حقیقی
    avgRealSellAmount --> سرانه فروش حقیقی
    realBuySellRatio --> قدرت خرید به فروش حقیقی

    من این محاسبات رو برای تصمیم گیزی راحت تر برای تو انجام داده ام. هر جایی که لازمه خودت محاسبات کامل و بیشتر رو انجام بده و بگو که چی کار کردی.

    این سهم رو بر اساس استراتژی ایچیموکو پیدا کردم. سیگنال ایچیموکو رو به این صورت گرفته ام که:
    ۱- قیمت بالاتر از ابر کومو باشه
    ۲- تنکنسن، کیجونسن رو به سمت بالا قطع کرده باشه
    ۳- چیکو هم بالاتر از قیمت پایانی باشه
    ۴- و همچنین چیکو بالاتر از ابر کومو بشاه 
    پس یه سیگنال تکنیکال قوی هست.

    حالا من ازت میخوام که سهم رو بر اساس معاملات حقیقی و حقوقی و تاریخ shamsiDate موجود در داده ها برام تحلیل کنی.
    این قسمت خیلی مهمه. باید دقت کنی. ارقام بر اساس ریال هستن. 
    هر جایی که میخوای بهم توضیح بدی که چقدر پول وارد یا خارج یا ... شده، بر اساس میلیون تومان یا میلیارد تومان یا ... بگو.
    مثلا 8095556571200 رو بگو حدود ۸۰۰ میلیارد تومان (دقت کن که این عدد به ریال بوده و من توی مثال یه صفر رو حذف کردم و به تومان گفته ام)
    یا عدد ۷۵۴۵۰  رو باید بگی حدود ۷ میلیون و نیم

    از علائم < یا < یا چیزهایی شبیه به این استفاده نکن و کامل توضیح بده که بزرگتر یا کوچکتر بوده.
    روزها رو از اول به آخر بررسی کن تا ببینم روند به چه صورت بوده
    توضیحات رو روز به روز بده و در نهایت یه جمع بندی کلی بکن
    توضیحات اضافه دیگه ای هم نده
    `;
    //TODO: میانگین حجم یا ارزش معاملات ۳۰ روز اخیر رو هم باید بذارم تا جاهایی که میگه خروج پول شدید یا معمولی، بیشتر واضح بشه.

    console.log(systemMessage);
    console.log(userMessage);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-oss:20b",
        messages: [
          { role: "developer", systemMessage },
          { role: "user", content: userMessage },
        ],
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

  const [ollamaResult, setOllamaResult] = useState("");
  const [status, setStatus] = useState("");

  //Run Agents
  useEffect(() => {
    async function load() {
      setStatus("گرفتن اطلاعات سهم از سایت tsetmc ...");
      const symbolId = await getSymbolId(symbol);
      const data = await readRealLegalDataHistory(symbolId);
      setStatus("پردازش اطلاعات ...");
      const lastNDaysData = getLastNDaysData(data, 5, 20251229);
      const processedData = processedRealLegalData(lastNDaysData);
      setStatus("در حال پردازش AI ...");
      const ollamaProcess = await getOllamaProcess(
        lastNDaysData,
        processedData,
      );
      console.log("🚀 ~ load ~ ollamaProcess:", ollamaProcess);
      setOllamaResult(ollamaProcess);
      setStatus("");
    }

    load();
  }, []);

  return (
    <>
      <div className="mx-auto w-full max-w-[630px] text-center">
        <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
          بررسی معاملات حقیقی و حقوقی سهم «{symbol}»
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          {status}
          {ollamaResult}
        </p>
      </div>
    </>
  );
};

export default AIAgent;
