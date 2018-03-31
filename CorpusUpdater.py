import sys

from Network import CorpusGraph

cmds = sys.argv

cg = CorpusGraph()

if "build" in cmds and "toJson" in cmds:
    cg.build_corpus()
    cg.save_as_json()
