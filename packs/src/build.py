import random, os, json, sys, string

def id_generator(size=16, chars=string.ascii_uppercase + string.digits):
        return ''.join(random.choice(chars) for _ in range(size))

def merge_JsonFiles(filename, dir):
    env = ''
    with open('env.json', 'r') as infile:
        env = json.load(infile)

    result = ''
    for f1 in filename:
        with open(dir + '/' + f1, 'r') as infile:
            try:
                j = json.load(infile)
                j['_stats'] = env['stats']
                result = result + json.dumps(j)+'\n';
            except:
                print("Error in file " + f1);
                raise

    with open('../' + dir + '.db', 'w') as output_file:
        output_file.write(result)
    print('Built ' + dir + '.db')

def doWork():
    dir_input = sys.argv[1]
    dirs = [];
    if dir_input == '*':
        dirs = next(os.walk('.'))[1]
    else:
        dirs.append(dir_input)
    for dir in dirs:
        json_files = [pos_json for pos_json in os.listdir(dir+'/') if pos_json.endswith('.json')]
        merge_JsonFiles(json_files,dir)

doWork()
