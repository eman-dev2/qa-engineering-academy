import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema, safeNext, signupSchema } from "@/lib/auth/validation";
import { clearFailures, isThrottled, recordFailure } from "@/lib/auth/rate-limit";

describe("password hashing", () => {
  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse 42");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse 42", hash)).toBe(true);
    expect(await verifyPassword("correct horse 43", hash)).toBe(false);
  });

  it("uses a unique salt for every hash", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password-1"), hashPassword("same-password-1")]);
    expect(a).not.toEqual(b);
  });

  it("rejects malformed stored hashes instead of throwing", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$abc")).toBe(false);
    expect(await verifyPassword("x", "scrypt$1$2$3$onlyfive")).toBe(false);
  });
});

describe("signup validation", () => {
  const valid = { name: "Lina Haddad", email: "Lina@Example.com ", password: "boundary99x" };

  it("accepts valid input and normalises the email", () => {
    const r = signupSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.success && r.data.email).toBe("lina@example.com");
  });

  it.each([
    ["password shorter than 10", { password: "abc12345" }, "password"],
    ["password with no digit", { password: "onlyletters" }, "password"],
    ["password with no letter", { password: "1234567890" }, "password"],
    ["invalid email", { email: "not-an-email" }, "email"],
    ["one-character name", { name: "L" }, "name"],
  ])("rejects %s", (_label, override, field) => {
    const r = signupSchema.safeParse({ ...valid, ...override });
    expect(r.success).toBe(false);
    expect(!r.success && r.error.flatten().fieldErrors).toHaveProperty(field);
  });

  it("accepts a 10-character password (boundary) and rejects 9", () => {
    expect(signupSchema.safeParse({ ...valid, password: "abcdefgh12" }).success).toBe(true);
    expect(signupSchema.safeParse({ ...valid, password: "abcdefg12" }).success).toBe(false);
  });

  it("requires a password on login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("safeNext (open-redirect protection)", () => {
  it.each([
    ["/paths/qa-foundations", "/paths/qa-foundations"],
    ["/dashboard?x=1", "/dashboard?x=1"],
    ["//evil.example", "/dashboard"],
    ["/\\evil.example", "/dashboard"],
    ["https://evil.example", "/dashboard"],
    ["javascript:alert(1)", "/dashboard"],
    [undefined, "/dashboard"],
    [["/a", "/b"], "/dashboard"],
  ])("safeNext(%j) -> %s", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});

describe("login throttle", () => {
  it("throttles after 8 failures in the window and resets after it", () => {
    const key = "throttle@test.example";
    const t0 = 1_000_000;
    for (let i = 0; i < 7; i++) recordFailure(key, t0);
    expect(isThrottled(key, t0)).toBe(false);
    recordFailure(key, t0);
    expect(isThrottled(key, t0)).toBe(true);
    expect(isThrottled(key, t0 + 15 * 60 * 1000 + 1)).toBe(false);
    clearFailures(key);
  });
});
