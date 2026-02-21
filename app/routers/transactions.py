from fastapi import APIRouter
from typing import List
from app.models import (
    Expense, Transaction,
    ValidatorRequest, ValidatorResponse, InvalidTransaction,
    FilterRequest, FilterResponse, FilterTransaction, FilterInvalid,
)
from app.services.calculator import calculate_ceiling, calculate_remanent, parse_datetime
from app.services.period_engine import process_transactions

router = APIRouter(prefix="/blackrock/challenge/v1")


# Receives raw expenses, returns each one enriched with ceiling and remanent.
# ceiling  = next multiple of 100 above the amount
# remanent = ceiling - amount  (this is the "spare change" saved per expense)

@router.post("/transactions:parse", response_model=List[Transaction])
def parse_transactions(expenses: List[Expense]):
    results = []
    for exp in expenses:
        ceiling = calculate_ceiling(exp.amount)
        remanent = calculate_remanent(exp.amount, ceiling)
        results.append(Transaction(
            date=exp.date,
            amount=exp.amount,
            ceiling=ceiling,
            remanent=remanent,
        ))
    return results


# Validates a list of already-parsed transactions (with ceiling and remanent).
# Rules:
#   1. Negative amount      → invalid
#   2. Amount >= 500000     → invalid (exceeds constraint x < 5*10^5)
#   3. Duplicate timestamp  → second occurrence is invalid
#   4. Ceiling mismatch     → invalid (wrong rounding provided)
#   5. Remanent mismatch    → invalid (wrong remainder provided)

@router.post("/transactions:validator", response_model=ValidatorResponse)
def validate_transactions(payload: ValidatorRequest):
    valid = []
    invalid = []
    seen_dates = set()

    for txn in payload.transactions:
        # Rule 1: negative amount
        if txn.amount < 0:
            invalid.append(InvalidTransaction(
                date=txn.date, amount=txn.amount,
                ceiling=txn.ceiling, remanent=txn.remanent,
                message="Negative amounts are not allowed",
            ))
            continue

        # Rule 2: amount too large
        if txn.amount >= 500000:
            invalid.append(InvalidTransaction(
                date=txn.date, amount=txn.amount,
                ceiling=txn.ceiling, remanent=txn.remanent,
                message="Amount exceeds maximum allowed value",
            ))
            continue

        # Rule 3: duplicate timestamp
        if txn.date in seen_dates:
            invalid.append(InvalidTransaction(
                date=txn.date, amount=txn.amount,
                ceiling=txn.ceiling, remanent=txn.remanent,
                message="Duplicate transaction",
            ))
            continue

        # Rule 4 & 5: verify ceiling and remanent are correct
        expected_ceiling = calculate_ceiling(txn.amount)
        expected_remanent = calculate_remanent(txn.amount, expected_ceiling)

        if txn.ceiling != expected_ceiling:
            invalid.append(InvalidTransaction(
                date=txn.date, amount=txn.amount,
                ceiling=txn.ceiling, remanent=txn.remanent,
                message=f"Invalid ceiling: expected {expected_ceiling}",
            ))
            continue

        if txn.remanent != expected_remanent:
            invalid.append(InvalidTransaction(
                date=txn.date, amount=txn.amount,
                ceiling=txn.ceiling, remanent=txn.remanent,
                message=f"Invalid remanent: expected {expected_remanent}",
            ))
            continue

        seen_dates.add(txn.date)
        valid.append(txn)

    return ValidatorResponse(valid=valid, invalid=invalid)


# Applies q (fixed override), p (extra addition), k (grouping) rules.
# Returns valid transactions with inKPeriod flag, and invalid ones with reason.

@router.post("/transactions:filter", response_model=FilterResponse)
def filter_transactions(payload: FilterRequest):
    # Convert Pydantic models to plain dicts for the period engine
    transactions = [{"date": t.date, "amount": t.amount} for t in payload.transactions]
    q_periods = [{"fixed": q.fixed, "start": q.start, "end": q.end} for q in payload.q]
    p_periods = [{"extra": p.extra, "start": p.start, "end": p.end} for p in payload.p]
    k_periods = [{"start": k.start, "end": k.end} for k in payload.k]

    valid_txns, invalid_txns, _ = process_transactions(
        transactions, q_periods, p_periods, k_periods
    )

    valid_out = [FilterTransaction(**t) for t in valid_txns]
    invalid_out = [FilterInvalid(
        date=t["date"], amount=t["amount"], message=t["message"]
    ) for t in invalid_txns]

    return FilterResponse(valid=valid_out, invalid=invalid_out)
