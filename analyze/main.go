package main

import (
	"bufio"
	b64 "encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
)

/*Cell represent a single space in a DrMario game
 */
type Cell uint8

/*Board represent the content of a Pill Bottle in the game*/
type Board struct {
	data      [512]Cell
	prevFrame [512]Cell
}

/*Stats represent the statistic of an analysed game */
type Stats struct {
	initialized bool

	Pillcount       int
	Virustotalcount int
	Viruskillcount  int
	Meta            string

	viruskilled map[int]bool
}

func (s *Stats) String() string {
	b := strings.Builder{}
	b.WriteString("Stats\n--------------------------------------\n")
	b.WriteString(fmt.Sprint("   PillCount:", s.Pillcount, "\n"))
	b.WriteString(fmt.Sprint(" Virus Total:", s.Virustotalcount, "\n"))
	b.WriteString(fmt.Sprint("Virus Killed:", s.Viruskillcount, "\n"))

	return b.String()
}

/*Code represent a single type of elements contained in a DrMario Cell value
 */
type Code struct {
	mask   uint8
	values map[string]uint8
}

/*Codes contains the list of mask and values that represent the
  data board of a DrMario game */
var Codes = map[string]Code{
	"color": Code{
		mask: 0x03, //0b00000011
		values: map[string]uint8{
			"red":    0x01, //0b00000001
			"blue":   0x02, //0b00000010
			"yellow": 0x03, //0b00000011
		},
	},
	"form": Code{
		mask: 0x1C, //0b00011100
		values: map[string]uint8{
			"single":    0x00, //0b00000000
			"up":        0x04, //0b00000100
			"right":     0x08, //0b00001000
			"down":      0x0C, //0b00001100
			"left":      0x10, //0b00010000
			"virus":     0x14, //0b00010100
			"exploding": 0x18, //0b00011000
			"exploded":  0x1C, //0b00011100
		},
	},
	"state": Code{
		mask: 0x20, //0b00100000
		values: map[string]uint8{
			"alive": 0x20, //0b00100000
			"dead":  0x00, //0b00000000
		},
	},
}

func (i Cell) isCode(category, value string) bool {
	if code, ok := Codes[category]; ok {
		if value, ok := code.values[value]; ok {
			return i != 0 && ((uint8(i) & code.mask) == value)
		}
		log.Fatalln("Undefined value", value, "in category", category)
	}
	log.Fatalln("Undefined Code category", category)
	return false
}

func (i Cell) describe() string {
	b := strings.Builder{}
	for _, category := range []string{"form", "color" /*, "state"*/} {
		for key := range Codes[category].values {
			if i.isCode(category, key) {
				b.WriteString(fmt.Sprintf("%s ", key))
			}
		}
	}
	return b.String()
}

func (s *Stats) setMeta(frame string) {
	raw, err := b64.StdEncoding.DecodeString(frame)
	if err != nil {
		log.Fatalln("Failed to decode meta instructions:", frame)
	}

	s.Meta = fmt.Sprintf("%s", raw)
}

func (b *Board) playFrame(frame string) (int, error) {
	//log.Println("playing frame:", frame)
	raw, err := b64.StdEncoding.DecodeString(frame)
	if err != nil {
		return 0, err
	}

	// save the frame before modifying it
	b.prevFrame = b.data

	//log.Println("Decoded frame:", raw)

	j := 0
	updated := 0
	for _, c := range raw {
		// decompress
		if c&0x80 != 0 {
			//log.Println("Decompressing, skipping", c&0x7f, "position")
			j += int(c) & 0x7f
		} else {
			updated++
			//log.Printf("Updating cell %v with %X: %s", j, c, Cell(c).describe())

			b.data[j] = Cell(c)
			j++
		}
	}

	return updated, nil
}

func (b *Board) initStats(stats *Stats) {
	if stats.initialized {
		return
	}

	for i := range b.data {
		if b.data[i].isCode("form", "virus") {
			stats.Virustotalcount++
		}
	}

	stats.initialized = true
}

func (b *Board) analyze(stats *Stats) {
	// run the analisis here

	// look if a new pill is in the middle
	if b.data[3].isCode("form", "right") && b.data[4].isCode("form", "left") {
		stats.Pillcount++
	}

	// look for virus kill
	for i := range b.data {
		if b.data[i].isCode("form", "exploding") {
			// look it was a virus
			if b.prevFrame[i].isCode("form", "virus") {
				// look if we didn't count it already
				if counted, ok := stats.viruskilled[i]; counted && ok {
					// already counted
				} else {
					stats.Viruskillcount++
					stats.viruskilled[i] = true
				}
			}
		}
	}
}

func main() {
	replayPath := ""
	flag.StringVar(&replayPath, "f", "", "path to Replay file to analyse")
	formatJSON := flag.Bool("json", false, "Output as json")

	flag.Parse()

	if replayPath == "" {
		args := flag.Args()
		if len(args) > 0 {
			replayPath = args[0]
		} else {
			flag.Usage()
			return
		}
	}

	board := Board{
		data:      [512]Cell{},
		prevFrame: [512]Cell{},
	}

	stats := Stats{
		viruskilled: map[int]bool{},
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
					if stats.initialized == false {
						board.initStats(&stats)
					}

					board.analyze(&stats)
				}
			}
		} else if line[0:1] == "m" {
			stats.setMeta(line[1:])
		}
	}

	if *formatJSON == true {
		bs, err := json.Marshal(stats)
		if err != nil {
			log.Fatalln("Failed to json encode result", err)
		}
		fmt.Printf("%s", bs)
	} else {
		log.Println(stats.String())
	}
}
