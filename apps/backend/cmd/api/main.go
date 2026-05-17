package main

import (
	"log"
	"net/http"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/config"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/database"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/handlers"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := database.WaitForDatabase(cfg.DatabaseURL, 10, 3*time.Second)
	if err != nil {
		log.Fatalf("database connection error: %v", err)
	}
	defer db.Close()

	router := gin.Default()

	healthHandler := handlers.NewHealthHandler(db)

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Welcome to JobOps Tracker API",
			"service": cfg.AppName,
			"version": "0.1.0",
			"health":  "/health",
		})
	})

	router.GET("/health", healthHandler.HealthCheck)

	addr := ":" + cfg.ServerPort
	log.Printf("starting %s API on port %s", cfg.AppName, cfg.ServerPort)

	if err := router.Run(addr); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
