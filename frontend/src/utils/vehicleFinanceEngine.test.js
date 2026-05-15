import { expect } from "chai";
import {
  FINANCE_PRODUCTS,
  VEHICLE_CONDITIONS,
  buildVehicleFinanceComparison,
  calculateMoneyDraft,
  calculateStandardAmortization,
  formatLkr,
  getLtvError,
  getStandardMaxLtv,
} from "./vehicleFinanceEngine.js";

describe("vehicleFinanceEngine", () => {
  it("calculates standard amortized leasing and vehicle loan payments", () => {
    const result = calculateStandardAmortization({
      vehicleValue: 5_000_000,
      downPayment: 2_000_000,
      annualRate: 12,
      tenureYears: 5,
      vehicleCondition: VEHICLE_CONDITIONS.USED,
      productType: FINANCE_PRODUCTS.VEHICLE_LOAN,
    });

    const principal = 3_000_000;
    const monthlyRate = 0.12 / 12;
    const months = 60;
    const expectedEmi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    expect(result.principal).to.equal(principal);
    expect(result.monthlyInstallment).to.be.closeTo(expectedEmi, 0.01);
    expect(result.totalInterestPaid).to.be.closeTo(expectedEmi * months - principal, 0.01);
    expect(result.principalSettlementDue).to.equal(0);
    expect(result.tenureMonths).to.equal(60);
  });

  it("calculates money draft as an interest-only 24 month facility", () => {
    const result = calculateMoneyDraft({
      vehicleValue: 10_000_000,
      downPayment: 5_000_000,
      annualRate: 15,
    });

    expect(result.productType).to.equal(FINANCE_PRODUCTS.MONEY_DRAFT);
    expect(result.principal).to.equal(5_000_000);
    expect(result.monthlyInstallment).to.be.closeTo(62_500, 0.01);
    expect(result.totalInterestPaid).to.be.closeTo(1_500_000, 0.01);
    expect(result.principalSettlementDue).to.equal(5_000_000);
    expect(result.tenureMonths).to.equal(24);
    expect(result.disclaimer).to.match(/interest only/i);
  });

  it("applies LTV rules for brand new, used, and money draft products", () => {
    expect(getStandardMaxLtv(VEHICLE_CONDITIONS.BRAND_NEW)).to.equal(0.7);
    expect(getStandardMaxLtv(VEHICLE_CONDITIONS.USED)).to.equal(0.6);

    const usedLoan = calculateStandardAmortization({
      vehicleValue: 10_000_000,
      downPayment: 3_000_000,
      annualRate: 10,
      tenureYears: 3,
      vehicleCondition: VEHICLE_CONDITIONS.USED,
      productType: FINANCE_PRODUCTS.LEASING,
    });
    const draft = calculateMoneyDraft({
      vehicleValue: 10_000_000,
      downPayment: 4_000_000,
      annualRate: 10,
    });

    expect(usedLoan.ltv).to.equal(0.7);
    expect(usedLoan.isValid).to.equal(false);
    expect(getLtvError(usedLoan)).to.match(/increase Down Payment/);
    expect(draft.maxLtv).to.equal(0.55);
    expect(draft.isValid).to.equal(false);
  });

  it("caps standard tenure at seven years and uses zero-rate fallback", () => {
    const result = calculateStandardAmortization({
      vehicleValue: 8_000_000,
      downPayment: 2_000_000,
      annualRate: 0,
      tenureYears: 9,
      vehicleCondition: VEHICLE_CONDITIONS.BRAND_NEW,
      productType: FINANCE_PRODUCTS.LEASING,
    });

    expect(result.tenureMonths).to.equal(84);
    expect(result.monthlyInstallment).to.be.closeTo(6_000_000 / 84, 0.01);
  });

  it("handles overpayment by clamping principal to zero", () => {
    const result = calculateMoneyDraft({
      vehicleValue: 2_000_000,
      downPayment: 3_000_000,
      annualRate: 18,
    });

    expect(result.principal).to.equal(0);
    expect(result.monthlyInstallment).to.equal(0);
    expect(result.isValid).to.equal(true);
  });

  it("builds comparison rows for all supported products and formats LKR", () => {
    const comparison = buildVehicleFinanceComparison({
      vehicleValue: 4_000_000,
      downPayment: 1_600_000,
      annualRate: 12,
      tenureYears: 4,
      vehicleCondition: VEHICLE_CONDITIONS.USED,
    });

    expect(comparison.map((item) => item.productType)).to.deep.equal([
      FINANCE_PRODUCTS.LEASING,
      FINANCE_PRODUCTS.VEHICLE_LOAN,
      FINANCE_PRODUCTS.MONEY_DRAFT,
    ]);
    expect(formatLkr(1234567.4)).to.equal("LKR 1,234,567");
  });
});
