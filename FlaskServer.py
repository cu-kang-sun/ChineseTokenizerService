from flask import Flask, redirect, url_for
from flask import request
from flask import send_from_directory
from flask import send_file

from IO import RemoteIO, NotationIO, ConfigurationIO, TaskIO,UserIO
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
# cursor = None
# category = ''
configIO = ConfigurationIO()
taskIO = TaskIO()
userIO = UserIO()
# database = ''

@app.route('/login', methods=['POST'])
def log_in():
    #传入数据
    #username 已做非空判断
    #password 已做非空判断
    #role(用户角色)，如果是众包用户就是user,如果是管理员就是manager
    #前端会判断是否为空，后端判断是否合法，返回信息
    #返回格式{'status':'fail','msg':'密码错误'} / {‘status':'success','msg':'登陆成功'}

    postData = request.get_json()
    username = postData.get("username")
    pwd = postData.get("password")
    role=postData.get("role")
    response = {}
    if userIO.hasName(username, role):
        if userIO.getPwd(username, role) == pwd:
            response['status'] = 'success'
            response['msg'] = '登陆成功'
        else:
            response['status'] = 'fail'
            response['msg'] = '密码错误'
    else:
        response['status'] = 'fail'
        response['msg'] = '此角色下无该用户名'
    return json.dumps(response,ensure_ascii=False);

@app.route('/configuration', methods=['GET'])
def notation_configuration():
    return load_ref("configuration.html")


@app.route('/configuration/delete-db', methods=['POST'])
def database_delete():
    result={}
    try:
        postData = request.get_json()
        dbName = postData.get("dbName")
        configIO.deleteDb(dbName)
    except:
        result['status'] = 'fail'
        return json.dumps(result,ensure_ascii=False)
    else:
        result['status'] = 'success'
        return json.dumps(result,ensure_ascii=False)


#根据用户选择的txt文本文件，传入数据库
@app.route('/configuration/upload', methods=['POST'])
def database_file_upload():
    response = {}
    name = request.form['name']
    print('new database name:' + name)
    # if(len(name) == 0):
    #     response['status']='fail'
    #     response['msg']= "请对您要上传的数据库进行命名，否则您将无法上传"
    #     return json.dumps(response,ensure_ascii=False)




    trainedDatabase = configIO.getTrainedDatabases()
    untrainedDatabase = configIO.getUntrainedDatabases()
    print("now here the databases:")
    print(trainedDatabase)
    print(untrainedDatabase)
    if(name in untrainedDatabase or name in trainedDatabase):
        response['status'] = 'fail'
        response['msg'] = "在数据库中已经有一个名为'"+ name +"'的数据库, 请重命名您的数据库"
        return json.dumps(response,ensure_ascii=False)


    print("begin upload file to database")
    f = request.files['file']
    lines = f.stream.read().decode('utf-8').split('。')
    if(lines[-1] == ""):
        lines = lines[:-1]

    print(lines)
    while '\n' in lines:
        lines.remove('\n')

    while '' in lines:
        lines.remove('')

    print( lines)
    configIO.insertTextIntoDatabase(lines, name)
    response['status'] = 'success'
    response['msg'] = "上传文件成功，成功存入数据库！"

    return json.dumps(response,ensure_ascii=False)


#管理员提交任务
@app.route('/configuration/uploadTask', methods=['POST'])
def task_upload():
    response = {}
    try:
        postData = request.get_json()
        type = postData.get("category")
        dbname = postData.get("database")
        tag = postData.get("tags")
        description = postData.get("description")
        configIO.insertTask(dbname,type,tag,description)
    except:
        response['status'] = 'fail'
        return json.dumps(response, ensure_ascii=False)
    else:
        response['status'] = 'success'
        return json.dumps(response, ensure_ascii=False)




#查询标注-标签对照表
@app.route('/task/getTasksByCategory', methods=['POST'])
def fetch_task():
    inputData = request.get_json()
    category = inputData.get("category")
    print("get tasks by category:")
    print(category)
#    tasks = configIO.get
    tasks = taskIO.getTaskInfoByCategory(category)
    print(json.dumps(tasks,ensure_ascii=False))
    return json.dumps(tasks,ensure_ascii=False)

#更新任务信息
@app.route('/task/update', methods=['POST'])
def update_task():
    result ={}
    try:
        postData = request.get_json()
        name = postData.get("name")
        description = postData.get("description")
        category = postData.get("category")
        taskIO.updateTask(name,category,description)
    except:
        result['status'] = 'fail'
        return json.dumps(result,ensure_ascii=False)
    else:
        result['status'] = 'success'
        return json.dumps(result,ensure_ascii=False)


#按照任务查询标签
@app.route('/task/getLabelsByTask', methods=['POST'])
def fetch_label_byTask():
    inputData = request.get_json()
    name = inputData.get("name")
    print("get labels by task:")
    print(name)

    labels = taskIO.getLabelsByTask(name)
    print(json.dumps(labels,ensure_ascii=False))
    return json.dumps(labels,ensure_ascii=False)

# #按照类别查询标注-标签对照表
# @app.route('/configuration/getLabelsByCategory', methods=['POST'])
# def fetch_label_byCategory():
#     inputData = request.get_json()
#     category = inputData.get("category")
#     print("get labels by category:")
#     print(category)
#
#     labels = configIO.getLabelsByCategory(category)
#     print(json.dumps(labels,ensure_ascii=False))
#     return json.dumps(labels,ensure_ascii=False)









@app.route('/notation', methods=['GET'])
def notation_page():
    return load_ref("notation.html")


#这里针对next(cursor)拿到的是空从而报错的情况做了一些处理
@app.route('/notation/get-sentence', methods=['POST'])
def get_notation_sentence():
    inputData = request.get_json()
    database = inputData.get("database")
    cursor = nio.get_raw_randomly_fromDatabase(database)
    try:
        result = {}
        result['msg']=next(cursor)
        result['status']='success'
        return json.dumps(result, ensure_ascii=False)
    except StopIteration:
        size = nio.get_size_of_database(database)
        if size == 0:
            result={}
            result['msg']="数据库'"+database+"'中的所有语句都已经被处理，现在请返回任务界面"
            result['status']='fail'
            return json.dumps(result, ensure_ascii=False)

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
    output['标注']={}
    output['分类']={}

    notation_content = {}
    classification_content={}

    for database in databases:
        type = configIO.getCategoryOfDatabase(database)
        if(type == 'notation'):
            notation_content[database] = configIO.getSubmittedSentencesFromDatabase(database)
        else:
            classification_content[database] = configIO.getSubmittedSentencesFromDatabase(database)

    output['标注']['数据库'] = notation_content
    output['分类']['数据库'] = classification_content


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
    #app.run(host="192.168.68.11", port=8888)
# end
