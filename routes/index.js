var crypto = require('crypto'),
    Upload = require('../models/upload.js'),
    User = require('../models/user.js');
var multer = require('multer');

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/images')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
});
var upload = multer({
    storage: storage
});

module.exports = function(app) {
    // 主页
    app.get('/', function(req, res) {
        Upload.getImages(null, function(err, imgs) {
            if (err) {
                imgs = [];
            }
            res.render('chun_index', {
                imgs: imgs,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    // 登录页
    app.get('/chun_login', checkNotLogin);
    app.get('/chun_login', function(req, res) {
        Upload.getImages(null, function(err, imgs) {
            if (err) {
                imgs = [];
            }
            res.render('chun_login', {
                imgs: imgs,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/chun_login', checkNotLogin);
    app.post('/chun_login', function(req, res) {
        var password = req.body.password;
        User.get(req.body.name, function(err, user) {
            if (!user) {
                req.flash('error', '用户不存在');
                return res.redirect('/chun_login');
            }
            if (user.password != password) {
                req.flash('error', '密码错误！');
                return res.redirect('/chun_login');
            }
            req.session.user = user;
            req.flash('success', '登录成功！');
            return res.redirect('/');
        });
    });

    // 登出
    app.get('/chun_logout', checkLogin);
    app.get('/chun_logout', function(req, res) {
        req.session.user = null;
        req.flash('success', '登出成功!');
        return res.redirect('/');
    });

    // 上传图片
    app.get('/chun_upload', checkLogin);
    app.get('/chun_upload', function(req, res) {
        Upload.getImages(null, function(err, imgs) {
            if (err) {
                imgs = [];
            }
            res.render('chun_upload', {
                imgs: imgs,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/chun_upload', checkLogin);
    app.post('/chun_upload', upload.array('field1', 5), function(req, res) {
        var currentUser = req.session.user,
            upload = new Upload(currentUser.name, req.body.title, req.files, req.body.tags, req.body.post, req.body.imageAlbum);
        upload.save(function(err) {
            if (err) {
                req.flash('error', err);
                console.log(err);
                return res.redirect('/');
            }
            req.flash('success', '文件上传成功！');
            return res.redirect('/chun_upload');
        });
    });

    app.get('/chun_select', checkLogin);
    app.get('/chun_select', function(req, res) {
        var currentUser = req.session.user;
        Upload.getSelectImage(currentUser.name, function(err, imgs, tags) {
            res.render('chun_select', {
                title: 'select',
                user: req.session.user,
                tags: tags,
                imgs: imgs,
                err: err
            });
        });
    });
    app.post('/chun_select', function(req, res) {
        var currentUser = req.session.user;
        Upload.remove(currentUser.name, req.body.day, req.body.title, function(err) {
            if (err) {
                res.json({ status: 'fail', info: "操作失败！" });
            }
            res.json({ status: 'succ', info: "删除成功！" });
        });
    });

    app.get('/chun_beautiful', checkLogin);
    app.get('/chun_beautiful', function(req, res) {
        var currentUser = req.session.user;
        Upload.getBeautifulImage(currentUser.name, function(err, imgs) {
            res.render('chun_beautiful', {
                title: 'chun_beautiful',
                user: req.session.user,
                imgs: imgs,
                err: err
            });
        });
    });
    app.post('/chun_beautiful', function(req, res) {
        var currentUser = req.session.user;
        Upload.remove(currentUser.name, req.body.day, req.body.title, function(err) {
            if (err) {
                res.json({ status: 'fail', info: "操作失败！" });
            }
            res.json({ status: 'succ', info: "删除成功！" });
        });
    });

    app.get('/chun_editImage/:name/:day/:title', checkLogin);
    app.get('/chun_editImage/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Upload.editImage(currentUser.name, req.params.day, req.params.title, function(err, img, imgs) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('chun_editImage', {
                title: 'chun_editImage',
                img: img,
                imgs: imgs,
                user: req.session.user
            });
        });
    });
    app.post('/chun_editImage/:name/:day/:title', checkLogin);
    app.post('/chun_editImage/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        var tags = req.body.tags;
        Upload.update(currentUser.name, req.params.title, req.params.day, tags, req.body.post, function(err) {
            var url = encodeURI('/chun_editImage/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '修改成功！');
            return res.redirect('/chun_select');
        });
    });

    app.use(function(req, res) {
        res.render("/zahara_404");
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录!');
            return res.redirect('/chun_login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录!');
            return res.redirect('back');
        }
        next();
    }
}
