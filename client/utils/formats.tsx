// Helper to format cash values
export const formatCurrency = (amount: string, currency: string) => {
  const numeric = parseFloat(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
};

// Beautiful formatting for dates
export const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "Flexible Timeline";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
