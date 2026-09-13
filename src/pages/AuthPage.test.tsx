import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../lib/auth";
import { AuthPage } from "./AuthPage";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => vi.unstubAllGlobals());

describe("social login choices", () => {
  it("keeps Apple and Google visible when the authentication server reports they are disabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, _init?: RequestInit) =>
        Promise.resolve(new Response(JSON.stringify({ apple: false, google: false }), { status: 200, headers: { "Content-Type": "application/json" } }))
      )
    );

    render(
      <MemoryRouter>
        <AuthProvider><AuthPage mode="login" /></AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("button", { name: "Apple sign-in unavailable" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Google setup required" })).toBeVisible();
  });
});
