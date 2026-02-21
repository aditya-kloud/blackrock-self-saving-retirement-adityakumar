"""
Period Engine — applies q, p, k rules to a list of transactions.

Processing order (from PLAN.md):
  Step 1: calculate ceiling + remanent
  Step 2: apply q rules  (fixed override — REPLACES remanent)
  Step 3: apply p rules  (extra addition — ADDS to remanent)
  Step 4: group by k periods (flag which transactions fall in each k range)
"""

from app.services.calculator import calculate_ceiling, calculate_remanent, parse_datetime


def is_in_range(dt, start_str, end_str) -> bool:
    """Check if a datetime falls within [start, end] inclusive."""
    start = parse_datetime(start_str)
    end = parse_datetime(end_str)
    return start <= dt <= end


def apply_q_rules(dt, base_remanent: float, q_periods: list) -> float:
    """
    Replace remanent with fixed amount from the matching q period.
    If multiple q periods match: pick the one with the latest start date.
    If same start date: pick the first one in the list (preserve list order).
    """
    matching = []
    for idx, q in enumerate(q_periods):
        if is_in_range(dt, q["start"], q["end"]):
            matching.append((parse_datetime(q["start"]), idx, q["fixed"]))

    if not matching:
        return base_remanent

    # Sort by start date descending (latest first), then by original index ascending
    matching.sort(key=lambda x: (-x[0].timestamp(), x[1]))
    return matching[0][2]


def apply_p_rules(dt, current_remanent: float, p_periods: list) -> float:
    """
    Add extra amounts from ALL matching p periods (they stack).
    Applied after q rules.
    """
    for p in p_periods:
        if is_in_range(dt, p["start"], p["end"]):
            current_remanent += p["extra"]
    return current_remanent


def process_transactions(transactions, q_periods, p_periods, k_periods):
    """
    Full pipeline: validate → q → p → k grouping.
    Returns (valid_list, invalid_list, k_sums).

    valid_list items: {date, amount, ceiling, remanent, inKPeriod}
    k_sums: list of {start, end, amount} matching k_periods order
    """
    valid = []
    invalid = []
    seen_dates = set()

    for txn in transactions:
        date_str = txn["date"]
        amount = txn["amount"]

        # Validation: negative amount
        if amount < 0:
            invalid.append({**txn, "message": "Negative amounts are not allowed"})
            continue

        # Validation: amount too large
        if amount >= 500000:
            invalid.append({**txn, "message": "Amount exceeds maximum allowed value"})
            continue

        # Validation: duplicate timestamp
        if date_str in seen_dates:
            invalid.append({**txn, "message": "Duplicate transaction"})
            continue

        seen_dates.add(date_str)

        # Step 1: ceiling + remanent
        ceiling = calculate_ceiling(amount)
        remanent = calculate_remanent(amount, ceiling)

        # Step 2: apply q rules
        dt = parse_datetime(date_str)
        remanent = apply_q_rules(dt, remanent, q_periods)

        # Step 3: apply p rules
        remanent = apply_p_rules(dt, remanent, p_periods)

        valid.append({
            "date": date_str,
            "amount": amount,
            "ceiling": ceiling,
            "remanent": remanent,
            "dt": dt,  # keep parsed datetime for k-period grouping
        })

    # Step 4: determine inKPeriod flag
    # A transaction is inKPeriod=True if it falls in ANY k period
    in_k_set = set()
    k_sums = []

    for k in k_periods:
        k_total = 0.0
        for txn in valid:
            if is_in_range(txn["dt"], k["start"], k["end"]):
                in_k_set.add(txn["date"])
                k_total += txn["remanent"]
        k_sums.append({
            "start": k["start"],
            "end": k["end"],
            "amount": k_total,
        })

    # Build final valid list with inKPeriod flag, drop internal dt field
    final_valid = []
    for txn in valid:
        final_valid.append({
            "date": txn["date"],
            "amount": txn["amount"],
            "ceiling": txn["ceiling"],
            "remanent": txn["remanent"],
            "inKPeriod": txn["date"] in in_k_set,
        })

    return final_valid, invalid, k_sums
