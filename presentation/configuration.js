


var app = new Vue({
    el: "#app",
    data: {
        notationPairs:[

        ],
        classificationPairs:[

        ],
        databases:[

        ]
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

        uploadFile: function(){
            var self = this;
            var file = document.getElementById('databaseName');
            console.log(file);

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
        submitLabelChanges:function(){
            var value =  $("#tabs .active").attr('value');

            inputLabels = [];

            var self = this;

            var oTable = null;
            if(value === 'notation'){
                oTable = document.getElementById('notationTable').getElementsByTagName('tbody')[0];
            }else{
                oTable = document.getElementById('classificationTable').getElementsByTagName('tbody')[0];
            }
            //var oTable = document.getElementById('labelTable').getElementsByTagName('tbody')[0];


            var rowLength = oTable.rows.length;

            for (i = 0; i < rowLength; i++) {
                var oCells = oTable.rows.item(i).cells;

                singlePair = {'notation':oCells.item(0).innerText.trim(), 'label':oCells.item(1).innerText.trim(), 'category':value};
                inputLabels.push(singlePair);

            }
            actionData={};
            actionData['labels']=JSON.stringify(inputLabels);
            actionData['category']=value;

            console.log(actionData);
            $.ajax({
                url: "/configuration/submit-label",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(actionData),
                type: "POST",
                success: function (res) {
                     alert("您的标签已经被更新");

                },
                error: function (err) {
                    alert("您的标签更新出现错误");
                    console.log(err);

                }
            })




        },

        startWork: function (category) {


            actionData = {};

            actionData['database']=$( "#opts" ).val();
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
