from flask import Flask, redirect, url_for
from flask import request
from flask import send_from_directory
from flask import send_file

from IO import RemoteIO, NotationIO, ConfigurationIO
from Network import CorpusGraph
from Network import TextGraph
from ResultReference import JiebaChecker, ThulacChecker
from utl import count as time_count
import os
import json
import yaml

# 从json文件建立语料库图模型
cg = CorpusGraph()
cg.load_from_json()

# 分词结果校对
jieba_checker = JiebaChecker()
thulac_checker = ThulacChecker()

rio = RemoteIO()

app = Flask(__name__, template_folder='./presentation', static_folder='./presentation')
print("app ready")

@app.route('/')
def hello_world():
    return send_file('./presentation/WordLink.html')


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'presentation'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')


# 加载引用文件（js css 等）
@app.route('/<loadfile>', methods=['POST', 'GET'])
def load_ref(loadfile):
    print(loadfile)
    return send_from_directory(os.path.join(app.root_path, 'presentation'), loadfile)


nio = NotationIO()
nio_cursor = nio.get_raw_randomly()
cursor = None

configIO = ConfigurationIO()
database = ''



@app.route('/configuration', methods=['GET'])
def notation_configuration():
    return load_ref("configuration.html")

#根据用户选择的txt文本文件，传入数据库
@app.route('/upload', methods=['POST'])
def upload_file():


    name = request.form['databaseName']
    print('new database name:' + name)
    if(len(name) == 0):
        return "请对您要上传的数据库进行命名，否则您将无法上传"

    trainedDatabase = configIO.getTrainedDatabases()
    untrainedDatabase = configIO.getUntrainedDatabases()
    print("now here the databases:")
    print(trainedDatabase)
    print(untrainedDatabase)
    if(name in untrainedDatabase or name in trainedDatabase):
        return "在数据库中已经有一个名为'"+ name +"'的数据库, 请重命名您的数据库"



    print("begin upload file to database")
    f = request.files['file']
    lines = f.stream.read().decode('utf-8').split('。')
    lines = lines[:-1]



    configIO.insertTextIntoDatabase(lines,name)

    return load_ref("addDatabaseSuccess.html")

    #return "ok, upload file to database success"

#查所有还没有被训练的数据库名称
@app.route('/configuration/getDatabases', methods=['GET'])
def choose_database():
    database = configIO.getUntrainedDatabases()

    return json.dumps(database)



#查询标注-标签对照表
@app.route('/configuration/getLabels', methods=['GET'])
def fetch_label():
    labels = configIO.getLabels()
    print(json.dumps(labels,ensure_ascii=False))
    return json.dumps(labels,ensure_ascii=False)





#开始标注，提交标签与标签的对照表
@app.route('/configuration/start-notation', methods=['POST'])
def start_notation():
    global cursor,database
    inputData = request.get_json()
    pairs = inputData.get("labels")
    database = inputData.get("database")

    cursor = nio.get_raw_randomly_fromDatabase(database)



    try:
        configIO.insertLabels(pairs)
    except:
        return "500"
    else:
        return "200"


@app.route('/notation', methods=['GET'])
def notation_page():
    return load_ref("notation.html")


#这里针对next(cursor)拿到的是空从而报错的情况做了一些处理
@app.route('/notation/get-sentence', methods=['GET'])
def get_notation_sentence():
    global cursor,database
    try:
        return json.dumps(next(cursor))
    except StopIteration:
        size = nio.get_size_of_database(database)
        if size == 0:
            print("this database has been handled , no sentences left")
            return "no sentences, this database has a size of 0"

        cursor = nio.get_raw_randomly_fromDatabase(database)
        return get_notation_sentence()


    #return info



@app.route('/notation/submit-notation', methods=['POST'])
def submit_notation_sentence():
    noted = request.get_json()
    nio.move_to_train(noted)
    return json.dumps({"msg": "done"})

@app.route('/notation/export-notation', methods=['GET'])
def export_notation_sentence():
    databases = configIO.getTrainedDatabases()
    output = {}
    output['labels'] = configIO.getLabelExport()
    export_content = {}

    for database in databases:
        export_content[database] = configIO.getSubmittedSentencesFromDatabase(database)

    output['results'] = export_content


    sentences = yaml.dump(output, allow_unicode=True)
    #modifiedSentences = sentences.replace("\"", "\'")
    #return modifiedSentences
    return sentences

    # do some end-up staff,like close connections
    # return "ok"


# 随机获取句子
@app.route('/sentence-for-analyse', methods=['GET', 'PST'])
def get_sentence_randomly():
    # global rio
    # global nio_cursor
    doc = rio.read_sentence_randomly()
    if doc is None:
        rio.refresh()
        doc = rio.read_sentence_randomly()

    return json.dumps({"text": doc["text"]})


# 分词的api，web接口只对单句分词（目前）
@app.route('/tokenize-result', methods=['GET', 'POST'])
def tokenize():
    if request.method == 'GET':
        tg = TextGraph()
        sentence = "没有输入"

        # 从参数获取待分词句子
        if request.args.get('sentence', '') != "":
            sentence = request.args.get('sentence', '')
        tg.build([sentence])
        tg.fill_edge(cg)

        # 暂时只对单句分词
        time_count(print_to_console=False)
        result = tg.cut()[0]
        time_count("分词完毕")
        check_jieba = jieba_checker.check(sentence, result)
        time_count("jieba分词完毕")
        check_thulac = thulac_checker.check(sentence, result)
        time_count("thulac分词完毕")

        # jieba的分词结果
        jieba_result = check_jieba["jieba_result"]
        jieba_overlap = check_jieba["overlap"]

        thulac_result = check_thulac["thulac_result"]
        thulac_overlap = check_thulac["overlap"]
        # res = json.dumps(
        #     {"graph": tg.make_json(cg, path=None), "result": result,
        #      "jieba": jieba_result, "jieba_overlap": jieba_overlap,
        #      "thulac": thulac_result, "thulac_overlap": thulac_overlap},
        #     ensure_ascii=False)
        res = json.dumps(
            {"graph": tg.make_json(cg, path=None), "result": result,
             "jieba": {"words": jieba_result, "overlap": "%.2f" % jieba_overlap},
             "thulac": {"words": thulac_result, "overlap": "%.2f" % thulac_overlap}},
            ensure_ascii=False)
        # print("json dumping")
        # res = json.dumps(
        #     {"graph": tg.make_json(cg, path=None), "result": result,
        #      "jieba": jieba_result, "jieba_overlap": jieba_overlap,
        #      },
        #     ensure_ascii=False)
        print("server returned")
        return res


if __name__ == '__main__':
    app.run(host="localhost", port=8000)
    #app.run(host="192.168.68.11", port=8000)
# end
