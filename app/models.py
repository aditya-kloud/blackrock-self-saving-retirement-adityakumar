from pydantic import BaseModel
from typing import List, Optional


class Expense(BaseModel):
    date: str
    amount: float


class Transaction(BaseModel):
    date: str
    amount: float
    ceiling: float
    remanent: float

class ValidatorRequest(BaseModel):
    wage: float
    transactions: List[Transaction]


class InvalidTransaction(BaseModel):
    date: str
    amount: float
    ceiling: Optional[float] = None
    remanent: Optional[float] = None
    message: str


class ValidatorResponse(BaseModel):
    valid: List[Transaction]
    invalid: List[InvalidTransaction]


class QPeriod(BaseModel):
    fixed: float
    start: str
    end: str


class PPeriod(BaseModel):
    extra: float
    start: str
    end: str


class KPeriod(BaseModel):
    start: str
    end: str


class FilterRequest(BaseModel):
    q: List[QPeriod] = []
    p: List[PPeriod] = []
    k: List[KPeriod] = []
    wage: float
    transactions: List[Expense]


class FilterTransaction(BaseModel):
    date: str
    amount: float
    ceiling: float
    remanent: float
    inKPeriod: bool


class FilterInvalid(BaseModel):
    date: str
    amount: float
    message: str


class FilterResponse(BaseModel):
    valid: List[FilterTransaction]
    invalid: List[FilterInvalid]


class ReturnsRequest(BaseModel):
    age: int
    wage: float
    inflation: float
    q: List[QPeriod] = []
    p: List[PPeriod] = []
    k: List[KPeriod] = []
    transactions: List[Expense]


class SavingsByDate(BaseModel):
    start: str
    end: str
    amount: float
    profit: float
    taxBenefit: float


class ReturnsResponse(BaseModel):
    totalTransactionAmount: float
    totalCeiling: float
    savingsByDates: List[SavingsByDate]


class PerformanceResponse(BaseModel):
    time: str
    memory: str
    threads: int
