function setModal(category, element) {
    // alert(category);
    var len = element.parentNode.parentNode.parentNode.rowIndex - 1;
    var tableId = category + "Table";
    var tableRef = document.getElementById(tableId).getElementsByTagName('tbody')[0];
    var cells = tableRef.rows[len].cells;

    var dbname = cells[0].innerText;
    var description = cells[2].innerText;
    var time = cells[3].innerText;
    var category = null;
    if(cells[1].innerText==='标注'){
        category= 'notation';
    }else{
        category='classification';
    }

    document.getElementById('edit_dbname').value = dbname;
    document.getElementById('edit_description').value = description;
    document.getElementById('edit_time').value = time;
    var select = document.getElementById("database-type");
    select.value = category;
}

function startOperation(category, element) {
    var len = element.parentNode.parentNode.parentNode.rowIndex - 1;
    var tableId = category + "Table";
    var tableRef = document.getElementById(tableId).getElementsByTagName('tbody')[0];
    var cells = tableRef.rows[len].cells;
    var dbname = cells[0].innerText;
    var type = null;
    if(category ==='notation'){
        type='notation'
    }else{
        type='classification'
    }
    var url_str= "/notation.html?database="+dbname+"&category="+type;
    console.log(url_str);
    window.location=url_str;
}


var tasks = new Vue({
    el: "#tasks",
    data: {
        notation_tasks: [],
        class_tasks: [],
        role: null
    },
    methods: {
        initialTasks: function () {

            console.log("begin to initialize tasks!");

            var self = this;

            var url_string = window.location.href;
            var url = new URL(url_string);
            var roleParam = url.searchParams.get("role");
            self.role=roleParam;

            var postData = {};
            postData['category'] = 'notation';
            $.ajax({
                url: '/task/getTasksByCategory',
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(postData),
                type: "POST",
                success: function (data) {
                    var jsonObj = null;
                    if (typeof(data) === 'object') {
                        jsonObj = data;
                    } else {
                        jsonObj = JSON.parse(data);
                    }
                    console.log(jsonObj);

                    for (var i = 0; i < jsonObj.length; i++) {
                        self.notation_tasks.push(jsonObj[i]);
                    }
                    console.log(self.notation_tasks);
                },
                error: function (error) {
                    console.log(error);
                }
            });
            var inputData = {};
            inputData['category'] = 'classification';
            $.ajax({
                url: '/task/getTasksByCategory',
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(inputData),
                type: "POST",
                success: function (data) {
                    var jsonObj = null;
                    if (typeof(data) === 'object') {
                        jsonObj = data;
                    } else {
                        jsonObj = JSON.parse(data);
                    }
                    console.log(jsonObj);

                    for (var i = 0; i < jsonObj.length; i++) {
                        self.class_tasks.push(jsonObj[i]);
                    }
                    console.log(self.class_tasks);
                },
                error: function (error) {
                    console.log(error);
                }
            });
        },

        updateTask: function () {
            var self = this;
            var dbname = document.getElementById('edit_dbname').value;
            var description = document.getElementById('edit_description').value;
            var category = $("#database-type").val();
            var postData = {};
            postData['name'] = dbname;
            postData['description'] = description;
            postData['category'] = category;
            $.ajax({
                url: '/task/update',
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(postData),
                type: "POST",
                success: function (data) {
                    var jsonObj = null;
                    if (typeof(data) === 'object') {
                        jsonObj = data;
                    } else {
                        jsonObj = JSON.parse(data);
                    }
                    console.log(jsonObj);
                    if (jsonObj['status'] === 'success') {

                        $('#myModal').modal('hide');

                        alert("更新任务成功!");
                    } else {
                        alert("更新任务出错");
                    }
                    window.location.reload();


                },
                error: function (error) {
                    alert("更新任务出错");
                    console.log(error);
                }
            });

        }
    },
    beforeMount() {
        this.initialTasks();
    }
});