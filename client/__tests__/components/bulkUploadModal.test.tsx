import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BulkUploadModal from "@/components/dashboard/admin/BulkUploadModal";

const mockUploadInventoryFile = jest.fn();

jest.mock("@/context", () => ({
  useDashboard: () => ({
    uploadInventoryFile: mockUploadInventoryFile,
  }),
}));

describe("BulkUploadModal Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = "";
  });

  it("does not render when isOpen is false", () => {
    render(<BulkUploadModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders centered modal with all sections when isOpen is true", () => {
    render(<BulkUploadModal isOpen={true} onClose={jest.fn()} />);
    
    // Viewport-level dialog overlay
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass("fixed", "inset-0", "z-[9999]");

    // Title and Header
    expect(screen.getByText("Bulk Blood Inventory Upload")).toBeInTheDocument();
    
    // Mode selectors
    expect(screen.getByText("Select Update Mode")).toBeInTheDocument();
    expect(screen.getByText("Merge / Add to Stock")).toBeInTheDocument();
    expect(screen.getByText("Replace All Inventory")).toBeInTheDocument();

    // Dropzone
    expect(screen.getByText("Click to upload or drag & drop file")).toBeInTheDocument();

    // Footer actions
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload & update inventory/i })).toBeInTheDocument();
  });

  it("locks background scrolling when opened and restores on unmount", () => {
    const { unmount } = render(<BulkUploadModal isOpen={true} onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("triggers onClose when clicking Cancel button or close icon", () => {
    const handleClose = jest.fn();
    render(<BulkUploadModal isOpen={true} onClose={handleClose} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText(/close dialog/i));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it("closes modal on Escape key press", () => {
    const handleClose = jest.fn();
    render(<BulkUploadModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("allows toggling update mode between merge and replace", () => {
    render(<BulkUploadModal isOpen={true} onClose={jest.fn()} />);

    const mergeBtn = screen.getByText("Merge / Add to Stock").closest("button");
    const replaceBtn = screen.getByText("Replace All Inventory").closest("button");

    expect(mergeBtn).toHaveClass("border-red-500");

    fireEvent.click(replaceBtn!);
    expect(replaceBtn).toHaveClass("border-amber-500");
  });
});
