package main

import (
	"bufio"
	b64 "encoding/base64"
	"log"
	"os"
)

/*Board represent the content of a Pill Bottle in the game*/
type Board struct {
	data [512]uint8
}

enum CODES {
	
}

func (b *Board) playFrame(frame string) (int, error) {
	raw, err := b64.StdEncoding.DecodeString(frame)
	if err != nil {
		return 0, err
	}

	j := 0
	updated := 0
	for c := range raw {
		// decompress
		if c&0x80 != 0 {
			j += c & 0x7f
		} else {
			updated++
			b.data[j] = uint8(c)
			j++
		}
	}

	return updated, nil
}

func (b *Board) analyze() {
	// run the analisis here

}

func main() {
	replayPath := ""
	if len(os.Args) > 1 {
		replayPath = os.Args[1]
	} else {
		replayPath = "../replay/00a4e8f0-f12d-11e8-bb8a-29710d0295ed/7f65ecb0-f11a-11e8-855d-d727072d1472"
	}

	board := Board{
		data: [512]uint8{},
	}

	// open file
	file, err := os.Open(replayPath)
	if err != nil {
		log.Fatalln("Opening file", err)
	}
	defer file.Close()

	// read each line
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		// if line start with "f", strip first caracter and play frame
		if line[0:1] == "f" {
			if len(line) > 1 {
				updated, err := board.playFrame(line[1:])
				if err != nil {
					log.Fatalln("Playing frame", err)
				}
				if updated > 0 {
					board.analyze()
				}
			}
		}
	}
}
