import re
from pymongo import MongoClient
import random
import json
from utl import count as time_counter


class NotationIO:
    def __init__(self):
        # self.test_db = MongoClient('localhost', 27017).get_database("tokenizer_qiao").get_collection('sentences_sample')
        self.test_db = MongoClient('localhost', 27017).get_database("tokenizer_qiao").get_collection(
            #'sentence4test')
        'TextLibrary')

        self.test_size = self.test_db.find().count()
        self.test_cursor = self.test_db.find()
        self.train_db = MongoClient('localhost', 27017).get_database("tokenizer_qiao").get_collection(
            'TextTrained')

    def get_raw_randomly(self):
        for doc in self.test_cursor:
            if random.random() > 0.3:
                yield doc


    def get_raw_randomly_fromDatabase(self,database):
        cursor = self.test_db.find({'database':database})
        for doc in cursor:
            if random.random() > 0.3:
                yield doc

    def get_size_of_database(self,database):
        return self.test_db.find({'database':database}).count()



    def move_to_train(self, noted_doc):
        doc = noted_doc
        former_doc = self.test_db.find_one({"_id": noted_doc["_id"]})
        doc['database'] = former_doc['database']
        self.train_db.insert_one(doc)
        self.test_db.delete_one({"_id": noted_doc["_id"]})

    def getSubmittedSentences(self):
        cursor = self.train_db.find({})
        sentences = [doc for doc in cursor]
        return sentences










class RemoteIO:
    def __init__(self):
        time_counter(print_to_console=False)
        print("初始化 RemoteIO")
        self.db = MongoClient('localhost', 27017).get_database("tokenizer_qiao").get_collection('splited_sentences')
        self.sentence_size = self.db.find().count()
        self.step = self.sentence_size
        self.skip = 0
        time_counter("初始化完毕")

    def refresh(self):
        self.__init__()

    def read_sentence_randomly(self):
        while self.skip + self.step >= self.sentence_size:
            print("skip:%d, step:%d, size:%d" % (self.skip, self.step, self.sentence_size))
            if self.step == 0:
                return None
            self.skip = 0
            self.step = int(self.step / 2)
        if self.step + self.skip < self.sentence_size:
            random_step = random.randint(0, self.step)
            # print("获取 skip:%d" % self.skip+random_step)
            pipeline = [
                {"$skip": self.skip + random_step},
                {"$limit": 1}
            ]
            self.skip += random_step
            docs = list(self.db.aggregate(pipeline))
            doc = docs[0] if len(docs) > 0 else None
            self.db.update({"_id": doc["_id"]}, {"$inc": {"analysed": 1}})
            time_counter("已获取到")
            return doc
        else:
            return None

    def read_sentence_from_remote(self):
        db = self.db
        return db.find()


class CorpusIO:
    def __init__(self):
        self.db = None

    # 从数据库构造语料库
    def read_from_mongo(self, limit=20):
        db = self.db if self.db is not None else MongoClient('localhost', 27017).get_database(
            'tokenizer_qiao').get_collection('edges')
        cursor = db.find({})
        cnt = 0
        for doc in cursor:
            if limit is not None and cnt > limit:
                break
            cnt += 1
            if cnt % 10000 == 0:
                print(cnt)
            edge = (doc['src'], doc['des'], doc['weight'])
            yield edge

    def save_as_json(self, corpus_json, path):
        file = open(path, 'w', encoding='utf-8')
        json.dump(corpus_json, file, ensure_ascii=False)
        print('corpus network saved to %s' % path)

    def load_as_json(self, path):
        file = open(path, 'r', encoding='utf-8')
        corpus_json = json.load(file)
        return corpus_json


class TextIO:
    def __init__(self):
        self.db = MongoClient('localhost', 27017).get_database('chinese').get_collection('train')

    def get_mongo_size(self):
        size = self.db.count()
        # print("size: %d" % size)
        return size

    def get_text_from_mongo(self, skip=0, limit=1, isRandom=True):
        size = self.get_mongo_size()
        if isRandom:
            skip = random.randint(0, size - limit)

        cursor = self.db.find().skip(skip).limit(limit)
        for doc in cursor:
            yield doc['text']


