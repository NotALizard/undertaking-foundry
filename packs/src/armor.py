import os, json, csv, sys, string

def doWork():
    with open('armor.csv', mode = 'r') as gearFile:
        gearReader = csv.reader(gearFile)
        next(gearReader) ## Skip first line
        for line in gearReader:
            w = {
                "name": line[1],
                "type": "armor",
                "img": line[6],
                "system": {
                    "description": {
                        "value": line[5],
                        "chat": "",
                        "unidentified": ""
                    },
                    "source": "Core Rules",
                    "weight": line[4],
                    "price": {
                        "value": line[2],
                        "denomination": line[3]
                    },
                    "armorType": line[7],
                    "baseAC": int(line[8]),
                    "bonusAC": 0,
                    "noisy": line[13] == "y",
                    "weighty": {
                        "enabled": line[11] == "y",
                        "strength": None if line[12] == "" else int(line[12])
                    },
                    "attributes": {
                        "dex": {
                            "enabled": line[9] == "y",
                            "limit": None if line[10] == "" else int(line[10])
                        },
                        "str": {
                            "enabled": False,
                            "limit": None
                        },
                        "con": {
                            "enabled": False,
                            "limit": None
                        },
                        "int": {
                            "enabled": False,
                            "limit": None
                        },
                        "wis": {
                            "enabled": False,
                            "limit": None
                        },
                        "pre": {
                            "enabled": False,
                            "limit": None
                        }
                    },
                    "baseItem": "",
                    "proficient": True
                },
                "_id": line[0]
            }
            wstr = json.dumps(w, indent=4)
            fname = line[1].lower().replace("(", "")
            fname = fname.lower().replace(")", "")
            fname = fname.lower().replace(",", "")
            fname = fname.lower().replace("  ", " ")
            fname = fname.lower().replace(" ", "-")
            with open('armor/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)

doWork()