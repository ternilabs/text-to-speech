import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { StatusRows } from "./StatusRows";

describe("StatusRows", () => {
  it("shows loading model row when status is loading-model", () => {
    render(<StatusRows mode="single" status="loading-model" />);

    expect(screen.getByText("Loading selected model...")).toBeTruthy();
    expect(document.querySelector(".model-loading.show")).toBeTruthy();
  });

  it("shows generating row when status is generating", () => {
    render(<StatusRows mode="single" status="generating" />);

    expect(screen.getByText("Synthesizing audio...")).toBeTruthy();
    expect(document.querySelector(".gen-row.show")).toBeTruthy();
  });

  it("shows exporting row when status is exporting", () => {
    render(<StatusRows mode="bulk" status="exporting" />);

    expect(screen.getByText("Exporting ZIP...")).toBeTruthy();
  });

  it("shows single error row when status is error in single mode", () => {
    render(<StatusRows mode="single" status="error" />);

    expect(screen.getByText(/Unable to generate audio/)).toBeTruthy();
    expect(document.querySelector(".error-row.show")).toBeTruthy();
  });

  it("shows bulk error row when status is error in bulk mode", () => {
    render(<StatusRows mode="bulk" status="error" />);

    expect(screen.getByText(/Unable to export bulk audio/)).toBeTruthy();
  });

  it("shows cancel row when status is cancelled", () => {
    render(<StatusRows mode="single" status="cancelled" />);

    expect(screen.getByText(/cancelled the operation/)).toBeTruthy();
    expect(document.querySelector(".warning-row.show")).toBeTruthy();
  });

  it("shows nothing when status is idle", () => {
    render(<StatusRows mode="single" status="idle" />);

    expect(document.querySelector(".model-loading.show")).toBeNull();
    expect(document.querySelector(".gen-row.show")).toBeNull();
    expect(document.querySelector(".error-row.show")).toBeNull();
    expect(document.querySelector(".warning-row.show")).toBeNull();
  });

  it("shows nothing when status is ready", () => {
    render(<StatusRows mode="single" status="ready" />);

    expect(document.querySelector(".model-loading.show")).toBeNull();
    expect(document.querySelector(".gen-row.show")).toBeNull();
    expect(document.querySelector(".error-row.show")).toBeNull();
    expect(document.querySelector(".warning-row.show")).toBeNull();
  });
});
