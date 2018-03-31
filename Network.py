import json

from utl import count as time_count

from IO import CorpusIO
from IO import TextIO
import networkx as nx
from ResultReference import is_chinese


class CorpusGraph:
    def __init__(self):
        self.corpus = nx.DiGraph()
        self.reversed_corpus_cache = None
        self.corpus_io = CorpusIO()

    # 需要mongodb
    def build_corpus(self):
        edges_gen = self.corpus_io.read_from_mongo(limit=None)
        for edge in edges_gen:
            self.corpus.add_edge(edge[0], edge[1], weight=edge[2])

    # 将语料库的networkx实例转为json
    def to_json(self):
        json_obj = nx.to_dict_of_dicts(self.corpus)
        return json_obj

    # 将语料库的networkx实例存入硬盘，以json文件的形式
    def save_as_json(self, path='./data/corpus.json'):
        json_obj = self.to_json()
        self.corpus_io.save_as_json(json_obj, path)

    # 从json文件读取一个networkx的语料库实例
    def load_from_json(self, path='./data/corpus.json'):
        print("loading corpus json file: " + str(path))
        json_obj = self.corpus_io.load_as_json(path)
        print("loaded")
        self.corpus = nx.from_dict_of_dicts(json_obj, create_using=self.corpus)

    def get_edge_weight(self, start, end):
        weight = 0
        try:
            weight = self.corpus[start][end]['weight']
        except KeyError:
            pass
        return weight

    def reverse(self):
        if self.reversed_corpus_cache is None:
            self.reversed_corpus_cache = self.corpus.reverse()

        tmp = self.corpus
        self.corpus = self.reversed_corpus_cache
        self.reversed_corpus_cache = tmp

    # 对于给定的字（key），取前K个最大的后接字
    def get_sorted_neighbour(self, key, exclude=None, K=6):
        corpus = self.corpus
        # if reverse:
        #     corpus = self.corpus.reverse()

        if key not in corpus.adj:
            return []

        nbr = corpus.adj[key]
        rs = []
        # print(nbr)
        # ########### 只需要获得前K个最大值，这里的排序可以优化(堆排序/K次冒泡排序...) ####################
        sorted_nbr = sorted(nbr.items(), key=lambda item: item[1]['weight'], reverse=True)

        j = 0
        for i in range(K - 1):
            if j >= len(sorted_nbr):
                break

            # 循环K次，如果相邻字正好是下一个字，则跳过这个相邻字
            if sorted_nbr[j][0] == exclude:
                j += 1

            if j >= len(sorted_nbr):
                break

            rs.append((sorted_nbr[j][0], sorted_nbr[j][1]['weight']))
            j += 1

        remain_cnt = 0
        remain_weight = 0
        for i in range(K - 1, len(sorted_nbr)):
            if sorted_nbr[i][0] == exclude:
                continue
            remain_cnt += 1
            remain_weight += sorted_nbr[i][1]['weight']

        rs.append(("+" + str(remain_cnt), remain_weight))

        return rs
        # print(sorted_nbr)


