// Converts a value such as "101.11", "90.10", "90.1" to 10111, 9010, 9010 of type number
export function moneyToNumber(money: string, decimalSeparator = ".", expectedDecimals = 2) {
    const decimalSeparatorIndex = money.indexOf(decimalSeparator);
    if(decimalSeparatorIndex == -1) {
        return Number(money) * (10 ** expectedDecimals);
    }

    // ".10"
    // length = 3
    // decimalSeparatorIndex = 0
    // decimalSeparatorIndex + 1 = 1
    // decimals = length - (decimalSeparatorIndex + 1) = 3 - 1 = 2
    const decimals = money.length - decimalSeparatorIndex - 1;

    // eg. ".10" -> decimals already 2, replace "." and convert to number which will be integer
    //     ".1" -> decimals 1 when we are expecting 2, replace "." and convert to number which will be integer and
    //     then * 10 to compensate for rounded decimal
    return Number(money.replace(decimalSeparator, "")) * (10 ** (expectedDecimals - decimals));
}
