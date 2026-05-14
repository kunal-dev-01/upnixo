package repo

import (
	"context"
	"errors"
	"time"

	"server/internal/db"
	"server/internal/models"
	"server/internal/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

type FinanceRepository interface {
	// Ledger
	RecordTransaction(ctx context.Context, l *models.PaymentsLedger) error
	GetLedgerByID(ctx context.Context, id uuid.UUID) (*models.PaymentsLedger, error)
	GetLedgerByPaddleID(ctx context.Context, paddleID string) (*models.PaymentsLedger, error)
	ListLedgerByClient(ctx context.Context, clientID uuid.UUID) ([]models.PaymentsLedger, error)
	UpdateLedgerStatus(ctx context.Context, id uuid.UUID, status models.LedgerStatus) error

	// Invoices
	CreateInvoice(ctx context.Context, i *models.Invoice) error
	GetInvoiceByID(ctx context.Context, id uuid.UUID) (*models.Invoice, error)
	GetInvoiceByNumber(ctx context.Context, number string) (*models.Invoice, error)
	ListInvoicesByClient(ctx context.Context, clientID uuid.UUID) ([]models.Invoice, error)
	UpdateInvoice(ctx context.Context, id uuid.UUID, params UpdateInvoiceParams) error
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMS
// ─────────────────────────────────────────────────────────────────────────────

type UpdateInvoiceParams struct {
	Status        *models.InvoiceStatus
	InvoicePdfURL *string
	PaidAt        *time.Time
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ledgerColumns = `
	id, client_id, project_id, milestone_id, subscription_id,
	paddle_transaction_id, paddle_customer_id,
	amount, fee_amount, net_amount, currency,
	transaction_type, status, created_at, updated_at`

const invoiceColumns = `
	id, client_id, ledger_id, invoice_number,
	subtotal, tax_amount, total_amount, currency,
	paddle_invoice_id, invoice_pdf_url,
	status, issued_at, due_date, paid_at,
	created_at, updated_at`

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

type financeRepo struct {
	log *utils.Logger
}

func NewFinanceRepository(log *utils.Logger) FinanceRepository {
	return &financeRepo{log: log}
}

// ─────────────────────────────────────────────────────────────────────────────
// LEDGER METHODS
// ─────────────────────────────────────────────────────────────────────────────

func (r *financeRepo) RecordTransaction(ctx context.Context, l *models.PaymentsLedger) error {
	const sql = `
		INSERT INTO payments_ledger (
			client_id, project_id, milestone_id, subscription_id,
			paddle_transaction_id, paddle_customer_id,
			amount, fee_amount, net_amount, currency, transaction_type, status
		) VALUES (
			@client_id, @project_id, @milestone_id, @subscription_id,
			@paddle_transaction_id, @paddle_customer_id,
			@amount, @fee_amount, @net_amount, @currency, @transaction_type, @status
		)
		RETURNING ` + ledgerColumns

	args := pgx.NamedArgs{
		"client_id":             l.ClientID,
		"project_id":            l.ProjectID,
		"milestone_id":          l.MilestoneID,
		"subscription_id":       l.SubscriptionID,
		"paddle_transaction_id": l.PaddleTransactionID,
		"paddle_customer_id":     l.PaddleCustomerID,
		"amount":                l.Amount,
		"fee_amount":            l.FeeAmount,
		"net_amount":            l.NetAmount,
		"currency":              l.Currency,
		"transaction_type":      l.TransactionType,
		"status":                l.Status,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		if isPgConflict(err) {
			return utils.Conflict("transaction with this paddle ID already exists")
		}
		r.log.Error("record transaction: query failed", err, nil)
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.PaymentsLedger])
	if err != nil {
		r.log.Error("record transaction: scan failed", err, nil)
		return utils.Internal(err)
	}

	*l = res
	return nil
}

func (r *financeRepo) GetLedgerByID(ctx context.Context, id uuid.UUID) (*models.PaymentsLedger, error) {
	sql := `SELECT ` + ledgerColumns + ` FROM payments_ledger WHERE id = @id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get ledger by id: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.PaymentsLedger])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("ledger entry not found")
		}
		r.log.Error("get ledger by id: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *financeRepo) GetLedgerByPaddleID(ctx context.Context, paddleID string) (*models.PaymentsLedger, error) {
	sql := `SELECT ` + ledgerColumns + ` FROM payments_ledger WHERE paddle_transaction_id = @paddle_id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"paddle_id": paddleID})
	if err != nil {
		r.log.Error("get ledger by paddle id: query failed", err, map[string]any{"paddle_id": paddleID})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.PaymentsLedger])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("ledger entry not found")
		}
		r.log.Error("get ledger by paddle id: scan failed", err, map[string]any{"paddle_id": paddleID})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *financeRepo) ListLedgerByClient(ctx context.Context, clientID uuid.UUID) ([]models.PaymentsLedger, error) {
	sql := `SELECT ` + ledgerColumns + ` FROM payments_ledger WHERE client_id = @client_id ORDER BY created_at DESC`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"client_id": clientID})
	if err != nil {
		r.log.Error("list ledger by client: query failed", err, map[string]any{"client_id": clientID})
		return nil, utils.Internal(err)
	}

	entries, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.PaymentsLedger])
	if err != nil {
		r.log.Error("list ledger by client: scan failed", err, map[string]any{"client_id": clientID})
		return nil, utils.Internal(err)
	}

	return entries, nil
}

