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
	// create channel that will listen to the kill signal
	stop := make(chan os.Signal, 1)

	// bind Interrupt signal to the `stop` channel
	signal.Notify(stop, os.Interrupt)

	// Retrieve Parameters

	// Get the http port to listen to
	addr := ":" + os.Getenv("PORT")
	if addr == ":" {
		addr = ":8080"
	}

	// Start the web server
	srv := StartHTTPServer(addr)

	// TODO investigate command line arguments to optionnaly not launch the webview
	// Start a Webview and open the main page
	wbv := StartWebView(webview.Settings{
		Title: "Dr. OUX",
		URL:   fmt.Sprintf("http://localhost%v/", addr),
		Debug: true,
	})

	// Start the websocket server, piggybacking on the http server
	PiggyBackWSOn(srv, "/ws")

	//
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
