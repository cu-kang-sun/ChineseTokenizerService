import time

previous = time.time()


def count(label="no label", print_to_console=True):
    current = time.time()
    global previous
    diff = current - previous
    previous = current
    if print_to_console:
        print("#timer# %s：%.4fs" % (label, diff))
    return diff

#
# timer = Timer()
# print(timer.count())
# for i in range(100000):
#     x = 123+123
# print(timer.count())
