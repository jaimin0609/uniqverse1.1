import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CurrencyProvider, Currency } from "@/contexts/currency-provider";
import { CurrencySelector } from "./currency-selector";

// Mock currencies and rates for testing
const mockRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.51,
  CAD: 1.36,
  JPY: 154.35,
};

interface RenderWithProviderOptions {
    currency?: Currency;
}

function renderWithProvider(
    ui: React.ReactElement, 
    { currency = "USD" as Currency }: RenderWithProviderOptions = {}
): ReturnType<typeof render> {
    return render(
        <CurrencyProvider defaultCurrency={currency as Currency}>
            {ui}
        </CurrencyProvider>
    );
}

describe("CurrencySelector", () => {
  it("renders and shows current currency", () => {
    renderWithProvider(<CurrencySelector />, { currency: "USD" });
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("opens the currency dropdown and lists all options", async () => {
    renderWithProvider(<CurrencySelector />);
    fireEvent.click(screen.getByRole("combobox"));
    await waitFor(() => {
      expect(screen.getByText("US Dollar (USD)")).toBeInTheDocument();
      expect(screen.getByText("Euro (EUR)")).toBeInTheDocument();
      expect(screen.getByText("British Pound (GBP)")).toBeInTheDocument();
      expect(screen.getByText("Australian Dollar (AUD)")).toBeInTheDocument();
      expect(screen.getByText("Canadian Dollar (CAD)")).toBeInTheDocument();
      expect(screen.getByText("Japanese Yen (JPY)")).toBeInTheDocument();
    });
  });

  it("changes currency when a new option is selected", async () => {
    renderWithProvider(<CurrencySelector />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Euro (EUR)"));
    await waitFor(() => {
      expect(screen.getByText("EUR")).toBeInTheDocument();
    });
  });
});
