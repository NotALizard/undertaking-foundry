import os, json, csv, sys, string

def doWork():
    with open('gear.csv', mode = 'r') as gearFile:
        gearReader = csv.reader(gearFile)
        next(gearReader) ## Skip first line
        for line in gearReader:
            w = {
                "name": line[1],
                "type": "equipment",
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
                    }
                },
                "_id": line[0]
            }
            wstr = json.dumps(w, indent=4)
            fname = line[1].lower().replace("(", "")
            fname = fname.lower().replace(")", "")
            fname = fname.lower().replace(",", "")
            fname = fname.lower().replace("  ", " ")
            fname = fname.lower().replace(" ", "-")
            with open('adventuring-gear/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)

doWork()