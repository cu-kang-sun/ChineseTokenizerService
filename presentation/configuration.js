



var app = new Vue({
    el: "#app",
    data: {
        notationPairs:[

        ],
        classificationPairs:[

        ],
        databases:[

        ],
        type:null
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

        uploadFile: function(){

                  if(document.getElementById('database-file').value.trim() === "") {
                      alert("请选择需要上传的文件！");
                      return;
                  }

                  var fileName = document.getElementById('database-file').value;
                 // alert(typeof(document.getElementById('database-file').files[0]));
                  if(!fileName.endsWith(".txt")){
                      alert("请重新选择上传文件，只接受.txt类型的文件");
                      return;
                  }



                  if(document.getElementById('description').value.trim() === "") {
                      alert("请输入关于任务的描述并且描述不能为空!");
                      return;
                  }
                  if(document.getElementById('databaseName').value.trim() === "") {
                      alert("请对您要上传的数据库进行命名，否则您将无法上传!");
                      return;
                  }



                      let data = new FormData();
                      data.append('file', document.getElementById('database-file').files[0]);
                      data.append('type',$( "#database-type" ).val());
                      data.append('name',document.getElementById('databaseName').value);
                      data.append('description',document.getElementById('description').value);



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
                                            console.log("upload file success");
                                            alert(response['msg']);
                                            // self.getDatabases();
                                            window.location.reload();
                                        }


                                    },
                                    error: function (err) {
                                        alert("上传文件出现错误，请选择另外的文件重试");
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

            // var oTable = null;
            // if(value === 'notation'){
            //     oTable = document.getElementById('notationTable').getElementsByTagName('tbody')[0];
            // }else{
            //     oTable = document.getElementById('classificationTable').getElementsByTagName('tbody')[0];
            // }
            // //var oTable = document.getElementById('labelTable').getElementsByTagName('tbody')[0];
            //
            //
            // var rowLength = oTable.rows.length;
            //
            // for (i = 0; i < rowLength; i++) {
            //     var oCells = oTable.rows.item(i).cells;
            //
            //     singlePair = {'notation':oCells.item(0).innerText.trim(), 'label':oCells.item(1).innerText.trim(), 'category':value};
            //     inputLabels.push(singlePair);
            //
            // }

            inputLabels['category']=value;
            inputLabels['notation']=document.getElementById('new_mark').value;
            inputLabels['label']=document.getElementById('new_tag').value;



            actionData={};
            actionData['newPair']=JSON.stringify(inputLabels);
            // actionData['category']=value;

            console.log(actionData);
            $.ajax({
                url: "/configuration/submit-labeladded",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(actionData),
                type: "POST",
                success: function (res) {
                    console.log(res);

                    var response = null;
                    if(typeof(response) === 'object') {

                        response=res;
                    }else{
                        response=JSON.parse(res);
                    }
                    if(response['status'] === 'success') {
                        alert("您的标签已经被更新");
                        $('#myModal').modal('hide');
                        window.location.reload();
                    }else{
                        alert(response['msg']);
                    }

                },
                error: function (err) {
                    alert("您的标签更新出现错误");
                    console.log(err);

                }
            })




        },


        startWork: function (category) {
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

        addOneRow: function () {
            var self = this;
            var value =  $("#tabs .active").attr('value');
            console.log(value);
            if(value === 'notation'){
                self.notationPairs.push({"notation": "new Notation", "label": "new Label","category":"notation"});
                 console.log(self.notationPairs);
            }else{
                self.classificationPairs.push({"notation": "new Notation", "label": "new Label","category":"classification"});
                console.log(self.classificationPairs);
            }



        },
        deleteLastRow: function () {
            var self = this;
            var value =  $("#tabs .active").attr('value');
            if(value === 'notation') {
                self.notationPairs.splice(-1, 1);
                console.log(self.notationPairs)
            }else{
                self.classificationPairs.splice(-1, 1);
                console.log(self.classificationPairs)
            }


        }

    },
    beforeMount(){
        this.getLabels();
        this.getDatabases();
    }

});
