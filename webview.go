package main

import (
	"fmt"
	"log"

	"github.com/zserge/webview"
)

/*WebViewCtrl contains flow control channels to:
- receive when the webview is closed
- close the webview
*/
type WebViewCtrl struct {
	done  <-chan int
	close chan<- int
}

/*StartWebView will launch a webview with the options passed*/
func StartWebView(settings webview.Settings) *WebViewCtrl {
	done := make(chan int)
	close := make(chan int)

	go func(done chan<- int, close <-chan int) {
		log.Println("Loading webview", settings.URL)

		w := webview.New(settings)
		defer w.Exit()

		closed := make(chan int)

		go func() {
			w.Run()
			closed <- 1
		}()

		select {
		case <-closed:
			fmt.Println("Webview Closed")
			done <- 0
		case <-close:
			fmt.Println("Closing the Webview")
			w.Dispatch(func() {
				w.Terminate()
			})
		}
	}(done, close)

	return &WebViewCtrl{
		done:  done,
		close: close,
	}
}
