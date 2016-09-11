var mongodb = require('./db');

function Upload(name, title, imgUrl, tags, post, imageAlbum) {
    this.name = name;
    this.title = title;
    this.imgUrl = imgUrl;
    this.tags = tags;
    this.post = post;
    this.imageAlbum = imageAlbum;
}

module.exports = Upload;

// 存储一张图片信息
Upload.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    var img = {
        name: this.name,
        time: time,
        title: this.title,
        imgUrl: this.imgUrl,
        tags: this.tags,
        post: this.post,
        imageAlbum: this.imageAlbum,
        pv: 0
    };
    // 打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 读取 imgs 集合
        db.collection('imgs', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err); //错误，返回 err 信息
            }
            collection.find({
                "imageAlbum": "covers"
            }, {
                "name": 1,
                "imgUrl": 1
            }).sort({
                time: -1
            }).toArray(function(err, imgs) {
                // 将图片信息插入imgs集合
                collection.insert(img, {
                    safe: true
                }, function(err, img) {
                    mongodb.close();
                    if (err) {
                        return callback(err); //错误，返回 err 信息
                    }
                    callback(null, imgs); //成功！err 为 null，并返回存储后的用户文档
                });
            });
        });
    });
}

// 读取图片信息
Upload.getImages = function(name, callback) {
    // 打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 读取imgs集合
        db.collection('imgs', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err); //错误，返回 err 信息
            }
            // 获取封面专辑标签图片
            collection.find({
                "imageAlbum": "covers"
            }, {
                "name": 1,
                "imgUrl": 1
            }).sort({
                time: -1
            }).toArray(function(err, imgs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, imgs);
            });
        });
    });
}


// 获取一张图片信息
Upload.getOne = function(name, day, title, callback) {
    // 打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 读取imgs集合
        db.collection('imgs', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 根据用户名、发表日期及图片名进行查询、
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, img) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                if (img) {
                    // 每访问一次，pv值增加一次
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {
                        $inc: { pv: 1 }
                    }, function(err) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                    });
                    callback(null, img); // 返回查询的一张图片
                }
            });
        });
    });
}

// 返回原始图片的内容
Upload.editImage = function(name, day, title, callback) {
    // 打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 读取imgs集合
        db.collection('imgs', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.find({
                "imageAlbum": "covers"
            }, {
                "name": 1,
                "imgUrl": 1
            }).sort({
                time: -1
            }).toArray(function(err, imgs) {
                // 根据图片名称、发表日期进行查询
                collection.findOne({
                    "name": name,
                    "time.day": day,
                    "title": title
                }, function(err, img) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    callback(null, img, imgs); // 返回查询的一张图片
                });
            });
        });
    });
}

// 更新一张图片及其相关信息
Upload.update = function(name, title, day, tags, post, callback) {
    // 打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 读取imgs集合
        db.collection('imgs', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 更新图片信息
            collection.update({
                "name": name,
                "title": title,
                "time.day": day
            }, {
                $set: {
                    post: post,
                    tags: tags
                }
            }, {
                safe: true
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}

// 删除一张图片
Upload.remove = function(name, day, title, callback) {
    // 打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 读取imgs集合
        db.collection('imgs', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 查询要删除的图片
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, img) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                // 删除图片
                collection.remove({
                    "name": name,
                    "time.day": day,
                    "title": title
                }, {
                    w: 1
                }, function(err) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    callback(null);
                });
            });
        });
    });
}

Upload.getSelectImage = function(name, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 读取imgs集合
        db.collection('imgs', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // distinct用来找出给定键的所有不同值
            collection.distinct('tags', function(err, tags) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }

                var query = {};
                if (name) {
                    query.name = name;
                    query.imageAlbum = 'wardrobe';
                }
                // 使用count返回特定查询的文档数total
                collection.count(query, function(err, total) {
                    // 根据query对象查询，并跳过前(page-1)*10个结果，返回之后的10个结果
                    collection.find(query, {

                    }).sort({
                        time: -1
                    }).toArray(function(err, imgs) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                        callback(null, imgs, tags);
                    });
                });
            });
        });
    });
}

Upload.getBeautifulImage = function(name, callback) {
    // 打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            return callback(err);
        }
        // 读取imgs集合
        db.collection('imgs', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err); //错误，返回 err 信息
            }
            // 获取封面专辑标签图片
            collection.find({
                "imageAlbum": "covers"
            }, {
                "name": 1,
                "title": 1,
                "time": 1,
                "imgUrl": 1,
                "post": 1,
                "imageAlbum": 1,
                "pv": 1
            }).sort({
                time: -1
            }).toArray(function(err, imgs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, imgs);
            });
        });
    });
}
