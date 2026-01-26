import os, json, csv, sys, string

tradesDict = dict()

def restActions():
    with open('rest-actions.csv', mode = 'r') as restFile:
        lineReader = csv.reader(restFile)
        next(lineReader) ## Skip first line
        for line in lineReader:
            name = line[3]
            suffix = ""
            if '#' in name:
                parts = name.split('#')
                name = parts[0].strip()
                suffix = parts[1].strip()

            if line[1] == 'Trade':
                if line[2] not in tradesDict:
                    tradesDict[line[2]] = []
                tradesDict[line[2]].append(("undertaking.rest-actions." + line[0]))
            w = {
                "name": name,
                "type": "restAction",
                "system": {
                    "origin":{
                        "type": line[1],
                        "name": line[2]
                    },
                    "restType": line[4],
                    "requirements": line[5],
                    "summary": line[6],
                    "description": {
                        "value": line[7],
                        "chat": "",
                        "unidentified": ""
                    },
                    "source": "Core Rules",
                },
                "_id": line[0]
            }
            wstr = json.dumps(w, indent=4)
            fname = name
            if suffix != "":
                fname = fname + "-" + suffix
            fname = fname.lower().replace("(", "")
            fname = fname.lower().replace(")", "")
            fname = fname.lower().replace(",", "")
            fname = fname.lower().replace("  ", " ")
            fname = fname.lower().replace(" ", "-")
            with open('rest-actions/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)

def trades():
    with open('trades.csv', mode = 'r') as tradesFile:
        lineReader = csv.reader(tradesFile)
        next(lineReader) ## Skip first line
        for line in lineReader:
            w = {
                "name": line[1],
                "type": "trade",
                "system": {
                    "description": {
                        "value": line[3],
                        "chat": "",
                        "unidentified": ""
                    },
                    "restActions": tradesDict.get(line[2], []),
                },
                "_id": line[0]
            }
            wstr = json.dumps(w, indent=4)
            fname = line[1].lower().replace("(", "")
            fname = fname.lower().replace(")", "")
            fname = fname.lower().replace(",", "")
            fname = fname.lower().replace("  ", " ")
            fname = fname.lower().replace(" ", "-")
            with open('trades/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)


def doWork():
    restActions()
    trades()
doWork()