func (r *financeRepo) UpdateLedgerStatus(ctx context.Context, id uuid.UUID, status models.LedgerStatus) error {
	sql := `UPDATE payments_ledger SET status = @status, updated_at = NOW() WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{"id": id, "status": status})
	if err != nil {
		r.log.Error("update ledger status: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("ledger entry not found")
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE METHODS
// ─────────────────────────────────────────────────────────────────────────────

func (r *financeRepo) CreateInvoice(ctx context.Context, i *models.Invoice) error {
	const sql = `
		INSERT INTO invoices (
			client_id, ledger_id, invoice_number, subtotal, tax_amount, total_amount, currency,
			paddle_invoice_id, invoice_pdf_url, status, issued_at, due_date
		) VALUES (
			@client_id, @ledger_id, @invoice_number, @subtotal, @tax_amount, @total_amount, @currency,
			@paddle_invoice_id, @invoice_pdf_url, @status, @issued_at, @due_date
		)
		RETURNING ` + invoiceColumns

	args := pgx.NamedArgs{
		"client_id":         i.ClientID,
		"ledger_id":         i.LedgerID,
		"invoice_number":    i.InvoiceNumber,
		"subtotal":          i.Subtotal,
		"tax_amount":        i.TaxAmount,
		"total_amount":      i.TotalAmount,
		"currency":          i.Currency,
		"paddle_invoice_id": i.PaddleInvoiceID,
		"invoice_pdf_url":   i.InvoicePdfURL,
		"status":            i.Status,
		"issued_at":         i.IssuedAt,
		"due_date":          i.DueDate,
	}

	rows, err := db.Pool.Query(ctx, sql, args)
	if err != nil {
		if isPgConflict(err) {
			return utils.Conflict("invoice number already exists")
		}
		r.log.Error("create invoice: query failed", err, nil)
		return utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.Invoice])
	if err != nil {
		r.log.Error("create invoice: scan failed", err, nil)
		return utils.Internal(err)
	}

	*i = res
	return nil
}

func (r *financeRepo) GetInvoiceByID(ctx context.Context, id uuid.UUID) (*models.Invoice, error) {
	sql := `SELECT ` + invoiceColumns + ` FROM invoices WHERE id = @id`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"id": id})
	if err != nil {
		r.log.Error("get invoice by id: query failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.Invoice])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("invoice not found")
		}
		r.log.Error("get invoice by id: scan failed", err, map[string]any{"id": id})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *financeRepo) GetInvoiceByNumber(ctx context.Context, number string) (*models.Invoice, error) {
	sql := `SELECT ` + invoiceColumns + ` FROM invoices WHERE invoice_number = @number`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"number": number})
	if err != nil {
		r.log.Error("get invoice by number: query failed", err, map[string]any{"number": number})
		return nil, utils.Internal(err)
	}

	res, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[models.Invoice])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, utils.NotFound("invoice not found")
		}
		r.log.Error("get invoice by number: scan failed", err, map[string]any{"number": number})
		return nil, utils.Internal(err)
	}

	return &res, nil
}

func (r *financeRepo) ListInvoicesByClient(ctx context.Context, clientID uuid.UUID) ([]models.Invoice, error) {
	sql := `SELECT ` + invoiceColumns + ` FROM invoices WHERE client_id = @client_id ORDER BY issued_at DESC`

	rows, err := db.Pool.Query(ctx, sql, pgx.NamedArgs{"client_id": clientID})
	if err != nil {
		r.log.Error("list invoices by client: query failed", err, map[string]any{"client_id": clientID})
		return nil, utils.Internal(err)
	}

	invoices, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Invoice])
	if err != nil {
		r.log.Error("list invoices by client: scan failed", err, map[string]any{"client_id": clientID})
		return nil, utils.Internal(err)
	}

	return invoices, nil
}

func (r *financeRepo) UpdateInvoice(ctx context.Context, id uuid.UUID, params UpdateInvoiceParams) error {
	sql := `
		UPDATE invoices
		SET status          = COALESCE(@status, status),
			invoice_pdf_url = COALESCE(@invoice_pdf_url, invoice_pdf_url),
			paid_at         = COALESCE(@paid_at, paid_at),
			updated_at      = NOW()
		WHERE id = @id`

	tag, err := db.Pool.Exec(ctx, sql, pgx.NamedArgs{
		"id":              id,
		"status":          params.Status,
		"invoice_pdf_url": params.InvoicePdfURL,
		"paid_at":         params.PaidAt,
	})
	if err != nil {
		r.log.Error("update invoice: exec failed", err, map[string]any{"id": id})
		return utils.Internal(err)
	}

	if tag.RowsAffected() == 0 {
		return utils.NotFound("invoice not found")
	}

	return nil
}
