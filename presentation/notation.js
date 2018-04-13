// var emptyJson = {
//     protagonist: {
//         contains: false,
//         names: []
//     },
//     location: {
//         contains: false,
//         names: []
//     },
//     regulation: {
//         contains: false,
//         names: []
//     }
// };

var colorList = ['lightblue','forestgreen','tomato', 'mediumslateblue','purple','mediumorchid ','peru ','plum ','darkred ','yellowgreen ','darkkhaki ','rosybrown ','pink','navy'];
//
// var labels = [];

function copyJson(old)
{
    return JSON.parse(JSON.stringify(old));
}

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1);});
}

function toOption(str)
{
    return 'is'+toTitleCase(str);
}

function toLabel(str)
{
    var labelStr = str.substring(2,str.length).replace(/\w\S*/g, function(txt){return txt.charAt(0).toLowerCase() + txt.substr(1);});
    return labelStr;
}


var controller = new Vue({
    el: "#controller",
    data: {
        action: "获取",
        // charsIndices: [],
        // protagonistFlags: [],
        // locationFlags: [],
        // regulationFlags: [],
        // peekFlags: [],
        length: 0,

        charInfos: [],

        start: null,
        end: null,
        category:null,

        notation: {
            x: 0,
            y: 0,
            visible: false
        },
        emptyJson: {},
        labelPairs: [],///[{"label": "protagonist", "notation": "人名&机构名"}, {"label": "location", "notation": "地名"}, {"label": "regulation", "notation": "法规名"}, {"label": "project", "notation": "项目名"}]
        labelChecks: [],// ['isLocation','isRegulation']
        json: {},
        _id: null,
        text: "",
        colorPairs: {},
        ciClass: ""

    },
    methods: {


        initialData: function (){
            var self = this;
            console.log('create vue now');

            $.ajax({
                url: "/configuration/get-category",
                type: "get",
                success: function (res) {
                    console.log("get category success");
                    console.log(res);
                    self.category=res;


                                actionData={};
                                actionData['category']=self.category;
                                console.log("action data");
                                console.log(actionData);
                                $.ajax({
                                    url: '/configuration/getLabelsByCategory',
                                    contentType: "application/json",
                                    dataType: "json",
                                    data: JSON.stringify(actionData),
                                    method: 'POST',
                                    success: function (data) {
                                        console.log(data);
                                        //console.log(typeof(data));
                                        var jsonObj = null;
                                        if(typeof(jsonObj) === 'object'){
                                            jsonObj=data;
                                        }else{
                                            jsonObj = $.parseJSON(data);
                                        }


                                        //var jsonObj = $.parseJSON(data);

                                        if(jsonObj.length > 14) {
                                            console.log('too many labels, the color used in the labels will be the same if the number of the notations is larger than 14');
                                            alert("too many labels, the color used in the labels will be the same if the number of the notations is larger than max ")
                                        }

                                        for (var i=0; i < jsonObj.length; i++) {
                                            self.labelPairs.push(jsonObj[i]);
                                            self.labelChecks.push(toOption(jsonObj[i]['label']));
                                            self.emptyJson[jsonObj[i]['label']] = {};
                                            self.emptyJson[jsonObj[i]['label']]['contains'] = 'false';
                                            self.emptyJson[jsonObj[i]['label']]['names'] = [];
                                            self.colorPairs[jsonObj[i]['label']] = colorList[i%colorList.length];
                                        }

                                        ////////////////////////////////////////
                                        var sheets = document.styleSheets; // returns an Array-like StyleSheetList
                                        var sheet = document.styleSheets[0];

                                        for (let pair of self.labelPairs) {
                                            self.addCSSRule(sheet, '.' + pair['label'], 'background-color:' + self.colorPairs[pair['label']] + '; color: whitesmoke; ', 1);
                                        }



                                        self.ciClass +=  "{peek:ci.isPeeked";
                                        for (let pair of self.labelPairs) {
                                            self.ciClass += "," + pair['label'] + ": " + "ci." + toOption(pair['label']);
                                        }
                                        self.ciClass += "}";


                                        /////////////////////////////////////

                                        console.log('ciclass');
                                        console.log(self.ciClass);
                                        console.log(self.labelPairs);
                                        console.log(self.emptyJson);
                                        console.log(JSON.stringify(self.emptyJson));
                                        console.log(self.labelChecks);
                                        console.log(self.colorPairs);
                                        self.json = copyJson(self.emptyJson);
                                    },
                                    error: function (error) {
                                        console.log(error);
                                        alert("get labels err!");
                                    }
                                });





                },error: function (error) {
                    console.log(error);
                    alert("get category err!")
                }
            });



            console.log('finish data initialization');
        },

        addCSSRule: function (sheet, selector, rules, index) {
            if("insertRule" in sheet) {
                sheet.insertRule(selector + "{" + rules + "}", index);
            }
            else if("addRule" in sheet) {
                sheet.addRule(selector, rules, index);
            }
        },

        getClassObj:function(ci){


        },
        returnHome:function(){
            window.location.href = "configuration.html";
        },

        getRawSentence: function () {
            var self = this;
            // self.action = "正在获取";
            console.log("get raw sentence");
            $.ajax({
                url: "/notation/get-sentence",
                dataType: "json",
                type: "get",
                success: function (res) {

                    console.log("get raw sentence success");
                    // self.action = "提交";
                    self.charInfos = [];
                    self.start = null;
                    self.end = null;
                    console.log(res);
                    self._id = res._id;
                    self.text = res.text;

                    self.json = {};
                    self.json['_id'] = res._id;
                    self.json['text'] = res.text;
                    for (var key in self.emptyJson) {
                        self.json[key] = self.emptyJson[key];
                    }



                    //
                    //
                    // self.json = {
                    //     _id: res._id,
                    //     text: res.text,
                    //     protagonist: {
                    //         contains: false,
                    //         names: []
                    //     },
                    //     regulation: {
                    //         contains: false,
                    //         names: []
                    //     },
                    //     location: {
                    //         contains: false,
                    //         names: []
                    //     }
                    // };





                    var chars = res.text.split("");
                    chars.forEach(function (char, index) {
                        var tmpJson = {};
                        tmpJson['char'] = char;
                        tmpJson['index'] = index;
                        for (let labelCheck of self.labelChecks) {
                            tmpJson[labelCheck] = false;
                        }
                        tmpJson['isPeeked'] = false;
                        tmpJson['status'] = '';

                        self.charInfos.push(tmpJson);



                    });
                    self.length = self.charInfos.length;
                    console.log(self.charInfos);
                },
                error: function (err) {
                    alert("已经获取完本数据库中的句子，请返回配置页面重新选择数据库进行处理");
                    console.log("get raw sentence fail");
                    console.log(err);
                    // window.location.replace("notation.html");
                }
            });
        },

        peek: function (index) {
            // console.log(index);
            if (this.start !== null && this.end !== null) {
                return
            }
            for (var i = 0; i < this.length; i++) {
                //this.charInfos[i].isPeeked = this.start !== null && this.end === null && i >= this.start && i <= index;

                if(this.start !== null && this.end === null && i >= this.start && i <= index){
                    this.charInfos[i].isPeeked = true;
                    this.charInfos[i].status = 'peek';
                }else{
                    this.charInfos[i].isPeeked = false
                }


            }
        },

        select: function (index) {
            if (this.start === null && this.end === null) {
                // 开始选择
                this.start = index;
            } else if (this.start !== null && this.end === null && index >= this.start) {
                // 选择完成
                this.end = index;
                this.notation.visible = true;
                var e = event || window.event;
                // console.log(e);
                this.notation.x = e.clientX;
                this.notation.y = e.clientY;
            }
        },

        // getState: function (stateName, index) {
        //
        //     switch (stateName){
        //         case "peek": return this.peekFlags[index];
        //
        //     }
        // },
        submit: function () {
            // this.action = "提交中";
            var self = this;
            var actionData = null;
            if(self.category === 'notation'){
                console.log("now submit a notation work!");
                actionData=self.json;
                actionData['category'] = 'notation';
            }else{
                console.log("now submit a classification work!");
                actionData={};
                actionData['_id']=self.json['_id'];
                actionData['text']=self.json['text'];
                //actionData['database']=self.json['database'];
                actionData['category']='classification';
                var choice=document.getElementById("radioForm").querySelector('input[name="optionsRadios"]:checked').value;
                console.log("radio choice:"+ choice);
                actionData['genre']=choice;
            }

            $.ajax({
                url: "/notation/submit-notation",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(actionData),
                type: "POST",
                success: function (res) {
                    self.getRawSentence();

                },
                error: function (err) {
                    console.log(err);

                }
            });
        },

        exportNotation: function(){
            var self = this;

            $.ajax({
                url: "/notation/export-notation",
                contentType: "application/json",
                type: "GET",
                success: function (res) {
                    //res.replace(/\"/g,"'");
                    //console.log(res);
                    // var obj = res.parseJSON();
                    //console.log(JSON.stringify(res));

                     console.log("start export");
                     self.download(res, 'result.txt', 'text/plain');
                     //window.location.href = "configuration.html";

                    //是否结束这次标注
                },
                error: function (err) {
                    console.log(err);
                }
            });
        },

        download:function (text, name, type) {
            var a = document.createElement("a");
            var file = new Blob([text], {type: type});
            a.href = URL.createObjectURL(file);
            a.download = name;
            a.click();
        },


        setState: function (stateName) {
            var self = this;
            var setRange = function (from, to, field) {
                for (var i = from; i <= to; i++) {
                    var info = self.charInfos[i];

                    console.log(info);

                    for (let labelCheck of self.labelChecks) {
                        info[labelCheck] = false;
                    }

                    // info.isProtagonist = false;
                    // info.isLocation = false;
                    // info.isRegulation = false;

                    info.isPeeked = false;
                    info.status = '';
                    if (field) {
                        info[field] = true;

                        info.status = toLabel(field);

                    }
                    console.log('info');
                    console.log(info);

                }
            };


            //handle stateName
            if(stateName === 'cancel'){
                setRange(this.start, this.end, null);
                this.getJson();

            }else{
                var ifExist = 0;
                for (let pair of self.labelPairs) {
                    if(stateName === pair['label']){
                        //console.log('statement');
                        //console.log(stateName);

                        setRange(this.start, this.end, toOption(stateName));
                        this.getJson();
                        ifExist = 1;
                        break;
                    }
                }

                if(ifExist == '0'){
                    console.error("no such field " + stateName);
                }
            }


            // switch (stateName) {
            //     case "cancel":
            //         setRange(this.start, this.end, null);
            //         this.getJson();
            //         break;
            //         /////////////////////////////////////todo
            //     case "protagonist":
            //         setRange(this.start, this.end, "isProtagonist");
            //         this.getJson();
            //         break;
            //     case "location":
            //         setRange(this.start, this.end, "isLocation");
            //         this.getJson();
            //         break;
            //     case "regulation":
            //         setRange(this.start, this.end, "isRegulation");
            //         this.getJson();
            //         break;
            //     default:
            //         console.error("no such field " + stateName);
            // }


            this.notation.visible = false;
            this.start = null;
            this.end = null;

        },

        getJson: function () {
            var self = this;
            this.json = copyJson(this.emptyJson);
            this.json["_id"] = this._id;
            this.json["text"] = this.text;
            /////////////////////////////////////todo
            var bufferJson = {};
            for (let labelCheck of self.labelChecks) {
                 bufferJson[labelCheck] = {};
                 bufferJson[labelCheck]['text'] = "";
                 bufferJson[labelCheck]['start'] = null;
                 bufferJson[labelCheck]['end'] = null;
            }


            //console.log('buffer json');
            //console.log(bufferJson);




            // var protagonistBuffer = {
            //     text: "",
            //     start: null,
            //     end: null
            // };
            // var locationBuffer = {
            //     text: "",
            //     start: null,
            //     end: null
            // };
            // var regulationBuffer = {
            //     text: "",
            //     start: null,
            //     end: null
            // };
            var emptyBuffer = {
                text: "",
                start: null,
                end: null
            };




            for (var i = 0; i <= this.length; i++) {

                var charInfo = this.charInfos[i];
                if(i == this.length){
                    var emptyChecks = {};
                    for (let labelCheck of self.labelChecks) {
                        emptyChecks[labelCheck] = false;
                    }
                    charInfo = charInfo || emptyChecks;
                }

                for (let labelCheck of self.labelChecks) {
                    if(charInfo[labelCheck]){
                        if (bufferJson[labelCheck].start === null) {
                            bufferJson[labelCheck].start = i;
                        }
                        bufferJson[labelCheck].end = i;
                        bufferJson[labelCheck].text += charInfo.char;
                    }else{
                        if (bufferJson[labelCheck].end !== null) {
                        // buff 有效
                        this.json[toLabel(labelCheck)].names.push(bufferJson[labelCheck]);
                        this.json[toLabel(labelCheck)].contains = true;

                        bufferJson[labelCheck] = copyJson(emptyBuffer);


                    }
                    }
                }


/*

                if (charInfo.isProtagonist) {
                    if (protagonistBuffer.start === null) {
                        protagonistBuffer.start = i;
                    }
                    protagonistBuffer.end = i;
                    protagonistBuffer.text += charInfo.char;
                } else {
                    if (protagonistBuffer.end !== null) {
                        // buff 有效
                        this.json.protagonist.names.push(protagonistBuffer);
                        this.json.protagonist.contains = true;
                        protagonistBuffer = copyJson(emptyBuffer);
                    }
                }

                if (charInfo.isLocation) {
                    if (locationBuffer.start === null) {
                        locationBuffer.start = i;
                    }
                    locationBuffer.end = i;
                    locationBuffer.text += charInfo.char;
                } else {
                    if (locationBuffer.end !== null) {
                        // buff 有效
                        this.json.location.names.push(locationBuffer);
                        this.json.location.contains = true;
                        locationBuffer = copyJson(emptyBuffer);
                    }
                }

                if (charInfo.isRegulation) {
                    if (regulationBuffer.start === null) {
                        regulationBuffer.start = i;
                    }
                    regulationBuffer.end = i;
                    regulationBuffer.text += charInfo.char;
                } else {
                    if (regulationBuffer.end !== null) {
                        // buff 有效
                        this.json.regulation.names.push(regulationBuffer);
                        this.json.regulation.contains = true;
                        regulationBuffer = copyJson(emptyBuffer);
                    }
                }*/

                // 最后冲一次缓存
                // if (protagonistBuffer.end !== null) {
                //     // buff 有效
                //     this.json.protagonist.names.push(protagonistBuffer);
                //     this.json.protagonist.contains = true;
                //     protagonistBuffer = copyJson(emptyBuffer);
                // }
                // if (regulationBuffer.end !== null) {
                //     // buff 有效
                //     this.json.regulation.names.push(regulationBuffer);
                //     this.json.regulation.contains = true;
                //     regulationBuffer = copyJson(emptyBuffer);
                // }
                // if (locationBuffer.end !== null) {
                //     // buff 有效
                //     this.json.location.names.push(locationBuffer);
                //     this.json.location.contains = true;
                //     locationBuffer = copyJson(emptyBuffer);
                // }

            }
            // alert()
            console.log(JSON.stringify(this.json));
        }
    },

    beforeMount(){
            this.initialData()
    }
});
