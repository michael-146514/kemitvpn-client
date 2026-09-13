import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "./DashboardLayout";

const account = {
  user: { id: "u1", email: "member@example.com", displayName: "Kemit Member", status: "active", providers: ["apple"], emailConfirmed: true, createdAt: "2026-01-01" },
  subscription: null,
  vpn: { provisioned: false, state: null },
  device: { id: "d1", status: "active", limit: 5, activeDevices: 1 },
};

vi.mock("../lib/auth", () => ({
  displayName: () => "Kemit Member",
  useAuth: () => ({ auth: { user: account.user }, request: vi.fn().mockResolvedValue(account), logout: vi.fn() }),
}));

describe("client dashboard navigation", () => {
  it("provides every dashboard section, legal footer links, and a working mobile drawer", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/account"]}><Routes><Route path="/account" element={<DashboardLayout />}><Route index element={<div>Overview content</div>} /></Route></Routes></MemoryRouter>);

    const navigation = within(screen.getByRole("navigation", { name: "Account navigation" }));
    expect(navigation.getByRole("link", { name: /Overview/ })).toHaveAttribute("href", "/account");
    expect(navigation.getByRole("link", { name: /Subscription/ })).toHaveAttribute("href", "/account/subscription");
    expect(navigation.getByRole("link", { name: /Devices/ })).toHaveAttribute("href", "/account/devices");
    expect(navigation.getByRole("link", { name: /Support/ })).toHaveAttribute("href", "/account/support");
    expect(navigation.getByRole("link", { name: /Settings/ })).toHaveAttribute("href", "/account/settings");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByText("Secure session")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("complementary")).toHaveClass("open");
    await user.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(screen.getByRole("complementary")).not.toHaveClass("open");
  });
});
