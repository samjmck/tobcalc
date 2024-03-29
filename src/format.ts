export function formatPercentage(value: number) {
    return `${(value * 100).toFixed(2)}%`;
}

export function formatDate(date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}