class DisIO:
    def __init__(self):
        self.db = MongoClient('localhost', 27017).get_database('orig').get_collection('sentences')

    def sen_from_mongo(self):
        cursor = self.db.find({})
        str = ""
        for sen in cursor:
            str = str + sen['text']
        return str

    def re_to_text(self, path, cut=[]):
        jieba_sum = 0.0
        thulac_sum = 0.0
        dis = open(path, 'a', encoding='utf-8')
        length = len(cut)
        for i in range(0, length):
            jieba_sum += cut[i]["jieba_overlap"]
            thulac_sum += cut[i]["thulac_overlap"]
            dis.write("origin: " + cut[i]["sentence"] + "\n")
            dis.write("result: " + str(cut[i]["result"]) + "\n")
            dis.write("jieba:  " + str(cut[i]["jieba"]) + "  " + str(cut[i]["jieba_overlap"]) + "\n")
            dis.write("thulac: " + str(cut[i]["thulac"]) + "  " + str(cut[i]["thulac_overlap"]) + "\n\n")
        dis.write(
            "jieba:" + "n/a" if length == 0 else str(jieba_sum / length) + "  thulac:" + "n/a" if length == 0 else str(
                thulac_sum / length) + "\n")
        dis.close()



class ConfigurationIO:
    def __init__(self):
        self.config_db = MongoClient('localhost', 27017).get_database("tokenizer_qiao").get_collection(
            'TextLibrary')

        self.train_db = MongoClient('localhost', 27017).get_database("tokenizer_qiao").get_collection(
            'TextTrained')

        self.label_db = MongoClient('localhost', 27017).get_database("tokenizer_qiao").get_collection(
            'Labels')

        # self.label_db.delete_many({})
        # labels = [{"notation": "人名&机构名", "label": "protagonist"}, {"notation": "地名", "label": "location"},
        #           {"notation": "法规名", "label": "regulation"}]
        # for obj in labels:
        #     self.label_db.insert_one({'notation': obj['notation'], 'label': obj['label']})

        print('configuration initialization done')


    def insertTextIntoDatabase(self, sentences,database):
        if(self.config_db.find().count() == 0 and self.train_db.find().count() == 0):
            max_id = 0

        elif(self.config_db.find().count() == 0 and self.train_db.find().count() != 0):
            max_id = self.train_db.find_one(sort=[("_id", -1)])["_id"]

        elif (self.config_db.find().count() != 0 and self.train_db.find().count() == 0):
            max_id = self.config_db.find_one(sort=[("_id", -1)])["_id"]

        elif(self.config_db.find().count() != 0 and self.train_db.find().count() != 0):
            max_id = max(self.config_db.find_one(sort=[("_id", -1)])["_id"],self.train_db.find_one(sort=[("_id", -1)])["_id"])




        sentence_state = [{"_id": index+1+max_id, "text": s, "database":database} for index, s in enumerate(sentences)]
        saveJsonObj = json.dumps(sentence_state,ensure_ascii=False)
        print(saveJsonObj)
        #self.config_db.delete_many({})
        self.config_db.insert(json.loads(saveJsonObj))





    def getLabels(self):
        cursor = self.label_db.find({})
        notationToLabel = [{"notation" : doc['notation'], "label" : doc['label'] } for doc in cursor]
        return notationToLabel

    def getLabelExport(self):
        cursor = self.label_db.find({},{'_id':0})
        data = [doc for doc in cursor]
        return data





    def insertLabels(self, labelPairs):
        print(labelPairs)
        self.label_db.delete_many({})
        self.label_db.insert(json.loads(labelPairs))


    def getTrainedDatabases(self):
        cursor = self.train_db.find({'_id':{'$gt': 0}} , {'database':1 })
        list = []
        for item in cursor:
            if item['database'] not in list:
                list.append(item['database'])
        return list

    def getUntrainedDatabases(self):
        cursor = self.config_db.find({'_id':{'$gt': 0}} , {'database':1 })
        list = []
        for item in cursor:
            if item['database'] not in list:
                list.append(item['database'])
        return list

    def getSubmittedSentencesFromDatabase(self, database):
        text = 'database:' + database
        trainCursor = self.train_db.find({"database": database},{"database":0,"id":0})
        data = [doc for doc in trainCursor]
        return data