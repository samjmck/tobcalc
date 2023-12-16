import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { formatMoney } from "./formatting.ts";

Deno.test({
    name: "formatting money",
    fn: () => {
        assertEquals(formatMoney(1_00), "€ 1,00");
        assertEquals(formatMoney(1_01), "€ 1,01");
        assertEquals(formatMoney(1_10), "€ 1,10");
        assertEquals(formatMoney(1_11), "€ 1,11");
        assertEquals(formatMoney(1_00.1), "€ 1,01");
        assertEquals(formatMoney(1_99.99), "€ 2,00")
        assertEquals(formatMoney(999_99), "€ 999,99");
        assertEquals(formatMoney(999_99.9), "€ 1 000,00");
        assertEquals(formatMoney(999_99.9, "$"), "$ 1 000,00");
        assertEquals(formatMoney(1_99, "$", {decimal: "."}), "$ 1.99");
        assertEquals(formatMoney(1_99, "", {decimal: "."}), "1.99");
        assertEquals(formatMoney(1000_00, "", {thousand: "."}), "1.000,00");
        assertEquals(formatMoney(1000_00, "$", {decimal: ".", thousand: ","}), "$ 1,000.00");
    },
});
