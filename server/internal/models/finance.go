package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

// ─────────────────────────────────────────────────────────────────────────────
// LEDGER ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type LedgerTransactionType string

const (
	LedgerTransactionTypeMilestone    LedgerTransactionType = "milestone_payment"
	LedgerTransactionTypeSubscription LedgerTransactionType = "subscription_charge"
	LedgerTransactionTypeRefund       LedgerTransactionType = "refund"
)

func (t LedgerTransactionType) IsValid() bool {
	switch t {
	case LedgerTransactionTypeMilestone, LedgerTransactionTypeSubscription, LedgerTransactionTypeRefund:
		return true
	}
	return false
}

type LedgerStatus string

const (
	LedgerStatusProcessing LedgerStatus = "processing"
	LedgerStatusCompleted  LedgerStatus = "completed"
	LedgerStatusFailed     LedgerStatus = "failed"
	LedgerStatusRefunded   LedgerStatus = "refunded"
)

func (s LedgerStatus) IsValid() bool {
	switch s {
	case LedgerStatusProcessing, LedgerStatusCompleted, LedgerStatusFailed, LedgerStatusRefunded:
		return true
	}
	return false
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS LEDGER
// ─────────────────────────────────────────────────────────────────────────────

type PaymentsLedger struct {
	ID uuid.UUID `db:"id" json:"id"`

	ClientID uuid.UUID `db:"client_id" json:"client_id"`

	ProjectID      pgtype.UUID `db:"project_id"      json:"project_id"`
	MilestoneID    pgtype.UUID `db:"milestone_id"    json:"milestone_id"`
	SubscriptionID pgtype.UUID `db:"subscription_id" json:"subscription_id"`

	PaddleTransactionID string      `db:"paddle_transaction_id" json:"paddle_transaction_id"`
	PaddleCustomerID    pgtype.Text `db:"paddle_customer_id"    json:"paddle_customer_id"`

	Amount    decimal.Decimal `db:"amount"     json:"amount"`
	FeeAmount decimal.Decimal `db:"fee_amount" json:"fee_amount"`
	NetAmount decimal.Decimal `db:"net_amount" json:"net_amount"`
	Currency  string          `db:"currency"   json:"currency"`

	TransactionType LedgerTransactionType `db:"transaction_type" json:"transaction_type"`
	Status          LedgerStatus          `db:"status"           json:"status"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type SafeLedgerEntry struct {
	ID              uuid.UUID             `json:"id"`
	Amount          decimal.Decimal       `json:"amount"`
	Currency        string                `json:"currency"`
	TransactionType LedgerTransactionType `json:"transaction_type"`
	Status          LedgerStatus          `json:"status"`
	CreatedAt       time.Time             `json:"created_at"`
}

func (l *PaymentsLedger) ToSafe() SafeLedgerEntry {
	return SafeLedgerEntry{
		ID:              l.ID,
		Amount:          l.Amount,
		Currency:        l.Currency,
		TransactionType: l.TransactionType,
		Status:          l.Status,
		CreatedAt:       l.CreatedAt,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE ENUMS
// ─────────────────────────────────────────────────────────────────────────────

type InvoiceStatus string

const (
	InvoiceStatusDraft  InvoiceStatus = "draft"
	InvoiceStatusIssued InvoiceStatus = "issued"
	InvoiceStatusPaid   InvoiceStatus = "paid"
	InvoiceStatusVoid   InvoiceStatus = "void"
)

func (s InvoiceStatus) IsValid() bool {
	switch s {
	case InvoiceStatusDraft, InvoiceStatusIssued, InvoiceStatusPaid, InvoiceStatusVoid:
		return true
	}
	return false
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE
// ─────────────────────────────────────────────────────────────────────────────

type Invoice struct {
	ID       uuid.UUID `db:"id"        json:"id"`
	ClientID uuid.UUID `db:"client_id" json:"client_id"`
	LedgerID pgtype.UUID `db:"ledger_id" json:"ledger_id"`

	InvoiceNumber string `db:"invoice_number" json:"invoice_number"`

	Subtotal    decimal.Decimal `db:"subtotal"     json:"subtotal"`
	TaxAmount   decimal.Decimal `db:"tax_amount"   json:"tax_amount"`
	TotalAmount decimal.Decimal `db:"total_amount" json:"total_amount"`
	Currency    string          `db:"currency"     json:"currency"`

	PaddleInvoiceID pgtype.Text `db:"paddle_invoice_id" json:"paddle_invoice_id"`
	InvoicePdfURL   pgtype.Text `db:"invoice_pdf_url"   json:"invoice_pdf_url"`

	Status   InvoiceStatus `db:"status"    json:"status"`
	IssuedAt time.Time     `db:"issued_at" json:"issued_at"`
	DueDate  pgtype.Timestamptz `db:"due_date"  json:"due_date"`
	PaidAt   pgtype.Timestamptz `db:"paid_at"   json:"paid_at"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type SafeInvoice struct {
	ID            uuid.UUID       `json:"id"`
	InvoiceNumber string          `json:"invoice_number"`
	TotalAmount   decimal.Decimal `json:"total_amount"`
	Currency      string          `json:"currency"`
	Status        InvoiceStatus   `json:"status"`
	InvoicePdfURL *string         `json:"invoice_pdf_url,omitempty"`
	IssuedAt      time.Time       `json:"issued_at"`
}

func (i *Invoice) ToSafe() SafeInvoice {
	s := SafeInvoice{
		ID:            i.ID,
		InvoiceNumber: i.InvoiceNumber,
		TotalAmount:   i.TotalAmount,
		Currency:      i.Currency,
		Status:        i.Status,
		IssuedAt:      i.IssuedAt,
	}

	if i.InvoicePdfURL.Valid {
		s.InvoicePdfURL = &i.InvoicePdfURL.String
	}

	return s
}
