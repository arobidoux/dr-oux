package main

import (
	"log"
	"net/http"
	"path"
	"time"
)

/*MyHTTPServer contains pointers to the http server and the underlying ServeMux*/
type MyHTTPServer struct {
	http *http.Server
	mux  *http.ServeMux
}

/*StartHTTPServer Initialise the http server and launch it in the background
Returns a pointer to the server created
*/
func StartHTTPServer(addr string) MyHTTPServer {
	mux := http.NewServeMux()
	loadMux(mux)

	srv := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("HTTP Server Listening on 0.0.0.0%v\n", addr)
		log.Println(srv.ListenAndServe())
	}()

	return MyHTTPServer{
		http: srv,
		mux:  mux,
	}
}

func serveAsset(p string, w http.ResponseWriter) {
	data, err := Asset(p)
	if err != nil {
		e := err.Error()
		log.Println(e)

		if e[len(e)-9:] == "not found" {
			w.WriteHeader(404)
			w.Write([]byte(e))
		} else {
			w.WriteHeader(500)
			w.Write([]byte("Internal Error"))
		}

		return
	}

	switch path.Ext(p) {
	case ".css":
		w.Header().Set("Content-Type", "text/css")
	case ".js":
		w.Header().Set("Content-Type", "application/javascript")
	case ".html":
		w.Header().Set("Content-Type", "text/html")
	default:
		w.Header().Set("Content-Type", "text/plain")
	}

	w.Write(data)
}

func loadMux(mux *http.ServeMux) {
	mux.HandleFunc("/assets/", func(w http.ResponseWriter, req *http.Request) {
		serveAsset(req.URL.Path[1:], w)
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		switch req.URL.Path {
		case "/", "/index.html":
			serveAsset("assets/html/index.html", w)
		case "/favicon.ico":
			serveAsset("assets/img/favicon.ico", w)
		default:
			log.Println("404", req.URL.Path)
			w.WriteHeader(404)
			w.Write([]byte("Not Found"))
		}
	})
}
