import { describe, expect, it } from "vitest";
import { checkCalc, evalExpr, parseAnswerNumber } from "@/lib/exam/calc";

describe("evalExpr", () => {
  it("işlem önceliğine uyar", () => {
    expect(evalExpr("2+3*4")).toBe(14);
    expect(evalExpr("(2+3)*4")).toBe(20);
    expect(evalExpr("2^3^2")).toBe(512); // sağdan birleşimli
    expect(evalExpr("-2^2")).toBe(-4);
    expect(evalExpr("10/4")).toBe(2.5);
  });
  it("fonksiyon ve sabitleri destekler", () => {
    expect(evalExpr("sqrt(144)")).toBe(12);
    expect(evalExpr("sind(30)")).toBeCloseTo(0.5, 10);
    expect(evalExpr("cosd(60)")).toBeCloseTo(0.5, 10);
    expect(evalExpr("log(1000)")).toBeCloseTo(3, 10);
    expect(evalExpr("pi")).toBeCloseTo(Math.PI, 10);
  });
  it("örtük çarpmayı yalnızca parantez önünde kabul eder", () => {
    expect(evalExpr("2(3+1)")).toBe(8);
    expect(() => evalExpr("2pi")).toThrow();
  });
  it("kod enjeksiyonu ve geçersiz girdiyi reddeder", () => {
    for (const bad of ["process.exit()", "constructor", "1+", "(1+2", "1;2", "a+1", "__proto__", "1/0 + x", "alert(1)"]) {
      expect(() => evalExpr(bad), bad).toThrow();
    }
  });
  it("sonsuz/NaN sonuç ve aşırı uzunluğu reddeder", () => {
    expect(() => evalExpr("1/0")).toThrow();
    expect(() => evalExpr("sqrt(-1)")).toThrow();
    expect(() => evalExpr("1+".repeat(150) + "1")).toThrow();
    expect(() => evalExpr("(".repeat(30) + "1" + ")".repeat(30))).toThrow();
  });
});

describe("parseAnswerNumber", () => {
  it("birim ve Türkçe ondalık virgülü ayıklar", () => {
    expect(parseAnswerNumber("12 cm")?.value).toBe(12);
    expect(parseAnswerNumber("3,5 m/s")?.value).toBe(3.5);
    expect(parseAnswerNumber("3,5 m/s")?.decimals).toBe(1);
    expect(parseAnswerNumber("1 000")?.value).toBe(1000);
  });
  it("LaTeX kesir, kök ve yüzdeyi çözer", () => {
    expect(parseAnswerNumber("$\\frac{1}{4}$")?.value).toBeCloseTo(0.25, 10);
    expect(parseAnswerNumber("$\\sqrt{81}$")?.value).toBe(9);
    expect(parseAnswerNumber("%25")?.value).toBeCloseTo(0.25, 10);
    expect(parseAnswerNumber("−4")?.value).toBe(-4);
  });
  it("sayı içermeyen seçenek için null döner", () => {
    expect(parseAnswerNumber("Mitokondri")).toBeNull();
    expect(parseAnswerNumber("")).toBeNull();
  });
});

describe("checkCalc", () => {
  it("doğru ifadeyi onaylar", () => {
    expect(checkCalc("3*4", "12")).toBe("passed");
    expect(checkCalc("sqrt(2)", "1,41")).toBe("passed");
  });
  it("yanlış sonucu yakalar", () => {
    expect(checkCalc("3*4", "13")).toBe("failed");
    expect(checkCalc("sqrt(2)", "1,5")).toBe("failed");
  });
  it("doğrulanamayan durumu 'geçti' saymaz", () => {
    expect(checkCalc("3*4", "Kütle")).toBe("unverifiable");
    expect(checkCalc("kod(", "12")).toBe("unverifiable");
  });
});
