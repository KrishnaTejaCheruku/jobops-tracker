package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(databaseURL string) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create database pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

func WaitForDatabase(databaseURL string, attempts int, delay time.Duration) (*pgxpool.Pool, error) {
	var lastErr error

	for i := 1; i <= attempts; i++ {
		pool, err := Connect(databaseURL)
		if err == nil {
			return pool, nil
		}

		lastErr = err
		fmt.Printf("database not ready, attempt %d/%d: %v\n", i, attempts, err)
		time.Sleep(delay)
	}

	return nil, fmt.Errorf("database connection failed after %d attempts: %w", attempts, lastErr)
}
