export const FINANCE_PRODUCTS = {
    LEASING: "leasing",
    VEHICLE_LOAN: "vehicle_loan",
    MONEY_DRAFT: "money_draft",
};

export const VEHICLE_CONDITIONS = {
    BRAND_NEW: "brand_new",
    USED: "used",
};

const LTV_RULES = {
    standardBrandNew: 0.7,
    standardUsed: 0.6,
    moneyDraft: 0.55,
};

export function formatLkr(value) {
    return `LKR ${Math.round(Number(value) || 0).toLocaleString("en-LK")}`;
}

export function getStandardMaxLtv(vehicleCondition) {
    return vehicleCondition === VEHICLE_CONDITIONS.BRAND_NEW
        ? LTV_RULES.standardBrandNew
        : LTV_RULES.standardUsed;
}

export function calculateStandardAmortization({
    vehicleValue,
    downPayment,
    annualRate,
    tenureYears,
    vehicleCondition,
    productType,
}) {
    const principal = Math.max(0, vehicleValue - downPayment);
    const maxLtv = getStandardMaxLtv(vehicleCondition);
    const ltv = vehicleValue > 0 ? principal / vehicleValue : 0;
    const cappedTenureYears = Math.min(Math.max(Number(tenureYears) || 1, 1), 7);
    const months = cappedTenureYears * 12;
    const monthlyRate = (Number(annualRate) || 0) / 100 / 12;
    const monthlyInstallment = monthlyRate > 0
        ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
        : principal / months;
    const totalPaid = monthlyInstallment * months;

    return {
        productType,
        principal,
        maxLtv,
        ltv,
        isValid: ltv <= maxLtv,
        monthlyInstallment,
        totalInterestPaid: totalPaid - principal,
        principalSettlementDue: 0,
        tenureMonths: months,
        disclaimer: "",
    };
}

export function calculateMoneyDraft({
    vehicleValue,
    downPayment,
    annualRate,
}) {
    const principal = Math.max(0, vehicleValue - downPayment);
    const maxLtv = LTV_RULES.moneyDraft;
    const ltv = vehicleValue > 0 ? principal / vehicleValue : 0;
    const monthlyInstallment = (principal * ((Number(annualRate) || 0) / 100)) / 12;

    return {
        productType: FINANCE_PRODUCTS.MONEY_DRAFT,
        principal,
        maxLtv,
        ltv,
        isValid: ltv <= maxLtv,
        monthlyInstallment,
        totalInterestPaid: monthlyInstallment * 24,
        principalSettlementDue: principal,
        tenureMonths: 24,
        disclaimer: "Monthly payment covers interest only. Full principal must be settled at end of tenure.",
    };
}

export function buildVehicleFinanceComparison({
    vehicleValue,
    downPayment,
    annualRate,
    tenureYears,
    vehicleCondition = VEHICLE_CONDITIONS.USED,
}) {
    const baseInput = {
        vehicleValue,
        downPayment,
        annualRate,
        tenureYears,
        vehicleCondition,
    };

    return [
        calculateStandardAmortization({
            ...baseInput,
            productType: FINANCE_PRODUCTS.LEASING,
        }),
        calculateStandardAmortization({
            ...baseInput,
            productType: FINANCE_PRODUCTS.VEHICLE_LOAN,
        }),
        calculateMoneyDraft(baseInput),
    ];
}

export function getLtvError(result) {
    if (result.isValid) return "";
    return "Loan amount exceeds bank LTV limits. Please increase Down Payment.";
}
