def calculate_tax(income: float) -> float:
    """Calculate tax based on simplified slabs."""
    if income <= 700000:
        return 0.0

    tax = 0.0

    # Above 15L: 30%
    if income > 1500000:
        tax += (income - 1500000) * 0.30
        income = 1500000

    # 12L - 15L: 20%
    if income > 1200000:
        tax += (income - 1200000) * 0.20
        income = 1200000

    # 10L - 12L: 15%
    if income > 1000000:
        tax += (income - 1000000) * 0.15
        income = 1000000

    # 7L - 10L: 10%
    if income > 700000:
        tax += (income - 700000) * 0.10

    return tax
