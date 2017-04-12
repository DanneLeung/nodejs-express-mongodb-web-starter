/**
 * Created by danne on 2016/3/30.
 * 微信回复信息配置
 */
/**
 * Created by ZhangXiao on 2015/6/11.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Wechat = mongoose.model('Wechat');
var ObjectId = Schema.ObjectId;

var WechatReplySchema = new Schema({
  id: ObjectId
  , originalId: {type: String, required: true, default: ""}   // 原始ID
  , replyType: {type: String, required: true}//恢复类型 1：关注自动回复 2：关键词回复 3:自定义菜单
  , type: {type: String, required: true}//回复消息类型 text:文本 image:图片 voice:声音 video:视频 news:图文消息
  , content: {type: String} //文本内容  type=text时必填
  , mediaId: {type: String} //图片信息 type=image|voice|video时必填
  , ruleName: {type: String} // 规则名称 (默认只回复一条)
  //, rules: [{
  //      keyWord: {type: String} //关键词
  //      , matchMode: {type: String} //匹配模式，contain代表消息中含有该关键词即可，equal表示消息内容必须和关键词严格相同
  //  }]
  , rules: []
  , key: {type: String} // 自定义菜单按钮的KEY
  , title: {type: String} //视频消息的title
  , description: {type: String} //视频消息的title
  , articleCount: {type: Number, default: 1} //图文消息个数，限制为10条以内
  , articles : [{//多条图文消息信息，默认第一个item为大图,注意，如果图文数超过10，则将会无响应
        title: {type: String},//图文消息标题
        description: {type: String},//图文消息描述
        picUrl: {type: String},//图片链接，支持JPG、PNG格式，较好的效果为大图360*200，小图200*200
        url: {type: String}//点击图文消息跳转链接
  }]
  , diyUrlFlag: {type: Boolean} //图文自定义标题 覆盖标记
  , diyUrl1: {type: String} //图文自定义标题
  , diyUrl2: {type: String} //图文自定义标题
  , diyUrl3: {type: String} //图文自定义标题
  , diyUrl4: {type: String} //图文自定义标题
  , diyUrl5: {type: String} //图文自定义标题
}, {timestamps: {}});
//db.branches.ensureIndex({"coordinate":"2d"},{"background":"true"})

WechatReplySchema.methods = {};

/**
 * 创建自动回复图文消息
 * @param channelWechatId 微信ID
 * @param ruleName 规则名称
 * @param rules 规则
 * @param articles 图文列表
 * @param cb
 */
WechatReplySchema.statics.createAutoReplyNews = function(channelWechatId, ruleName, rules, articles, cb){
    if(channelWechatId == null){
        return cb('渠道微信ID为空', null);
    }
    Wechat.findOne({"_id": channelWechatId}, function(e, cw){
        if(e){
            return cb(e, null);
        }
        var originalId = cw.originalId;
        if(!originalId || originalId == ''){
            return cb('原始ID不存在', null);
        }
        if(!articles || articles == null || articles.length == 0){
            return cb('图文列表不能为空', null);
        }
        var wechatReply = new WechatReply({
            "originalId": originalId, //微信原始ID
            "replyType": '2', //自定义回复
            "type": 'news', //图文
            "ruleName": ruleName, //规则名称
            "rules": rules, //规则
            "articleCount": articles.length, //图文条数
            "articles": articles //图文信息
        });
        wechatReply.save(function(err, result){
            return cb(err, result);
        });
    });
}

var WechatReply = mongoose.model('WechatReply', WechatReplySchema, 'wechatReplys');
