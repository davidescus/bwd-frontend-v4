package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	BackendAddress string `env:"BACKEND_ADDRESS" env-default:""`
	ListeningPort  string `env:"LISTENING_PORT" env-default:""`
}

func (c *Config) validate() error {
	if c.BackendAddress == "" {
		return errors.New("[CONFIG] backend address can not be empty")
	}

	if c.ListeningPort == "" {
		return errors.New("[CONFIG] listening port can not be empty")
	}

	return nil
}

func main() {
	// cfg
	cfg := &Config{}
	if err := cleanenv.ReadEnv(cfg); err != nil {
		log.Fatal(err)
	}
	if err := cfg.validate(); err != nil {
		log.Fatal(err)
	}

	log.Printf("--- [START]\n\tBackendAddress: %s\tListeningPort: %s",
		cfg.BackendAddress,
		cfg.ListeningPort,
	)
	log.Println("-------------------------------")

	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	log.Printf("Listening on :%s...", cfg.ListeningPort)
	err := http.ListenAndServe(":"+cfg.ListeningPort, nil)
	if err != nil {
		log.Fatal(err)
	}
}
