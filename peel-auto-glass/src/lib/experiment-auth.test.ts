import assert from "node:assert/strict";
import { test } from "node:test";
import { MIN_PASSWORD_LENGTH, checkExperimentAuth } from "./experiment-auth.ts";

const env = { EXPERIMENTS_USER: "lab", EXPERIMENTS_PASSWORD: "correct-horse-battery-staple" };
const basic = (u: string, p: string) => `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;

test("accepts the right credentials", () => {
  assert.equal(checkExperimentAuth(basic("lab", env.EXPERIMENTS_PASSWORD), env), "ok");
  assert.equal(checkExperimentAuth(`basic ${Buffer.from("lab:" + env.EXPERIMENTS_PASSWORD).toString("base64")}`, env), "ok");
});

test("rejects missing, malformed and wrong credentials", () => {
  assert.equal(checkExperimentAuth(null, env), "unauthorized");
  assert.equal(checkExperimentAuth("", env), "unauthorized");
  assert.equal(checkExperimentAuth("Bearer abc", env), "unauthorized");
  assert.equal(checkExperimentAuth("Basic !!!notbase64", env), "unauthorized");
  assert.equal(checkExperimentAuth(`Basic ${Buffer.from("nocolon").toString("base64")}`, env), "unauthorized");
  assert.equal(checkExperimentAuth(basic("lab", "wrong"), env), "unauthorized");
  assert.equal(checkExperimentAuth(basic("other", env.EXPERIMENTS_PASSWORD), env), "unauthorized");
  assert.equal(checkExperimentAuth(basic("", ""), env), "unauthorized");
  assert.equal(checkExperimentAuth(basic("lab", env.EXPERIMENTS_PASSWORD + "x"), env), "unauthorized");
});

test("passwords may contain colons", () => {
  const e = { EXPERIMENTS_USER: "lab", EXPERIMENTS_PASSWORD: "a:b:c:d:e:f:g:h:i:j:k" };
  assert.equal(checkExperimentAuth(basic("lab", e.EXPERIMENTS_PASSWORD), e), "ok");
});

test("fails closed when not configured or when the password is too short", () => {
  assert.equal(checkExperimentAuth(basic("lab", "x"), {}), "unconfigured");
  assert.equal(checkExperimentAuth(basic("", ""), { EXPERIMENTS_USER: "", EXPERIMENTS_PASSWORD: "" }), "unconfigured");
  assert.equal(checkExperimentAuth(basic("lab", "short"), { EXPERIMENTS_USER: "lab", EXPERIMENTS_PASSWORD: "short" }), "unconfigured");
  const justEnough = "x".repeat(MIN_PASSWORD_LENGTH);
  assert.equal(checkExperimentAuth(basic("lab", justEnough), { EXPERIMENTS_USER: "lab", EXPERIMENTS_PASSWORD: justEnough }), "ok");
  assert.equal(checkExperimentAuth(basic("lab", justEnough.slice(1)), { EXPERIMENTS_USER: "lab", EXPERIMENTS_PASSWORD: justEnough.slice(1) }), "unconfigured");
});
