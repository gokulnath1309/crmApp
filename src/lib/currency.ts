export const formatCurrency = (amount: number, currency: string): string => {
  const val = typeof amount === "number" ? amount : Number(amount) || 0;

  if (currency === "AED") {
    const formattedNum = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(val);
    return `AED ${formattedNum}`;
  }

  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val);
};
