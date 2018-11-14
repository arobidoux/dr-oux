package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var clientNumber int
var upgrader websocket.Upgrader

/*PiggyBackOn will start the websocket server and attach it to the desired path*/
func PiggyBackOn(srv MyHTTPServer, path string) {
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	srv.mux.HandleFunc(path, handle)
	log.Println("Websocket Server listening on path", path)
}

func handle(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	c := newClient(conn)

	if err = c.greet(); err != nil {
		log.Println(c.logSalt(), "Greeting err:", err)
		c.conn.Close()
		return
	}

	go c.writeLoop()
	go c.readLoop()
}

/*client represent a connection from the websocket and regroup certain fonctions to handle it*/
type client struct {
	conn *websocket.Conn
	id   int
}

/* newClient initialize the client structure and attach default event listeners*/
func newClient(conn *websocket.Conn) client {
	c := client{
		conn: conn,
		id:   clientNumber,
	}
	clientNumber++

	c.conn.SetCloseHandler(func(code int, txt string) error {
		log.Println(c.logSalt(), "Connection Closed")
		return nil
	})

	return c
}

func (c client) logSalt() string {
	return fmt.Sprintf("[WS:%v]", c.id)
}

func (c client) greet() error {
	return c.conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("Welcome client %v\n", c.id)))
}

func (c client) writeLoop() {
	i := 0
	for {
		err := c.conn.WriteMessage(2, []byte(fmt.Sprintf("loop %v\n", i)))
		if err != nil {
			log.Println(c.logSalt(), "Write err:", err)
			break
		}
		i++
		time.Sleep(5 * time.Second)
	}
	log.Println(c.logSalt(), "Exiting Write goroutine")
}

func (c client) readLoop() {
	for {
		t, p, err := c.conn.ReadMessage()
		if err != nil {
			log.Println(c.logSalt(), "Read err:", err)
			break
		}

		log.Printf("%s %d> %v\n", c.logSalt(), t, p)
	}
	log.Println(c.logSalt(), "Exiting Read goroutine")
}
