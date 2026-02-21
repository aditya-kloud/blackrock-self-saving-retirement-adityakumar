import axios from 'axios'

const BASE_URL = 'http://localhost:5477/blackrock/challenge/v1'

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export async function checkHealth() {
  const res = await client.get('/performance')
  return res.data
}

export async function parseTransactions(expenses) {
  const res = await client.post('/transactions:parse', expenses)
  return res.data
}

export async function validateTransactions(wage, transactions) {
  const res = await client.post('/transactions:validator', { wage, transactions })
  return res.data
}

export async function filterTransactions(wage, transactions, q = [], p = [], k = []) {
  const res = await client.post('/transactions:filter', { wage, transactions, q, p, k })
  return res.data
}

export async function npsReturns(age, wage, inflation, transactions, q = [], p = [], k = []) {
  const res = await client.post('/returns:nps', { age, wage, inflation, transactions, q, p, k })
  return res.data
}

export async function indexReturns(age, wage, inflation, transactions, q = [], p = [], k = []) {
  const res = await client.post('/returns:index', { age, wage, inflation, transactions, q, p, k })
  return res.data
}
