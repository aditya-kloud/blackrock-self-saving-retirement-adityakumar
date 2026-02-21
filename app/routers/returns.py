from fastapi import APIRouter
from app.models import ReturnsRequest, ReturnsResponse, SavingsByDate
from app.services.period_engine import process_transactions
from app.services.tax import calculate_tax

router = APIRouter(prefix="/blackrock/challenge/v1")

NPS_RATE = 0.0711
INDEX_RATE = 0.1449


def get_investment_years(age: int) -> int:
    """Years until retirement at 60. Minimum 5 if already >= 60."""
    years = 60 - age
    return years if years > 0 else 5


def compound_interest(principal: float, rate: float, years: int) -> float:
    """A = P * (1 + r)^t  (compounded annually, n=1)"""
    return principal * ((1 + rate) ** years)


def inflation_adjust(amount: float, inflation_rate: float, years: int) -> float:
    """Areal = A / (1 + inflation)^t"""
    return amount / ((1 + inflation_rate / 100) ** years)


def calc_nps_tax_benefit(invested: float, annual_income: float) -> float:
    """
    NPS_Deduction = min(invested, 10% of annual_income, 200000)
    Tax_Benefit   = Tax(income) - Tax(income - NPS_Deduction)
    """
    nps_deduction = min(invested, 0.10 * annual_income, 200000)
    tax_benefit = calculate_tax(annual_income) - calculate_tax(annual_income - nps_deduction)
    return round(tax_benefit, 2)


def build_returns_response(payload: ReturnsRequest, rate: float, is_nps: bool) -> ReturnsResponse:
    # Convert pydantic models to dicts for the period engine
    transactions = [{"date": t.date, "amount": t.amount} for t in payload.transactions]
    q_periods = [{"fixed": q.fixed, "start": q.start, "end": q.end} for q in payload.q]
    p_periods = [{"extra": p.extra, "start": p.start, "end": p.end} for p in payload.p]
    k_periods = [{"start": k.start, "end": k.end} for k in payload.k]

    valid_txns, _, k_sums = process_transactions(
        transactions, q_periods, p_periods, k_periods
    )

    # Totals from valid transactions only
    total_amount = sum(t["amount"] for t in valid_txns)
    total_ceiling = sum(t["ceiling"] for t in valid_txns)

    years = get_investment_years(payload.age)
    annual_income = payload.wage * 12

    savings_by_dates = []
    for k in k_sums:
        invested = k["amount"]
        final_value = compound_interest(invested, rate, years)

        # Both NPS and Index: show inflation-adjusted real profit
        real_value = inflation_adjust(final_value, payload.inflation, years)
        profit = round(real_value - invested, 2)

        if is_nps:
            tax_benefit = calc_nps_tax_benefit(invested, annual_income)
        else:
            tax_benefit = 0.0

        savings_by_dates.append(SavingsByDate(
            start=k["start"],
            end=k["end"],
            amount=round(invested, 2),
            profit=profit,
            taxBenefit=tax_benefit,
        ))

    return ReturnsResponse(
        totalTransactionAmount=round(total_amount, 2),
        totalCeiling=round(total_ceiling, 2),
        savingsByDates=savings_by_dates,
    )


# Calculates investment return using NPS (7.11% annually) with tax benefit.

@router.post("/returns:nps", response_model=ReturnsResponse)
def returns_nps(payload: ReturnsRequest):
    return build_returns_response(payload, NPS_RATE, is_nps=True)


# Calculates investment return using NIFTY 50 index fund (14.49% annually).
# No tax benefit.

@router.post("/returns:index", response_model=ReturnsResponse)
def returns_index(payload: ReturnsRequest):
    return build_returns_response(payload, INDEX_RATE, is_nps=False)
