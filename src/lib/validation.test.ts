import { describe, expect, it } from "vitest";

import {
  profileUpdateSchema,
  reviewSchema,
  collectionSchema,
  collectionItemSchema,
  PUBLIC_SLUG_PATTERN,
} from "./validation";

describe("profileUpdateSchema", () => {
  it("normalizes empty optional fields to null", () => {
    const result = profileUpdateSchema.parse({
      displayName: "  Ada  ",
      bio: "",
      avatarUrl: "",
      publicSlug: "",
      isPublic: false,
    });
    expect(result.displayName).toBe("Ada");
    expect(result.bio).toBeNull();
    expect(result.avatarUrl).toBeNull();
    expect(result.publicSlug).toBeNull();
  });

  it("lowercases and accepts a valid slug", () => {
    const result = profileUpdateSchema.parse({
      displayName: "Ada",
      publicSlug: "Ada-Lovelace",
      isPublic: true,
    });
    expect(result.publicSlug).toBe("ada-lovelace");
  });

  it("rejects an invalid slug", () => {
    const result = profileUpdateSchema.safeParse({
      displayName: "Ada",
      publicSlug: "no",
      isPublic: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires a non-empty display name", () => {
    const result = profileUpdateSchema.safeParse({
      displayName: "   ",
      isPublic: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("PUBLIC_SLUG_PATTERN", () => {
  it("matches valid handles and rejects invalid ones", () => {
    expect(PUBLIC_SLUG_PATTERN.test("ada-lovelace")).toBe(true);
    expect(PUBLIC_SLUG_PATTERN.test("abc")).toBe(true);
    expect(PUBLIC_SLUG_PATTERN.test("ab")).toBe(false);
    expect(PUBLIC_SLUG_PATTERN.test("a")).toBe(false);
    expect(PUBLIC_SLUG_PATTERN.test("-nope")).toBe(false);
    expect(PUBLIC_SLUG_PATTERN.test("Nope")).toBe(false);
    expect(PUBLIC_SLUG_PATTERN.test("has space")).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts a valid review", () => {
    const result = reviewSchema.parse({
      mediaType: "movie",
      mediaId: "603",
      rating: 8,
      body: "Great.",
    });
    expect(result.rating).toBe(8);
    expect(result.body).toBe("Great.");
  });

  it("rejects out-of-range ratings", () => {
    expect(
      reviewSchema.safeParse({ mediaType: "movie", mediaId: "1", rating: 0 })
        .success,
    ).toBe(false);
    expect(
      reviewSchema.safeParse({ mediaType: "movie", mediaId: "1", rating: 11 })
        .success,
    ).toBe(false);
  });

  it("rejects unknown media types", () => {
    expect(
      reviewSchema.safeParse({ mediaType: "book", mediaId: "1", rating: 5 })
        .success,
    ).toBe(false);
  });

  it("treats an empty body as null", () => {
    const result = reviewSchema.parse({
      mediaType: "tv",
      mediaId: "1399",
      rating: 10,
      body: "   ",
    });
    expect(result.body).toBeNull();
  });
});

describe("collectionSchema", () => {
  it("requires a name and defaults visibility to private", () => {
    const result = collectionSchema.parse({ name: "Cozy nights" });
    expect(result.name).toBe("Cozy nights");
    expect(result.isPublic).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(collectionSchema.safeParse({ name: "  " }).success).toBe(false);
  });
});

describe("collectionItemSchema", () => {
  it("requires a uuid collection id", () => {
    expect(
      collectionItemSchema.safeParse({
        collectionId: "not-a-uuid",
        mediaType: "movie",
        mediaId: "603",
      }).success,
    ).toBe(false);
  });
});
