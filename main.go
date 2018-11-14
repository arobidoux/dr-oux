package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"

	"github.com/zserge/webview"
)

/*
	generate assets file for debug
	`go-bindata -debug -o assets.go assets/...`

	generate assets for prod
	`go-bindata -o assets.go assets/...`
*/

func main() {
	stop := make(chan os.Signal, 1)

	signal.Notify(stop, os.Interrupt)

	addr := ":" + os.Getenv("PORT")
	if addr == ":" {
		addr = ":8080"
	}

	srv := StartHTTPServer(addr)

	// TODO investigate command line arguments to optionnaly not launch the webview
	wbv := StartWebView(webview.Settings{
		Title: "Dr. Mario",
		URL:   fmt.Sprintf("http://localhost%v/", addr),
		Debug: true,
	})

	PiggyBackOn(srv, "/ws")

	select {
	case <-stop:
		log.Println("Received interrupt signal, exiting")
		wbv.close <- 1
		srv.http.Shutdown(context.Background())

	case <-wbv.done:
		log.Println("Webview closed, closing server")
		srv.http.Shutdown(context.Background())
	}

	log.Println("Exiting")
}
