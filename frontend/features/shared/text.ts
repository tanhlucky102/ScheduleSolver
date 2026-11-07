export const commaValues = (value: string) =>
  value.split(",").map((item) => item.trim()).filter(Boolean);
