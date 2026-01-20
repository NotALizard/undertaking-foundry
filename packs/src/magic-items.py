import os, random, json, csv, sys, string

ammoInfo = "This piece of ammunition grants you a bonus to hit and to damage, the bonus of which is determined by the rarity of the ammunition.  However, once it hits a target, the ammunition is no longer magical."
armorInfo = "While wearing this armor you have a bonus to your AC.  The bonus is determined by its rarity."
focusInfo = "While holding this focus, you gain a bonus to spell attack rolls. This bonus is determined by the focus&rsquo; rarity.<br><br><strong>While Attuned</strong><br><br>While somewhere on your person, you gain a bonus to the save DCs of spells you cast. This bonus is determined by the focus&rsquo; rarity."
shieldInfo = "While holding this shield, you gain a bonus to your AC determined by the shield's rarity.  This bonus is in addition to the shield's normal bonus to AC.  Additionally, you can add this bonus to attack and damage rolls made using the shield as a weapon."
weaponInfo = "You have a bonus on your attack and damage rolls made with this weapon, the bonus of which is dependent on the rarity."


def id_generator(size=16, chars=string.ascii_uppercase + string.digits):
        return ''.join(random.choice(chars) for _ in range(size))

def getId(itemId, magicBonus):
    with open('magic_item_ids.json', 'r') as idFile:
        idMap = json.load(idFile) 
        if itemId in idMap:
            if magicBonus in idMap[itemId]:
                return idMap[itemId][magicBonus]
            else:
                newId = id_generator()
                idMap[itemId][magicBonus] = newId
                with open('magic_item_ids.json', 'w') as idFileWrite:
                    json.dump(idMap, idFileWrite, indent=4)
                return newId
        else:
            newObj = {
                "1": id_generator(),
                "2": id_generator(),
                "3": id_generator()
            }
            idMap[itemId] = newObj
            with open('magic_item_ids.json', 'w') as idFileWrite:
                json.dump(idMap, idFileWrite, indent=4)
            return newObj[magicBonus]



