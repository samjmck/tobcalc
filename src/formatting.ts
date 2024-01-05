export function formatMoney(value: number, currencyCode = "€", separators: {decimal?: string, thousand?: string} = {}) {
    // First obtain formatted value with '.' as decimal separator and ',' as thousand separator (US notation).
    let formattedValue = (Math.ceil(value) / 100).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
    // Then replace the separators with the ones we want.
    formattedValue = formattedValue.replace(",", "#");// Replace ',' with '#' first (in case the decimal separator is ',')
    formattedValue = formattedValue.replace(".", separators.decimal ?? ",");// Replace '.' with the decimal separator
    formattedValue = formattedValue.replace("#", separators.thousand ?? " ");// Replace '#' with the thousand separator
    const formattedCurrency = currencyCode ? `${currencyCode} ` : "";
    return `${formattedCurrency}${formattedValue}`;
}
