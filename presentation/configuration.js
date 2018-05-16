



var app = new Vue({
    el: "#app",
    data: {

        notationPairs:[

        ],
        classificationPairs:[

        ],
        databases:[

        ],
        type:'notation'
    },

    methods: {

        getDatabases: function () {
            var self = this;
            $.ajax({
                url: '/configuration/getDatabases',
                method: 'GET',
                success: function (data) {
                    var jsonObj = $.parseJSON(data);
                    console.log(jsonObj);
                    for (var i=0; i < jsonObj.length; i++) {
                        self.databases.push(jsonObj[i]);
                    }
                    console.log(self.databases);
                },
                error: function (error) {
                    console.log(error);
                }
            });
        },

        abandonLabelChanges: function() {
            location.reload();
        }

        ,


        getLabels: function () {
            var self = this;
            $.ajax({
                url: '/configuration/getLabels',
                method: 'GET',
                success: function (data) {
                    var jsonObj = $.parseJSON(data);
                    console.log(jsonObj);
                    for (var i=0; i < jsonObj.length; i++) {
                        if(jsonObj[i]["category"] === 'notation'){
                            self.notationPairs.push(jsonObj[i]);
                        }else{
                            self.classificationPairs.push(jsonObj[i]);
                        }

                    }


                },
                error: function (error) {
                    console.log(error);
                }
            });
        },

        deleteTextDb: function(category){
            var dbName = document.getElementById(category+'-presentDb').value;
            if(dbName.trim() === ''){
                return;
            }
            var postData={};
            postData['dbName']=dbName;
            $.ajax({
                url: "/configuration/delete-db",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(postData),
                type: "POST",
                success: function (res) {
                    var response = null;
                    if(typeof(res) === 'object'){
                        response = res;
                    }else{
                        response = JSON.parse(res);
                    }

                    if(response['status'] === 'success'){
                        var msg="名为'"+dbName+"'的数据库已被删除";
                        alert(msg);
                        document.getElementById(category+'-presentDb').value="";
                    }else{
                        alert("删除数据库失败!");
                    }
                },
                error: function (err) {
                    alert("删除过程出错！");
                }
            });
        },

        uploadFile: function(category){

            var self=this;

                  if(document.getElementById(category+'-file').value.trim() === "") {
                      alert("请选择需要上传的文件！");
                      return;
                  }

                  var fileName = document.getElementById(category+'-file').value;

                  if(!fileName.endsWith(".txt")){
                      alert("请重新选择上传文件，只接受.txt类型的文件");
                      return;
                  }

                  if(document.getElementById(category+'-description').value.trim() === "") {
                      alert("请输入关于任务的描述并且描述不能为空!");
                      return;
                  }

                  var name = document.getElementById(category+'-databaseName').value;;
                  if(name.trim() === "") {
                      alert("请对您要上传的数据库进行命名，否则您将无法上传!");
                      return;
                  }
                      let data = new FormData();
                      data.append('file', document.getElementById(category+'-file').files[0]);
                      data.append('name',name);
                      data.append('type',$("#tabs .active").attr('value'));
                      data.append('description',document.getElementById(category+'-description').value);



                                  $.ajax({
                                    url: "/configuration/upload",
                                      contentType: false,
                                    processData: false,
                                    data: data,
                                    type: "POST",
                                    success: function (res) {

                                        console.log(res);
                                        var response = JSON.parse(res);


                                        if(response['status'] === 'fail'){
                                            console.log("upload file fail");
                                            alert(response['msg']);
                                        }else{

                                           // self.deleteTextDb(category);

                                            console.log("upload file success");
                                            alert(response['msg']);
                                            // self.getDatabases();
                                            document.getElementById(category+"-upload").reset();
                                            document.getElementById(category+'-presentDb').value=name;

                                        }



                                    },
                                    error: function (err) {
                                        alert("上传文件出现错误，请确保您上传的文件的编码为utf-8");
                                        window.location.reload();


                                        console.log(err);

                                    }
                                })


                // }

        },
        decideType: function(){
          var self = this;
          var value =  $("#tabs .active").attr('value');
          if(value === 'notation'){
                self.type="标注";
            }else{
                self.type="类别";
            }

        },

        deleteAllUnusedRows: function(){
            var value =  $("#tabs .active").attr('value');
            inputLabels = {};

            var self = this;



            actionData={};

            actionData['category']=value;
            $.ajax({
                url: "/configuration/delete-unused-labels",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(actionData),
                type: "POST",
                success: function (res) {
                    console.log(res);


                },
                error: function (err) {
                    alert("您的标签删除出现错误");
                    console.log(err);

                }
            });


        },
        submitLabelChanges:function(){
            if(document.getElementById('new_mark').value.trim() === '' || document.getElementById('new_tag').value.trim()
                    === ''){
                alert("请确保您填写的值不为空！");
                return;
            }
            var value =  $("#tabs .active").attr('value');
            inputLabels = {};
            var self = this;
            inputLabels['notation']=document.getElementById('new_mark').value;
            inputLabels['label']=document.getElementById('new_tag').value;
            if(value === 'notation') {
                for (let pair of self.notationPairs) {
                    if(pair['notation'] === inputLabels['notation']|| pair['label'] ===inputLabels['label']){
                        alert("此标签已经存在！请重命名");
                        return;
                    }
                }
                self.notationPairs.push(inputLabels);
                var tableRef = document.getElementById('notationTable').getElementsByTagName('tbody')[0];
                var row   = tableRef.insertRow(tableRef.rows.length);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                cell1.innerHTML = inputLabels['notation'];
                cell2.innerHTML = inputLabels['label'];
                console.log(self.notationPairs);
            }else{
                for (let pair of self.classificationPairs) {
                    if(pair['notation'] === inputLabels['notation']|| pair['label'] ===inputLabels['label']){
                        alert("此标签已经存在！请重命名");
                        return;
                    }
                }
                self.classificationPairs.push(inputLabels);
                var tableRef = document.getElementById('classificationTable').getElementsByTagName('tbody')[0];
                var row   = tableRef.insertRow(tableRef.rows.length);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                cell1.innerHTML = inputLabels['notation'];
                cell2.innerHTML = inputLabels['label'];
                console.log(self.classificationPairs);
            }
            $('#myModal').modal('hide');
            document.getElementById('new_mark').value = "";
            document.getElementById('new_tag').value = "";
            //window.location.reload();
        },


        startWork: function (category) {
            //收集所有的标签
            //收集文本库名称
            if(document.getElementById(category+'opts').value.trim() === ""){
                alert("目前数据库中没有文本，请上传数据库");
                return;
            }

            var oTable = null;
            if(category === 'notation'){
                oTable = document.getElementById('notationTable').getElementsByTagName('tbody')[0];
            }else{
                oTable = document.getElementById('classificationTable').getElementsByTagName('tbody')[0];
            }
            //var oTable = document.getElementById('labelTable').getElementsByTagName('tbody')[0];


            var rowLength = oTable.rows.length;
            if(rowLength == 0){
                alert("您尚未设置任何用于使用的标签，请添加标签后再进行工作");
                return;
            }
            // alert(rowLength);


                actionData = {};
                var name = category + 'opts';
                actionData['database']=$( "#"+name ).val();
                // alert( actionData['database']);
                actionData['category']=category;
                console.log('actionData');
                console.log(actionData);

                $.ajax({
                    url: "/configuration/start-notation",
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(actionData),
                    type: "POST",
                    success: function (res) {
                         window.location.replace("notation.html");

                    },
                    error: function (err) {
                        console.log(err);

                    }
                })
        },



    }
    //,
    // beforeMount(){
    //     this.getLabels();
    //     this.getDatabases();
    // }

});
