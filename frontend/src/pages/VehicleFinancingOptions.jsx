import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getCurrentUser } from "../utils/auth";
import { supabase } from "../utils/supabaseClient";
import logoUrl from "../assets/logo/autovaluelk-logo-pdf.png";
import AppModal from "../components/AppModal";
import {
    FINANCE_PRODUCTS,
    VEHICLE_CONDITIONS,
    buildVehicleFinanceComparison,
    formatLkr,
    getLtvError,
} from "../utils/vehicleFinanceEngine";
import {
    AlertTriangle,
    ArrowLeft,
    BarChart2,
    Check,
    CheckCircle,
    CreditCard,
    Download,
    FileText,
    Landmark,
    Shield,
    Table,
    Tag,
    Wallet,
} from "lucide-react";

function VehicleFinancingOptions() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const predictedPrice = location.state?.predictedPrice || 3450000;
    const vehicle = location.state?.vehicle || null;
    const formattedPrice = predictedPrice.toLocaleString("en-LK");

    const [financingType, setFinancingType] = useState("loan");
    const [institutions, setInstitutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [tenure, setTenure] = useState(36);
    const [vehicleCondition, setVehicleCondition] = useState(
        String(vehicle?.condition || "").toLowerCase().includes("new")
            ? VEHICLE_CONDITIONS.BRAND_NEW
            : VEHICLE_CONDITIONS.USED
    );
    const [downloading, setDownloading] = useState(false);
    const [dialog, setDialog] = useState(null);

    useEffect(() => {
        fetchInstitutions();
    }, []);

    const fetchInstitutions = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("financing_options")
                .select("*")
                .eq("status", "Active");

            if (error) throw error;

            const mappedData = data.map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
                interestRate: item.fixed_rate || item.floating_rate || 0,
                maxTenure: item.type === "Draft" ? 24 : 84,
                minDownPayment: item.max_ltv ? (100 - item.max_ltv) : 20,
                logo: item.logo_url || null,
                color: ["blue", "cyan", "emerald", "amber", "rose", "purple"][Math.floor(Math.random() * 6)],
            }));

            setInstitutions(mappedData);
        } catch (error) {
            console.error("Error fetching financing options:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const downPayment = Math.round(predictedPrice * (downPaymentPercent / 100));
    const loanAmount = predictedPrice - downPayment;
    const interestRate = selectedInstitution?.interestRate || 8.5;
    const monthlyRate = interestRate / 100 / 12;
    const emi = financingType === "draft"
        ? Math.round((loanAmount * (interestRate / 100)) / 12)
        : monthlyRate > 0
            ? Math.round(
                (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                (Math.pow(1 + monthlyRate, tenure) - 1)
            )
            : Math.round(loanAmount / tenure);
    const totalPayable = financingType === "draft" ? (emi * tenure) + loanAmount : emi * tenure;
    const totalInterest = totalPayable - loanAmount;

    const filteredInstitutions = institutions.filter((inst) => {
        if (financingType === "loan") return inst.type === "Personal Loan" || inst.type === "Bank" || inst.type === "Loan";
        if (financingType === "leasing") return inst.type === "Leasing";
        if (financingType === "draft") return inst.type === "Draft";
        return false;
    });

    const getInitials = (name) => String(name || "NA")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "NA";

    const financingTypeCards = [
        {
            id: "loan",
            title: t("financing_page.vehicle_loan"),
            subtitle: t("financing_page.vehicle_loan_subtitle"),
            icon: CreditCard,
        },
        {
            id: "leasing",
            title: t("financing_page.vehicle_leasing"),
            subtitle: t("financing_page.vehicle_leasing_subtitle"),
            icon: FileText,
        },
        {
            id: "draft",
            title: t("financing_page.vehicle_draft"),
            subtitle: t("financing_page.vehicle_draft_subtitle"),
            icon: Shield,
        },
    ];

    const financingTypeLabel = financingType === "loan"
        ? t("financing_page.vehicle_loan")
        : financingType === "leasing"
            ? t("financing_page.vehicle_leasing")
            : t("financing_page.vehicle_draft");

    const selectedProductType = financingType === "draft"
        ? FINANCE_PRODUCTS.MONEY_DRAFT
        : financingType === "leasing"
            ? FINANCE_PRODUCTS.LEASING
            : FINANCE_PRODUCTS.VEHICLE_LOAN;

    const financeComparison = buildVehicleFinanceComparison({
        vehicleValue: predictedPrice,
        downPayment,
        annualRate: interestRate,
        tenureYears: tenure / 12,
        vehicleCondition,
    });

    const selectedFinanceResult = financeComparison.find((item) => item.productType === selectedProductType);
    const selectedLtvError = selectedFinanceResult ? getLtvError(selectedFinanceResult) : "";
    const productLabels = {
        [FINANCE_PRODUCTS.LEASING]: t("financing_page.vehicle_leasing"),
        [FINANCE_PRODUCTS.VEHICLE_LOAN]: t("financing_page.vehicle_loan"),
        [FINANCE_PRODUCTS.MONEY_DRAFT]: t("financing_page.money_draft"),
    };

    const comparisonRows = filteredInstitutions.map((inst) => {
        const instMonthlyRate = inst.interestRate / 100 / 12;
        const actualDownPayment = Math.max(downPaymentPercent, inst.minDownPayment);
        const instLoan = predictedPrice * (1 - actualDownPayment / 100);
        const actualTenure = Math.min(tenure, inst.maxTenure);
        const instEmi = financingType === "draft"
            ? Math.round((instLoan * (inst.interestRate / 100)) / 12)
            : instMonthlyRate > 0
                ? Math.round(
                    (instLoan * instMonthlyRate * Math.pow(1 + instMonthlyRate, actualTenure)) /
                    (Math.pow(1 + instMonthlyRate, actualTenure) - 1)
                )
                : Math.round(instLoan / actualTenure);

        return {
            inst,
            actualDownPayment,
            actualTenure,
            instEmi,
        };
    });

    const progressSteps = [
        { label: t("financing_page.progress_choose_type"), state: financingType ? "complete" : "active" },
        { label: t("financing_page.progress_select_institution"), state: selectedInstitution ? "complete" : financingType ? "active" : "upcoming" },
        { label: t("financing_page.progress_review_plan"), state: selectedInstitution ? "active" : "upcoming" },
    ];

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            await new Promise((r) => setTimeout(r, 600));

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const user = await getCurrentUser();
            const userEmail = user ? (user.username || user.email) : "Guest User";

            const logoImg = new Image();
            logoImg.src = logoUrl;

            await new Promise((resolve) => {
                if (logoImg.complete) resolve();
                else {
                    logoImg.onload = resolve;
                    logoImg.onerror = resolve;
                }
            });

            if (logoImg.complete && logoImg.naturalWidth > 0) {
                doc.addImage(logoImg, "PNG", pageWidth / 2 - 15, 10, 30, 30);
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42);
            doc.text("AutoValueLK", pageWidth / 2, 48, { align: "center" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(14);
            doc.setTextColor(100, 116, 139);
            doc.text("Vehicle Financing Report", pageWidth / 2, 56, { align: "center" });

            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 70);
            doc.text(`Requested By: ${userEmail}`, 14, 76);

            autoTable(doc, {
                startY: 85,
                theme: "grid",
                headStyles: { fillColor: [59, 130, 246] },
                head: [["Vehicle Details", "Information"]],
                body: [
                    ["Brand & Model", vehicle ? `${vehicle.brand} ${vehicle.model}` : "N/A"],
                    ["Manufacture Year", vehicle?.year || "N/A"],
                    ["Predicted Price", `LKR ${formattedPrice}`],
                ],
            });

            let currentY = doc.lastAutoTable.finalY + 15;

            if (selectedInstitution) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(16);
                doc.setTextColor(15, 23, 42);
                doc.text("Selected Financing Plan", 14, currentY);

                autoTable(doc, {
                    startY: currentY + 8,
                    theme: "striped",
                    headStyles: { fillColor: [16, 185, 129] },
                    head: [["Detail", "Value"]],
                    body: [
                        ["Financing Type", financingTypeLabel],
                        ["Institution", selectedInstitution.name],
                        ["Interest Rate", `${interestRate}%`],
                        ["Down Payment", `LKR ${downPayment.toLocaleString("en-LK")} (${downPaymentPercent}%)`],
                        ["Loan Amount", `LKR ${loanAmount.toLocaleString("en-LK")}`],
                        ["Tenure", `${tenure} months`],
                        ["Monthly Installment", `LKR ${emi.toLocaleString("en-LK")}`],
                        ["Total Payable", `LKR ${totalPayable.toLocaleString("en-LK")}`],
                        ["Total Interest Payable", `LKR ${totalInterest.toLocaleString("en-LK")}`],
                    ],
                });

                currentY = doc.lastAutoTable.finalY + 15;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42);
            doc.text(`Other ${financingType === "loan" ? "Banks" : financingType === "leasing" ? "Leasing Companies" : "Draft Providers"} Compared`, 14, currentY);

            const comparisonData = comparisonRows.map(({ inst, actualTenure, instEmi }) => ([
                inst.name,
                `${inst.interestRate}%`,
                `${actualTenure} months`,
                `${inst.minDownPayment}%`,
                `LKR ${instEmi.toLocaleString("en-LK")}`,
            ]));

            autoTable(doc, {
                startY: currentY + 8,
                theme: "striped",
                headStyles: { fillColor: [15, 23, 42] },
                head: [["Institution", "Rate", "Tenure", "Min Down", "Est. Monthly"]],
                body: comparisonData,
            });

            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    "Copyright 2026 AutoValueLK. All rights reserved. This report is machine-generated.",
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: "center" }
                );
            }

            doc.save(`AutoValueLK_Financing_${vehicle?.brand || "Report"}_${vehicle?.model || ""}.pdf`);
        } catch (err) {
            console.error("PDF generation failed", err);
            setDialog({
                title: "PDF generation failed",
                message: "Failed to generate the financing PDF report. Please try again.",
            });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="financing-page">
            <AppModal
                isOpen={Boolean(dialog)}
                tone="warning"
                eyebrow="Financing"
                title={dialog?.title || ""}
                message={dialog?.message || ""}
                confirmLabel="OK"
                onConfirm={() => setDialog(null)}
            />

            {!vehicle && (
                <div className="financing-warning animate-fade-in">
                    <AlertTriangle className="financing-warning-icon" />
                    <div>
                        <p>{t("financing_page.sample_title")}</p>
                        <span>
                            Go to{" "}
                            <button type="button" onClick={() => navigate("/price-check")}>{t("price_check")}</button>
                            {" "}to get a personalized prediction
                        </span>
                    </div>
                    <button
                        type="button"
                        className="financing-warning-cta"
                        onClick={() => navigate("/price-check")}
                    >
                        Go to Price Check &rarr;
                    </button>
                </div>
            )}

            <header className="financing-hero animate-fade-in">
                <div className="financing-hero-copy">
                    <div className="financing-eyebrow">{t("financing_page.eyebrow")}</div>
                    <h1>{t("financing_page.title")}</h1>
                    <p>{t("financing_page.subtitle")}</p>
                </div>
                <div className="financing-hero-stats">
                    <article className="financing-stat-pill">
                        <Tag className="financing-stat-icon financing-stat-icon--blue" />
                        <span>
                            <strong className="financing-stat-value--blue">LKR {formattedPrice}</strong>
                            <em>{t("financing_page.predicted_price")}</em>
                        </span>
                    </article>
                    <article className="financing-stat-pill">
                        <Wallet className="financing-stat-icon financing-stat-icon--amber" />
                        <span>
                            <strong>LKR {downPayment.toLocaleString("en-LK")}</strong>
                            <em>{t("financing_page.down_payment_percent", { percent: downPaymentPercent })}</em>
                        </span>
                    </article>
                    <article className="financing-stat-pill">
                        <Landmark className="financing-stat-icon financing-stat-icon--green" />
                        <span>
                            <strong>LKR {loanAmount.toLocaleString("en-LK")}</strong>
                            <em>{t("financing_page.loan_amount")}</em>
                        </span>
                    </article>
                </div>
            </header>

            <section className="financing-progress" aria-label={t("financing_page.steps_aria")}>
                {progressSteps.map((step, index) => (
                    <div className="financing-progress-item" key={step.label}>
                        <div className={`financing-progress-step is-${step.state}`}>
                            <span className="financing-progress-circle">
                                {step.state === "complete" ? <Check className="h-[13px] w-[13px]" /> : index + 1}
                            </span>
                            <span className="financing-progress-label">{step.label}</span>
                        </div>
                        {index < progressSteps.length - 1 && (
                            <span className={`financing-progress-line ${progressSteps[index + 1].state !== "upcoming" ? "is-complete" : ""}`} />
                        )}
                    </div>
                ))}
            </section>

            <section className="financing-step-panel animate-fade-in animate-delay-100">
                <div className="financing-step-label">
                    <span className="financing-step-badge">1</span>
                    <div className="financing-step-copy">
                        <h2>{t("financing_page.choose_type_title")}</h2>
                        <p>{t("financing_page.choose_type_subtitle")}</p>
                    </div>
                </div>
                <div className="financing-type-grid">
                    {financingTypeCards.map((type) => {
                        const Icon = type.icon;
                        const isSelected = financingType === type.id;
                        return (
                            <button
                                type="button"
                                key={type.id}
                                onClick={() => {
                                    setFinancingType(type.id);
                                    setSelectedInstitution(null);
                                    if (type.id === "draft") setTenure(24);
                                }}
                                className={`financing-type-card ${isSelected ? "is-selected" : ""}`}
                            >
                                <span className="financing-type-icon"><Icon className="h-[17px] w-[17px]" /></span>
                                <strong>{type.title}</strong>
                                <p>{type.subtitle}</p>
                                {isSelected && (
                                    <span className="financing-selected-row">
                                        <CheckCircle className="h-3 w-3" />
                                        {t("financing_page.selected")}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="financing-step-panel animate-fade-in animate-delay-200">
                <div className="financing-step-label">
                    <span className={`financing-step-badge ${selectedInstitution ? "is-complete" : ""}`}>
                        {selectedInstitution ? <Check className="h-[13px] w-[13px]" /> : "2"}
                    </span>
                    <div className="financing-step-copy">
                        <h2>{t("financing_page.select_institution_title")}</h2>
                        <p>{t("financing_page.select_institution_subtitle")}</p>
                    </div>
                </div>

                {!financingType ? (
                    <div className="financing-empty">{t("financing_page.select_type_first")}</div>
                ) : isLoading ? (
                    <div className="financing-empty">{t("financing_page.fetching_rates")}</div>
                ) : filteredInstitutions.length === 0 ? (
                    <div className="financing-empty">{t("financing_page.no_options")}</div>
                ) : (
                    <div className="financing-bank-grid">
                        {filteredInstitutions.map((inst) => {
                            const isSelected = selectedInstitution?.id === inst.id;
                            return (
                                <button
                                    type="button"
                                    key={inst.id}
                                    onClick={() => {
                                        setSelectedInstitution(inst);
                                        setTenure(financingType === "draft" ? 24 : Math.min(tenure, inst.maxTenure));
                                    }}
                                    className={`financing-bank-card ${isSelected ? "is-selected" : ""}`}
                                >
                                    <div className="financing-bank-top">
                                        <span className="financing-bank-avatar">
                                            {inst.logo ? <img src={inst.logo} alt="" /> : getInitials(inst.name)}
                                        </span>
                                        <span>
                                            <strong>{inst.name}</strong>
                                            <em>{inst.type}</em>
                                        </span>
                                    </div>
                                    <div className="financing-bank-divider" />
                                    <div className="financing-bank-bottom">
                                        <span>
                                            <em>{t("financing_page.interest_rate")}</em>
                                            <strong>{inst.interestRate}%</strong>
                                        </span>
                                        <span>
                                            <em>{t("financing_page.max_tenure")}</em>
                                            <strong>{t("financing_page.months", { count: inst.maxTenure })}</strong>
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className={`financing-step-panel animate-fade-in animate-delay-300 ${selectedInstitution ? "" : "is-disabled"}`}>
                <div className="financing-step-label">
                    <span className={`financing-step-badge ${selectedInstitution ? "" : "is-upcoming"}`}>3</span>
                    <div className="financing-step-copy">
                        <h2>{t("financing_page.review_title")}</h2>
                        <p>{t("financing_page.review_subtitle")}</p>
                    </div>
                </div>

                {!selectedInstitution ? (
                    <div className="financing-empty">{t("financing_page.select_institution_first")}</div>
                ) : (
                    <>
                    <article className="financing-adjustments">
                        <div className="financing-plan-header">
                            <Wallet className="h-[14px] w-[14px]" />
                            <strong>{t("financing_page.adjust_estimate")}</strong>
                        </div>
                        <div className="financing-adjustment-grid">
                            <div className="financing-condition-field">
                                <strong>{t("financing_page.vehicle_condition")}</strong>
                                <div className="financing-condition-toggle">
                                    <button
                                        type="button"
                                        className={vehicleCondition === VEHICLE_CONDITIONS.BRAND_NEW ? "is-active" : ""}
                                        onClick={() => setVehicleCondition(VEHICLE_CONDITIONS.BRAND_NEW)}
                                    >
                                        {t("price_check_page.options.brand_new")}
                                    </button>
                                    <button
                                        type="button"
                                        className={vehicleCondition === VEHICLE_CONDITIONS.USED ? "is-active" : ""}
                                        onClick={() => setVehicleCondition(VEHICLE_CONDITIONS.USED)}
                                    >
                                        {t("price_check_page.options.used")}
                                    </button>
                                </div>
                            </div>
                            <label className="financing-slider-field">
                                <span>
                                    <strong>{t("financing_page.down_payment")}</strong>
                                    <em>{downPaymentPercent}% · LKR {downPayment.toLocaleString("en-LK")}</em>
                                </span>
                                <input
                                    type="range"
                                    min={selectedInstitution.minDownPayment}
                                    max="70"
                                    value={downPaymentPercent}
                                    onChange={(event) => setDownPaymentPercent(Number(event.target.value))}
                                />
                                <small>
                                    <span>{selectedInstitution.minDownPayment}%</span>
                                    <span>70%</span>
                                </small>
                            </label>
                            <label className="financing-slider-field">
                                <span>
                                    <strong>{t("financing_page.loan_tenure")}</strong>
                                    <em>{t("financing_page.months", { count: tenure })} · {t("results_page.years", { count: Number((tenure / 12).toFixed(1)) })}</em>
                                </span>
                                <input
                                    type="range"
                                    min="12"
                                    max={selectedInstitution.maxTenure}
                                    step="6"
                                    value={tenure}
                                    disabled={financingType === "draft"}
                                    onChange={(event) => setTenure(Number(event.target.value))}
                                />
                                <small>
                                    <span>{t("financing_page.months", { count: 12 })}</span>
                                    <span>{t("financing_page.months", { count: selectedInstitution.maxTenure })}</span>
                                </small>
                            </label>
                        </div>
                        {selectedLtvError && (
                            <div className="financing-ltv-error">
                                <AlertTriangle className="h-[14px] w-[14px]" />
                                {selectedLtvError}
                            </div>
                        )}
                    </article>

                    <div className="financing-plan-grid">
                        <article className="financing-selected-plan">
                            <div className="financing-plan-header">
                                <CheckCircle className="h-[14px] w-[14px]" />
                                <strong>{t("financing_page.selected_plan")}</strong>
                            </div>
                            <dl className="financing-plan-details">
                                <div><dt>{t("financing_page.institution")}</dt><dd>{selectedInstitution.name}</dd></div>
                                <div><dt>{t("financing_page.type")}</dt><dd>{financingTypeLabel}</dd></div>
                                <div><dt>{t("financing_page.interest_rate")}</dt><dd>{interestRate}%</dd></div>
                                <div><dt>{t("financing_page.max_tenure")}</dt><dd>{t("financing_page.months", { count: selectedInstitution.maxTenure })}</dd></div>
                                <div><dt>{t("financing_page.min_down")}</dt><dd>{selectedInstitution.minDownPayment}%</dd></div>
                                <div><dt>{t("financing_page.ltv")}</dt><dd>{selectedFinanceResult ? `${Math.round(selectedFinanceResult.ltv * 100)}% / ${Math.round(selectedFinanceResult.maxLtv * 100)}%` : "N/A"}</dd></div>
                                <div><dt>{t("financing_page.loan_value")}</dt><dd>LKR {loanAmount.toLocaleString("en-LK")}</dd></div>
                            </dl>
                            <div className="financing-plan-monthly">
                                <span>{t("financing_page.est_monthly_payment")}</span>
                                <strong>LKR {emi.toLocaleString("en-LK")}</strong>
                                <em>{t("financing_page.for_months", { count: tenure })}</em>
                            </div>
                        </article>

                        <article className="financing-mini-compare">
                            <div className="financing-mini-header">
                                <BarChart2 className="h-[14px] w-[14px]" />
                                <strong>{t("financing_page.compare_options")}</strong>
                            </div>
                            <table className="financing-mini-table">
                                <thead>
                                    <tr>
                                        <th>{t("financing_page.institution")}</th>
                                        <th>{t("financing_page.rate")}</th>
                                        <th>{t("financing_page.monthly")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.slice(0, 5).map(({ inst, instEmi }) => (
                                        <tr key={inst.id} className={selectedInstitution?.id === inst.id ? "is-selected" : ""}>
                                            <td>{inst.name}</td>
                                            <td><span className="financing-rate-pill">{inst.interestRate}%</span></td>
                                            <td>LKR {instEmi.toLocaleString("en-LK")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </article>
                    </div>
                    <article className="financing-financial-comparison">
                        <div className="financing-mini-header">
                            <Table className="h-[14px] w-[14px]" />
                            <strong>{t("financing_page.financial_comparison")}</strong>
                        </div>
                        <div className="financing-financial-table-shell">
                            <table className="financing-financial-table">
                                <thead>
                                    <tr>
                                        <th>{t("financing_page.product_type")}</th>
                                        <th>{t("financing_page.monthly_installment")}</th>
                                        <th>{t("financing_page.total_interest_paid")}</th>
                                        <th>{t("financing_page.principal_settlement_due")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {financeComparison.map((result) => (
                                        <tr
                                            key={result.productType}
                                            className={`${result.productType === selectedProductType ? "is-selected" : ""} ${result.isValid ? "" : "is-invalid"}`}
                                        >
                                            <td>
                                                <strong>{productLabels[result.productType]}</strong>
                                                <span>{Math.round(result.ltv * 100)}% LTV / {Math.round(result.maxLtv * 100)}% max</span>
                                            </td>
                                            <td>{formatLkr(result.monthlyInstallment)}</td>
                                            <td>{formatLkr(result.totalInterestPaid)}</td>
                                            <td>{result.principalSettlementDue > 0 ? formatLkr(result.principalSettlementDue) : t("financing_page.none")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="financing-draft-disclaimer">
                            {t("financing_page.draft_disclaimer")}
                        </p>
                    </article>
                    </>
                )}
            </section>

            <section className="financing-comparison animate-fade-in animate-delay-400">
                <div className="financing-comparison-heading">
                    <div className="financing-section-title">
                        <Table className="h-[14px] w-[14px]" />
                        <h2>{t("financing_page.full_comparison")}</h2>
                    </div>
                    <div className="financing-toggle-pills">
                        <button
                            type="button"
                            onClick={() => { setFinancingType("loan"); setSelectedInstitution(null); }}
                            className={financingType === "loan" ? "is-active" : ""}
                        >
                            Banks
                        </button>
                        <button
                            type="button"
                            onClick={() => { setFinancingType("leasing"); setSelectedInstitution(null); }}
                            className={financingType === "leasing" ? "is-active" : ""}
                        >
                            Leasing
                        </button>
                    </div>
                </div>

                <div className="financing-table-shell">
                    {isLoading ? (
                        <div className="financing-empty">{t("financing_page.loading_comparison")}</div>
                    ) : filteredInstitutions.length === 0 ? (
                        <div className="financing-empty">{t("financing_page.no_comparison")}</div>
                    ) : (
                        <table className="financing-table">
                            <thead>
                                <tr>
                                    <th>{t("financing_page.institution")}</th>
                                    <th>{t("financing_page.rate")}</th>
                                    <th>{t("financing_page.max_tenure")}</th>
                                    <th>{t("financing_page.min_down")}</th>
                                    <th>{t("financing_page.est_monthly")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.map(({ inst, actualTenure, instEmi }) => {
                                    const isSelected = selectedInstitution?.id === inst.id;
                                    return (
                                        <tr
                                            key={inst.id}
                                            className={isSelected ? "is-selected" : ""}
                                            onClick={() => {
                                                setSelectedInstitution(inst);
                                                setTenure(financingType === "draft" ? 24 : Math.min(tenure, inst.maxTenure));
                                            }}
                                        >
                                            <td>
                                                <div className="financing-table-institution">
                                                    <span>{inst.logo ? <img src={inst.logo} alt="" /> : getInitials(inst.name)}</span>
                                                    <div>
                                                        <strong>{inst.name}</strong>
                                                        <em>{inst.type}</em>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="financing-rate-pill">{inst.interestRate}%</span></td>
                                            <td>{t("financing_page.months", { count: inst.maxTenure })}</td>
                                            <td>{inst.minDownPayment}%</td>
                                            <td>
                                                <strong className="financing-monthly">LKR {instEmi.toLocaleString("en-LK")}</strong>
                                                <p>{t("financing_page.for_months", { count: actualTenure })}</p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    <div className="financing-footnote">
                        {t("financing_page.footnote", { percent: downPaymentPercent, count: tenure })}
                    </div>
                </div>
            </section>

            <div className="financing-actions animate-fade-in animate-delay-500">
                <button
                    type="button"
                    onClick={() => navigate("/results", { state: { vehicle, predictedPrice } })}
                    className="financing-ghost-button financing-action-back"
                >
                    <ArrowLeft className="h-[14px] w-[14px]" />
                    Back to Results
                </button>
                <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={downloading || institutions.length === 0}
                    className="financing-primary-button"
                >
                    <Download className="h-[14px] w-[14px]" />
                    {downloading ? t("financing_page.generating_report") : t("financing_page.download_report")}
                </button>
            </div>
        </div>
    );
}

export default VehicleFinancingOptions;
