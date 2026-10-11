import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("../src/shared/api-client/httpClient", () => ({
  httpClient: { get: api.get, put: vi.fn() },
}));

import { getSnapshot } from "../src/features/questionnaire/api";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getSnapshot", () => {
  it("returns an empty answer set when no snapshot exists", async () => {
    api.get.mockResolvedValue({ data: null });

    await expect(getSnapshot()).resolves.toEqual({});
  });

  it("returns saved answers from a valid snapshot", async () => {
    const answers = { E1: { score: "1", note: "Tracked energy use" } };
    api.get.mockResolvedValue({ data: { dataJson: JSON.stringify(answers) } });

    await expect(getSnapshot()).resolves.toEqual(answers);
  });

  it("reports malformed saved JSON instead of presenting an empty diagnostic", async () => {
    api.get.mockResolvedValue({ data: { dataJson: "{invalid" } });

    await expect(getSnapshot()).rejects.toThrow(
      "Saved questionnaire responses contain invalid JSON.",
    );
  });

  it.each(["null", "[]", '"answers"', "42"])(
    "rejects saved JSON that is not an answer object: %s",
    async (dataJson) => {
      api.get.mockResolvedValue({ data: { dataJson } });

      await expect(getSnapshot()).rejects.toThrow(
        "Saved questionnaire responses must be a JSON object.",
      );
    },
  );
});
