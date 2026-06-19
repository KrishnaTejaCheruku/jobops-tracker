package main

import (
	"log"
	"net/http"
	"time"

	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/config"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/database"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/handlers"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/middleware"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/observability"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/repository"
	"github.com/KrishnaTejaCheruku/jobops-tracker/apps/backend/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	if err := services.ValidateAuthSecretFromEnv(cfg.AppEnv); err != nil {
		log.Fatalf("auth configuration error: %v", err)
	}

	db, err := database.WaitForDatabase(cfg.DatabaseURL, 10, 3*time.Second)
	if err != nil {
		log.Fatalf("database connection error: %v", err)
	}
	defer db.Close()

	router := gin.Default()
	metricsRegistry := observability.NewRegistry()
	router.Use(metricsRegistry.Middleware())

	router.Use(cors.New(cors.Config{
		AllowOriginFunc: cfg.IsCORSOriginAllowed,
		AllowMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
		},
		ExposeHeaders: []string{
			"Content-Length",
			"Content-Disposition",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	healthHandler := handlers.NewHealthHandler(db)

	authRepo := repository.NewAuthRepository(db)
	otpService := services.NewOTPServiceFromEnv()
	otpDelivery, err := services.NewOTPDeliveryFromEnv(cfg.AppEnv)
	if err != nil {
		log.Fatalf("otp delivery configuration error: %v", err)
	}

	authHandler := handlers.NewAuthHandler(authRepo, otpService, otpDelivery)
	authMiddleware := middleware.RequireAuth(authRepo, otpService)

	applicationRepo := repository.NewApplicationRepository(db)
	applicationHandler := handlers.NewApplicationHandler(applicationRepo)

	cvVersionRepo := repository.NewCVVersionRepository(db)
	cvVersionHandler := handlers.NewCVVersionHandler(cvVersionRepo)

	dashboardRepo := repository.NewDashboardRepository(db)
	dashboardHandler := handlers.NewDashboardHandler(dashboardRepo)
	captureAnalyzeHandler := handlers.NewCaptureAnalyzeHandler(
		cfg.CaptureAnalyzeEnabled,
		cfg.CaptureOCRURL,
		cfg.CaptureMaxBytes,
	)

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Welcome to JobOps Tracker API",
			"service": cfg.AppName,
			"version": "0.1.0",
			"health":  "/health",
		})
	})

	router.GET("/health", healthHandler.HealthCheck)
	router.GET("/metrics", observability.NewMetricsHandler(metricsRegistry, db))

	router.POST("/auth/request-otp", authHandler.RequestOTP)
	router.POST("/auth/verify-otp", authHandler.VerifyOTP)
	router.GET("/auth/me", authHandler.Me)
	router.POST("/auth/logout", authHandler.Logout)
	router.POST("/capture/analyze", captureAnalyzeHandler.Analyze)

	protected := router.Group("/")
	protected.Use(authMiddleware)

	protected.PATCH("/auth/profile", authHandler.UpdateProfile)

	protected.GET("/applications", applicationHandler.ListApplications)
	protected.POST("/applications", applicationHandler.CreateApplication)
	protected.GET("/applications/export.csv", applicationHandler.ExportApplicationsCSV)
	protected.POST("/applications/import.csv", applicationHandler.ImportApplicationsCSV)
	protected.GET("/applications/:id", applicationHandler.GetApplication)
	protected.PUT("/applications/:id", applicationHandler.UpdateApplication)
	protected.DELETE("/applications/:id", applicationHandler.DeleteApplication)
	protected.GET("/applications/:id/status-history", applicationHandler.GetApplicationStatusHistory)

	protected.GET("/cv-versions", cvVersionHandler.ListCVVersions)
	protected.POST("/cv-versions", cvVersionHandler.CreateCVVersion)
	protected.GET("/cv-versions/:id", cvVersionHandler.GetCVVersion)
	protected.PUT("/cv-versions/:id", cvVersionHandler.UpdateCVVersion)
	protected.DELETE("/cv-versions/:id", cvVersionHandler.DeleteCVVersion)

	protected.GET("/dashboard/analytics", dashboardHandler.GetAnalytics)

	addr := ":" + cfg.ServerPort
	log.Printf("starting %s API on port %s", cfg.AppName, cfg.ServerPort)

	if err := router.Run(addr); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
