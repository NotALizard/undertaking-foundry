import random, string, sys, pyperclip

def id_generator(size=16, chars=string.ascii_uppercase + string.digits):
        return ''.join(random.choice(chars) for _ in range(size))

def doWork():
        ct = 1
        if len(sys.argv) > 1:
                ct = int(sys.argv[1])

        for x in range(ct):
                id = id_generator()
                print(id)
                pyperclip.copy(id)

doWork()
