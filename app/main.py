from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.routers import transactions, returns, performance

app = FastAPI(
    title="BlackRock Auto-Saving API",
    description="Automated retirement savings through expense-based micro-investments",
    version="1.0.0",
)


@app.middleware("http")
async def decode_colon_in_path(request: Request, call_next):
    scope = request.scope
    scope["path"] = scope["path"].replace("%3A", ":")
    return await call_next(request)

# Return clean 422 validation errors as JSON
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Invalid request body"},
    )

app.include_router(transactions.router)
app.include_router(returns.router)
app.include_router(performance.router)


@app.get("/")
def health():
    return {"status": "ok"}
