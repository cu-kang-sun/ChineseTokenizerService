from IO import CorpusIO
from Network import CorpusGraph
from Network import TextGraph


def test_text():
    cg = CorpusGraph()

    # 从json文件读取语料库模型
    # cg.load_from_json()

    # 连接mongodb建立语料库模型
    cg.build_corpus()

    # 保存为json文件
    cg.save_as_json()

    tg = TextGraph()

    # 从mongodb读取句子，以便分词
    # sentences = tg.get_sentences(isRandom=False)

    sentences = ["准许原告肖振明撤回起诉"]

    # 对句子数组建立图模型
    tg.build(sentences)

    # 填入边的权重
    tg.fill_edge(cg)

    # 输出语句图需要的json文件, path如果为None则返回json，而不保存在硬盘
    tg.make_json(cg, path='./data/text.json')


# test_text()
def make_local_mongo():
    corpusio = CorpusIO()
    corpusio.fetch_sentences_from_remote()


make_local_mongo()
