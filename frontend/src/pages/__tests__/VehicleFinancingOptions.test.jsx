import React from "react";
import { expect } from "chai";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "../../i18n.js";
import VehicleFinancingOptions from "../VehicleFinancingOptions.jsx";
import { supabase } from "../../utils/supabaseClient.js";

const financingRows = [
  { id: "bank-1", name: "Commercial Bank", type: "Bank", fixed_rate: 10, status: "Active", max_ltv: 60 },
  { id: "lease-1", name: "People's Leasing", type: "Leasing", fixed_rate: 12, status: "Active", max_ltv: 60 },
  { id: "draft-1", name: "Vallibel Finance", type: "Draft", fixed_rate: 15, status: "Active", max_ltv: 55 },
];

function mockFinancingRates() {
  supabase.from = () => ({
    select: () => ({
      eq: () => Promise.resolve({ data: financingRows, error: null }),
    }),
  });
}

function renderFinancing({ predictedPrice = 5_000_000, vehicle = { condition: "Used" } } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/financing", state: { predictedPrice, vehicle } }]}>
      <Routes>
        <Route path="/financing" element={<VehicleFinancingOptions />} />
        <Route path="/results" element={<div>Results page</div>} />
        <Route path="/price-check" element={<div>Price Check page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("VehicleFinancingOptions with Mocha/Chai", () => {
  beforeEach(() => {
    mockFinancingRates();
  });

  it("renders product selection and institution rates from mocked data", async () => {
    renderFinancing();

    expect(screen.getByRole("heading", { name: "Vehicle Financing Options" })).to.exist;
    expect(screen.getByRole("button", { name: /Vehicle Loan/i })).to.exist;
    expect(await screen.findByRole("button", { name: /Commercial Bank/i })).to.exist;
    expect(screen.getAllByText("10%").length).to.be.greaterThan(0);
  });

  it("updates the monthly estimate when down payment and tenure sliders change", async () => {
    renderFinancing();
    await userEvent.click(await screen.findByRole("button", { name: /Commercial Bank/i }));

    const plan = screen.getByText("Your selected plan").closest("article");
    const initialMonthly = within(plan).getByText(/LKR /, { selector: "strong" }).textContent;
    const sliders = screen.getAllByRole("slider");

    fireEvent.change(sliders[0], { target: { value: "40" } });
    fireEvent.change(sliders[1], { target: { value: "60" } });

    await waitFor(() => {
      const updatedMonthly = within(plan).getByText(/LKR /, { selector: "strong" }).textContent;
      expect(updatedMonthly).to.not.equal(initialMonthly);
    });
  });

  it("shows LTV validation error when the selected plan exceeds bank limits", async () => {
    renderFinancing({ predictedPrice: 10_000_000, vehicle: { condition: "Used" } });
    await userEvent.click(await screen.findByRole("button", { name: /Commercial Bank/i }));

    expect(screen.getByText(/Loan amount exceeds bank LTV limits/i)).to.exist;
  });
});
