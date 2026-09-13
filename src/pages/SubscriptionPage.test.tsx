import { describe, expect, it } from "vitest";
import { subscriptionProviderView } from "./SubscriptionPage";

describe("subscription billing provider", () => {
  it("links App Store subscriptions to Apple", () => {
    expect(subscriptionProviderView("apple")).toMatchObject({
      name: "Apple App Store",
      manageUrl: "https://apps.apple.com/account/subscriptions",
    });
  });

  it("links Play subscriptions to Google", () => {
    expect(subscriptionProviderView("google")).toMatchObject({
      name: "Google Play",
      manageUrl: "https://play.google.com/store/account/subscriptions",
    });
  });

  it("shows Stripe without inventing a portal URL", () => {
    expect(subscriptionProviderView("stripe")).toMatchObject({ name: "Stripe" });
    expect(subscriptionProviderView("stripe").manageUrl).toBeUndefined();
  });

  it("labels admin-granted access as complimentary", () => {
    expect(subscriptionProviderView("admin")).toMatchObject({ name: "Complimentary access" });
  });
});