def weapons(magicBonus):
    with open('weapons.csv', mode = 'r') as weaponFile:
        weaponReader = csv.reader(weaponFile)
        next(weaponReader) ## Skip first line
        for line in weaponReader:
            if line[0] == "Unarmed":
                continue
            rarity = "uncommon"
            if line[4] == "shield":
                match magicBonus:
                    case "1":
                        rarity = "rare"
                    case "2":
                        rarity = "veryRare"
                    case "3":
                        rarity = "legendary"
            else:
                match magicBonus:
                    case "1":
                        rarity = "uncommon"
                    case "2":
                        rarity = "rare"
                    case "3":
                        rarity = "veryRare"
                
            w = {
                "name": line[0] + ' +' + magicBonus,
                "type": "weapon",
                "img": line[27],
                "system": {
                    "description": {
                        "value": (line[26] + "<br><br>" + shieldInfo) if line[4] == "shield" else (line[26] + "<br><br>" + weaponInfo),
                        "chat": "",
                        "unidentified": ""
                    },
                    "source": "Core Rules",
                    "weight": line[3],
                    "price": {
                        "value": 0,
                        "denomination": line[2]
                    },
                    "rarity": rarity,
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
                    "attackBonus": magicBonus,
                    "damage": {
                        "parts": [
                            [
                                line[9] + ' + ' + magicBonus,
                                line[10]
                            ]
                        ],
                        "versatile": line[11] if line[11] == "" else line[11] + ' + ' + magicBonus 
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
                    "showInAttacks": (line[25] == "TRUE")
                },
                "_id": getId(line[24], magicBonus)
            }
            wstr = json.dumps(w, indent=4)
            fname = line[0].lower().replace(" ", "-")
            fname = fname + '+' + magicBonus
            with open('magic-items-standard/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)

def ammo(magicBonus):
    with open('ammo.csv', mode = 'r') as gearFile:
        gearReader = csv.reader(gearFile)
        next(gearReader) ## Skip first line
        for line in gearReader:
            rarity = "uncommon"
            match magicBonus:
                case "1":
                    rarity = "uncommon"
                case "2":
                    rarity = "rare"
                case "3":
                    rarity = "veryRare"
            w = {
                "name": line[1] + ' +' + magicBonus,
                "type": "equipment",
                "img": line[7],
                "system": {
                    "description": {
                        "value": line[6] + "<br><br>" + ammoInfo,
                        "chat": "",
                        "unidentified": ""
                    },
                    "source": "Core Rules",
                    "weight": line[4],
                    "price": {
                        "value": 0,
                        "denomination": "gp"
                    },
                    "rarity": rarity
                },
                "_id": getId(line[0], magicBonus)
            }
            wstr = json.dumps(w, indent=4)
            fname = line[1].lower().replace("(", "")
            fname = fname.lower().replace(")", "")
            fname = fname.lower().replace(",", "")
            fname = fname.lower().replace("  ", " ")
            fname = fname.lower().replace(" ", "-")
            fname = fname + '+' + magicBonus
            with open('magic-items-standard/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)
    


def armor(magicBonus):
    with open('armor.csv', mode = 'r') as gearFile:
        gearReader = csv.reader(gearFile)
        next(gearReader) ## Skip first line
        for line in gearReader:
            rarity = "uncommon"
            match magicBonus:
                case "1":
                    rarity = "rare"
                case "2":
                    rarity = "veryRare"
                case "3":
                    rarity = "legendary"
            w = {
                "name": line[1] + ' +' + magicBonus,
                "type": "armor",
                "img": line[6],
                "system": {
                    "description": {
                        "value": line[5] + "<br><br>" + armorInfo,
                        "chat": "",
                        "unidentified": ""
                    },
                    "source": "Core Rules",
                    "weight": line[4],
                    "price": {
                        "value": 0,
                        "denomination": line[3]
                    },
                    "rarity": rarity,
                    "armorType": line[7],
                    "baseAC": int(line[8]),
                    "bonusAC": int(magicBonus),
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
                "_id": getId(line[0], magicBonus)
            }
            wstr = json.dumps(w, indent=4)
            fname = line[1].lower().replace("(", "")
            fname = fname.lower().replace(")", "")
            fname = fname.lower().replace(",", "")
            fname = fname.lower().replace("  ", " ")
            fname = fname.lower().replace(" ", "-")
            fname = fname + '+' + magicBonus
            with open('magic-items-standard/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)

def focus(magicBonus):
    with open('gear.csv', mode = 'r') as gearFile:
        gearReader = csv.reader(gearFile)
        next(gearReader) ## Skip first line
        for line in gearReader:
            if line[1].find("focus)") == -1:
                continue
            rarity = "uncommon"
            match magicBonus:
                case "1":
                    rarity = "uncommon"
                case "2":
                    rarity = "rare"
                case "3":
                    rarity = "veryRare"
            w = {
                "name": line[1] + ' +' + magicBonus,
                "type": "equipment",
                "img": line[7],
                "system": {
                    "description": {
                        "value": line[6] + "<br><br>" + focusInfo,
                        "chat": "",
                        "unidentified": ""
                    },
                    "source": "Core Rules",
                    "weight": line[4],
                    "price": {
                        "value": 0,
                        "denomination": "gp"
                    },
                    "rarity": rarity,
                    "attunement": 1,
                },
                "_id": getId(line[0], magicBonus)
            }
            wstr = json.dumps(w, indent=4)
            fname = line[1].lower().replace("(", "")
            fname = fname.lower().replace(")", "")
            fname = fname.lower().replace(",", "")
            fname = fname.lower().replace("  ", " ")
            fname = fname.lower().replace(" ", "-")
            fname = fname + '+' + magicBonus
            with open('magic-items-standard/' + fname + '.json', 'w') as output_file:
                output_file.write(wstr)

def doWork():
    for bonus in range(1, 4):
        weapons(str(bonus))
        ammo(str(bonus))
        armor(str(bonus))
        focus(str(bonus))
doWork()