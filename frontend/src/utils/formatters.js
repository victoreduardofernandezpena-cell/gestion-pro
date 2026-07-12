import { formatDate, formatDateTime, formatNumber, money } from "./format";

export const formatCurrency = (value) => money.format(value);

export { formatDate, formatDateTime, formatNumber };