class TextGraph:
    def __init__(self):
        self.text_io = TextIO()
        self.text = nx.DiGraph()
        self.id_char_map = {}
        self.sentence_cnt = 0

        # 每句话的开头
        self.headers = []

    def get_sentences(self, isRandom=True):
        ss = self.text_io.get_text_from_mongo(isRandom=isRandom)
        return ss

    def build(self, sentences):
        sentence_index = 10000
        if type(sentences) != list:
            raise Exception("输入应是句子列表")
        for s in sentences:
            s = s.strip()
            s_size = len(s)
            is_header = True
            for char_index in range(s_size):
                char = s[char_index]
                id = sentence_index + char_index
                self.text.add_node(id)
                if is_header:
                    self.headers.append(id)
                    is_header = False

                self.id_char_map[id] = char
                if char_index < s_size - 1:
                    self.text.add_edge(id, id + 1)
            sentence_index += 10000

    def fill_edge(self, corpus):
        edges = self.text.edges()
        for edge in edges:
            char_start = self.id_char_map[edge[0]]
            char_end = self.id_char_map[edge[1]]
            weight = corpus.get_edge_weight(char_start, char_end)
            self.text[edge[0]][edge[1]]['weight'] = weight

    def make_json(self, corpus, path='./data/text.json'):
        time_count("make_json", print_to_console=False)
        text_json = {}
        i = 0

        for start_id, nbr in self.text.adj.items():
            start_char = self.id_char_map[start_id]
            end_char = self.id_char_map[start_id + 1] if start_id + 1 in nbr else None
            out_weight = nbr[start_id + 1]['weight'] if start_id + 1 in nbr else 0
            # print(start_char, nbr[start_id+1]['weight'] if start_id + 1 in nbr else 0, out_weight)
            nbr_out = corpus.get_sorted_neighbour(start_char, end_char)
            # nbr_in = corpus.get_sorted_neighbour(start_char, end_char, reverse=True)
            text_json[i] = {"char": start_char, "outWeight": out_weight, "neighbour_out": nbr_out, "neighbour_in": None}
            i += 1
        time_count("获取后接词")

        i = 0
        corpus.reverse()
        for start_id, nbr in self.text.adj.items():
            start_char = self.id_char_map[start_id]
            end_char = self.id_char_map[start_id + 1] if start_id + 1 in nbr else None
            # out_weight = nbr[start_id + 1]['weight'] if start_id + 1 in nbr else 0
            # print(start_char, nbr[start_id+1]['weight'] if start_id + 1 in nbr else 0, out_weight)
            # nbr_out = corpus.get_sorted_neighbour(start_char, end_char)
            nbr_in = corpus.get_sorted_neighbour(start_char, end_char)
            text_json[i]["neighbour_in"] = nbr_in
            i += 1
        corpus.reverse()
        time_count("获取前接词")

        # def get_next(item):
        #     global i
        #     global text_json
        #     start_id = item[0]
        #     nbr = item[1]
        #     start_char = self.id_char_map[start_id]
        #     end_char = self.id_char_map[start_id + 1] if start_id + 1 in nbr else None
        #     out_weight = nbr[start_id + 1]['weight'] if start_id + 1 in nbr else 0
        #     nbr_out = corpus.get_sorted_neighbour(start_char, end_char)
        #     # nbr_in = corpus.get_sorted_neighbour(start_char, end_char, reverse=True)
        #     text_json[i] = {"char": start_char, "outWeight": out_weight, "neighbour_out": nbr_out,
        #                     "neighbour_in": ""}
        #     i += 1
        #
        # def get_previous(item):
        #     global text_json
        #     start_id = item[0]
        #     nbr = item[1]
        #     start_char = self.id_char_map[start_id]
        #     end_char = self.id_char_map[start_id + 1] if start_id + 1 in nbr else None
        #     nbr_in = corpus.get_sorted_neighbour(start_char, end_char, reverse=True)
        #     text_json[i]["neighbour_in"] = nbr_in
        #
        # items = self.text.adj.items()
        # map(get_next, items)
        # time_count("获取后接字")
        # corpus.reverse()
        # map(get_previous, items)
        # corpus.reverse()
        # time_count("获取前接字")

        if path is not None:
            json.dump(text_json, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=4)
            print("text json ready at: " + path)
        return text_json

    # 按照阈值切边分词
    def cut(self):
        adj = self.text.adj
        rs = []
        for header in self.headers:
            current = header
            pre_weight = 0
            buffer_word = ""
            words = []
            while current in adj:
                current_char = self.id_char_map[current]
                # print("=>" + current_char)

                # 当前字出边的权重
                current_weight = self.text[current][current + 1]['weight'] if current + 1 in adj else 0

                # 当前字出边权重为0，说明当前字是词尾
                if current_weight == 0:
                    buffer_word += str(current_char)
                    if is_chinese(buffer_word):
                        words.append(buffer_word)
                    buffer_word = ""
                else:
                    # 这里的阈值可以修改，pre_weight是当前字的入边
                    if pre_weight / current_weight < 0.7:
                        if is_chinese(buffer_word):
                            words.append(buffer_word)
                        buffer_word = current_char
                    elif pre_weight / current_weight > 1.4:
                        buffer_word += current_char
                        if is_chinese(buffer_word):
                            words.append(buffer_word)
                        buffer_word = ""
                    else:
                        buffer_word += current_char

                # print("%f\t\t\tbuffer:%s |" % (current_weight, buffer_word))
                pre_weight = current_weight
                current += 1
                # print(words)
            rs.append(words)
        return rs
