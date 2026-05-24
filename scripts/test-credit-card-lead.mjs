/**
 * Unit tests for credit card lead validation (run: node scripts/test-credit-card-lead.mjs)
 */

import assert from "node:assert/strict"
import {
  MAX_LEAD_PDF_BYTES,
  normalizeAadhar,
  normalizePan,
  validateCreditCardLeadInput,
  validateLeadFile,
} from "../lib/credit-card-lead.ts"

function testNormalizeAadhar() {
  assert.equal(normalizeAadhar("1234 5678 9012"), "123456789012")
  assert.equal(normalizeAadhar("123456789012345"), "123456789012")
}

function testNormalizePan() {
  assert.equal(normalizePan("abcde1234f"), "ABCDE1234F")
}

function testValidEmployedLead() {
  const result = validateCreditCardLeadInput({
    full_name: "Hunny Kathuria",
    aadhar_number: "123456789012",
    pan_number: "ABCDE1234F",
    monthly_in_hand_salary: "85000",
    employment_type: "employed",
    employer_name: "Adobe",
    self_employed_description: "",
  })
  assert.ok(result.payload)
  assert.equal(result.payload.monthly_in_hand_salary, 85000)
  assert.equal(Object.keys(result.errors).length, 0)
}

function testValidSelfEmployedLead() {
  const result = validateCreditCardLeadInput({
    full_name: "Test User",
    aadhar_number: "987654321098",
    pan_number: "FGHIJ5678K",
    monthly_in_hand_salary: "120000",
    employment_type: "self_employed",
    employer_name: "",
    self_employed_description: "Freelance consultant",
  })
  assert.ok(result.payload)
  assert.equal(result.payload.employment_type, "self_employed")
}

function testInvalidPanAndAadhar() {
  const result = validateCreditCardLeadInput({
    full_name: "",
    aadhar_number: "123",
    pan_number: "BAD",
    monthly_in_hand_salary: "0",
    employment_type: "",
    employer_name: "",
    self_employed_description: "",
  })
  assert.equal(result.payload, undefined)
  assert.ok(result.errors.full_name)
  assert.ok(result.errors.aadhar_number)
  assert.ok(result.errors.pan_number)
  assert.ok(result.errors.monthly_in_hand_salary)
  assert.ok(result.errors.employment_type)
}

function testPdfSizeLimit() {
  const bigPdf = new File(
    [new Uint8Array(MAX_LEAD_PDF_BYTES + 1)],
    "aadhar.pdf",
    { type: "application/pdf" }
  )
  assert.match(validateLeadFile(bigPdf), /2MB/)

  const okPdf = new File([new Uint8Array(1024)], "aadhar.pdf", {
    type: "application/pdf",
  })
  assert.equal(validateLeadFile(okPdf), null)
}

function testEmployedRequiresEmployer() {
  const result = validateCreditCardLeadInput({
    full_name: "Test",
    aadhar_number: "123456789012",
    pan_number: "ABCDE1234F",
    monthly_in_hand_salary: "50000",
    employment_type: "employed",
    employer_name: "",
    self_employed_description: "",
  })
  assert.ok(result.errors.employer_name)
}

const tests = [
  testNormalizeAadhar,
  testNormalizePan,
  testValidEmployedLead,
  testValidSelfEmployedLead,
  testInvalidPanAndAadhar,
  testPdfSizeLimit,
  testEmployedRequiresEmployer,
]

let passed = 0
for (const test of tests) {
  test()
  passed += 1
  console.log(`✓ ${test.name}`)
}

console.log(`\n${passed}/${tests.length} validation tests passed.`)
