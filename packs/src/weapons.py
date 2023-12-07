import os, json, csv, sys, string

def doWork():
    with open('weapons.csv', mode = 'r') as weaponFile:
        weaponReader = csv.reader(weaponFile)
        next(weaponReader) ## Skip first line
        for line in weaponReader:
            w = {
                "name": line[0],
                "type": "weapon",
                "img": line[26],
                "system": {
                    "description": {
                        "value": line[25],
                        "chat": "",
                        "unidentified": ""
                    },
                    "source": "Core Rules",
                    "weight": line[3],
                    "price": {
                        "value": line[1],
                        "denomination": line[2]
                    },
                    "weaponType": line[4],
                    "attribute": line[5],
                    "actionType": line[6],
                    "range": {
                        "value": line[7],
                        "long": line[8],
                        "units": "ft"
                    },
                    "critical": {
                        "threshold": None,
                        "damage": ""
                    },
                    "damage": {
                        "parts": [
                            [
                                line[9],
                                line[10]
                            ]
                        ],
                        "versatile": line[11]
                    },
                    "formula": "",
                    "save": {
                        "attribute": "",
                        "dc": None,
                        "scaling": "spell"
                    },
                    "properties": {
                        "amm": (line[12] == "TRUE"),
                        "fin": (line[13] == "TRUE"),
                        "foc": (line[14] == "TRUE"),
                        "hvy": (line[15] == "TRUE"),
                        "lgt": (line[16] == "TRUE"),
                        "lod": (line[17] == "TRUE"),
                        "rch": (line[18] == "TRUE"),
                        "spc": (line[19] == "TRUE"),
                        "thr": (line[20] == "TRUE"),
                        "two": (line[21] == "TRUE"),
                        "una": (line[22] == "TRUE"),
                        "ver": (line[23] == "TRUE")
                    },
                    "showInAttacks": True
                },
                "_id": line[24]
            }
            wstr = json.dumps(w, indent=4)
            fname = line[0].lower().replace(" ", "_")
            with open('weapons/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)

doWork()