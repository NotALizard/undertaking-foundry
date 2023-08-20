import random, os, json, sys, string

def id_generator(size=16, chars=string.ascii_uppercase + string.digits):
        return ''.join(random.choice(chars) for _ in range(size))

def merge_JsonFiles(filename, dir):
    env = ''
    with open('env.json', 'r') as infile:
        env = json.load(infile)
    print(env)

    result = ''
    for f1 in filename:
        with open(dir + '/' + f1, 'r') as infile:
            j = json.load(infile)
            j['_stats'] = env['stats']
            result = result + json.dumps(j)+'\n';

    with open('../' + dir + '.db', 'w') as output_file:
        output_file.write(result)

def doWork():
    dir = sys.argv[1]
    json_files = [pos_json for pos_json in os.listdir(dir+'/') if pos_json.endswith('.json')]
    merge_JsonFiles(json_files,dir)

doWork()
