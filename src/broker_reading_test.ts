import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { moneyToNumber } from "./broker_reading.ts";

Deno.test({
    name: "moneyToNumber",
    fn: () => {
        assertEquals(moneyToNumber("1"), 1_00);
        assertEquals(moneyToNumber("1.0"), 1_00);
        assertEquals(moneyToNumber("1.00"), 1_00);
        assertEquals(moneyToNumber("1.01"), 1_01);
        assertEquals(moneyToNumber("1.10"), 1_10);
        assertEquals(moneyToNumber("1.1"), 1_10);
        assertEquals(moneyToNumber("99.9"), 99_90);
        assertEquals(moneyToNumber("99.99"), 99_99);
        assertEquals(moneyToNumber("999.99"), 999_99);
        assertEquals(moneyToNumber("1000,10", ","), 1000_10);
        assertEquals(moneyToNumber("1000,1", ","), 1000_10);
        assertEquals(moneyToNumber("1000."), 1000_00);
    },
});
