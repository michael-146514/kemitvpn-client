import { describe, expect, it } from "vitest";
import { shouldRefreshAfter } from "./auth";
import { ApiError } from "./request";

describe("authenticated request retry policy", () => {
  it("refreshes only when the access token is invalid", () => {
    expect(shouldRefreshAfter(new ApiError("expired", 401, "INVALID_TOKEN"))).toBe(true);
    expect(shouldRefreshAfter(new ApiError("missing", 401, "NO_TOKEN"))).toBe(true);
  });

  it("does not repeat security challenges or revoked sessions", () => {
    expect(shouldRefreshAfter(new ApiError("wrong code", 401, "MFA_CODE_INVALID"))).toBe(false);
    expect(shouldRefreshAfter(new ApiError("revoked", 401, "SESSION_REVOKED"))).toBe(false);
    expect(shouldRefreshAfter(new ApiError("wrong password", 401, "INVALID_CREDENTIALS"))).toBe(false);
  });
});
