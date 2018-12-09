var library = {
    "sfx": {
        src: "/assets/sounds/sfx.mp3",
        track: {
            "combo1": { start: 0, end: 2 },
            "combo2": { start: 2, end: 3 },
            "nes-combo-1": { start: 4, end: 6 },
            "nes-combo-2": { start: 6, end: 8 },
            "dududididu": { start:3, end: 4 },
            "pause": { start:8, end:9 },
            "destroy": {
                "tracks": [
                    {odd:.5,start:9,end:9.53},
                    {odd:.5,start:10,end:10.51}
                ]
            },
            "destroy-combo": { start:11, end:11.71 },
            "almost_done" : { start:15, end:16.7 },
            "warning" : { start: 17, end: 18.10 },
            "fall": { start: 12, end: 12.16 },
            "move": { start: 13, end: 13.15 },
            "rotate": { start:14, end:14.25 },
        }
    },
    "bg": {
        src: "/assets/sounds/bg.mp3",
        track: {
            "nes-title":{ start: 0, end: 126 },
            "nes-select":{ start: 128, end: 177 },
            "nes-fever":{ start: 180, end: 322 },
            "nes-fever-clear":{ start: 325, end: 348, },
            "nes-chill":{ start: 352, end: 594 },
            "nes-chill-clear":{ start: 597, end: 619 },
            "nes-vs-game-over":{ start: 646, end: 761 },
            "nes-game-lost":{ start: 622, end: 645 },
            "wii-title":{ start: 763, end: 871 },
            "wii-select":{ start: 874, end: 933 },
            "wii-fever":{ start: 935, end: 1090 },
            "wii-chill":{ start: 1091, end: 1230 },
            "wii-cough":{ start: 1232, end: 1350 },
            "wii-sneeze":{ start: 1352, end: 1476 },
            "wii-clear": { start: 1477, end: 1546 }
        }
    }
};