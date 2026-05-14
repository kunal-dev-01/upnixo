package repo

import (
	"context"

	"server/internal/db"
	"server/internal/utils"

	"github.com/jackc/pgx/v5"
)

// withTx is a helper to run a function within a database transaction.
// It handles Begin, Commit, and Rollback automatically.
func withTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return utils.Internal(err)
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback(ctx)
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return utils.Internal(err)
	}

	return nil
}

// isPgConflict checks if the error is a PostgreSQL unique constraint violation (code 23505).
func isPgConflict(err error) bool {
	return err != nil && len(err.Error()) > 5 && err.Error()[:5] == "23505"
}
