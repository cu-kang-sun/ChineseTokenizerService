

var authenticator = new Vue({
    el: "#authenticator",
    data: {},
    methods: {
        login: function () {
            var username = document.getElementById('username').value;
            var pwd = document.getElementById('password').value;
            if (username.trim() === "") {
                alert("用户名不能为空!");
                return;
            }
            if (pwd.trim() === "") {
                alert("密码不能为空!");
                return;
            }

            postData = {};
            postData['username'] = username;
            postData['password'] = pwd;
            var role = document.getElementById('roles').value;
            postData['role'] = role;
            //alert(postData['role']);
            $.ajax({
                url: "/login",
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(postData),
                type: "POST",
                success: function (res) {
                    console.log(res);
                    var response = null;
                    if (typeof(response) === 'object') {
                        response = res;
                    } else {
                        response = JSON.parse(res);
                    }
                    if (response['status'] === 'success') {
                        alert(response['msg']);
                        if (role === 'user') {
                            window.location = "/tasks.html?role=user"
                        } else {
                            window.location = "/tasks.html?role=manager"
                        }
                    } else {
                        alert(response['msg']);
                    }


                }, error: function (err) {
                    alert("您的登陆出现错误，请稍后重试");
                    console.log(err);
                }
            });
        }
    }
});