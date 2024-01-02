import os, json, csv, sys, string

def doWork():
    with open('spells.csv', mode = 'r') as spellFile:
        spellReader = csv.reader(spellFile)
        next(spellReader) ## Skip first line
        for line in spellReader:
            desc = line[26]
            if "<p>" not in desc:
                desc = "<p>" + desc + "</p>"
            dmg = []
            if line[23]:
                parts = line[23].split(',')
                for i in range(0,len(parts),2):
                    thispart = []
                    thispart.append(parts[i])
                    if i+1 < len(parts):
                        thispart.append(parts[i+1])
                    else:
                        thispart.append("")
                    dmg.append(thispart)
            w = {
                "name": line[1],
                "type": "spell",
                "img": line[27],
                "system": {
                    "description": {
                        "value": desc,
                        "chat": "",
                        "unidentified": ""
                    },
                    "source": "Core Rules",
                    "level": line[2],
                    "charge": line[3] == "y",
                    "school": line[4],
                    "components": {
                        "somatic": line[5] == "y",
                        "verbal": line[6] == "y",
                        "material": line[7] == "y",
                        "ritual": line[13] == "y",
                        "concentration": line[16] == "y"
                    },
                    "materials": {
                        "value": line[8],
                        "consumed": line[9] == "y",
                        "cost": line[10],
                        "supply": 0
                    },
                    "attribute": "spell",
                    "actionType": line[22],
                    "activation": {
                        "type": line[12],
                        "cost": line[11],
                        "condition": ""
                    },
                    "duration": {
                        "value": line[14],
                        "units": line[15]
                    },
                    "range": {
                        "value": line[17],
                        "long": None,
                        "units": line[18]
                    },
                    "target": {
                        "value": line[19],
                        "width": None,
                        "units": line[20],
                        "type": line[21]
                    },
                    "damage": {
                        "parts": dmg,
                        "versatile": ""
                    },
                    "save": {
                        "attribute": line[24],
                        "dc": None,
                        "scaling": "spell"
                    },
                    "showInAttacks": line[25] == "y"
                },
                "_id": line[0]
            }
            wstr = json.dumps(w, indent=4)
            fname = line[1].lower().replace("(", "")
            fname = fname.lower().replace(")", "")
            fname = fname.lower().replace(",", "")
            fname = fname.lower().replace("'", "")
            fname = fname.lower().replace(" / ", "/")
            fname = fname.lower().replace("/", " ")
            fname = fname.lower().replace("  ", " ")
            fname = fname.lower().replace(" ", "-")
            folder = 'cantrips'
            if int(line[2]) > 0:
                folder = 'level-' + line[2]
            with open('spells-' + folder + '/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)

doWork()