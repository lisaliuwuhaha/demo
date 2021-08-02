require("../../commons/commons.css")
require("./mobtraderCompetition.css")

var alpha = require("util/alpha.js"),
  _traderCompetition = require('service/traderCompetition.js'),
  token = sessionStorage.getItem("alpha_token"),
  _user = require("service/user.js"),
  date = require("util/date.js"),
  localStorage = window.localStorage,
  username = sessionStorage.getItem('alpha_username'),
  source = alpha.config.source;
var mobtraderCompetition = {
  init: function () {
    var that = this
    that.bindEvent()
    that.getRank()
    that.loadInit()
    that.rendertTraders()
    setInterval(function () {
      that.doscroll()
    }, 4000);
    if (!!location.search) {
      var qsarr = location.search.slice(1).split('&');
      var r_top_uid = qsarr[0].slice(10),
        r_uid = qsarr[1].slice(6)
      localStorage.setItem('r_top_uid', r_top_uid)
      localStorage.setItem('r_uid', r_uid)
    } else {
      localStorage.setItem('r_top_uid', '')
      localStorage.setItem('r_uid', '')
    }
  },
  option: {
    traders: [],
    res: [],
    i: 0,
    isLogin: false
  },
  bindEvent: function () {
    var that = this
    // 快速注册---用户名重复性检测
    $(document).on("change", ".register-con input.username", function () {
      var username = $(this).val().trim(),
        id = $(this).parent().parent().parent().attr("data-id");

      if (!alpha.validate(username, "username")) {
        that.regMessage($(`.recon${id} .reg-input1 i`), 0, "6-16位字母数字组合")
      } else {
        _user.isExistsByUsername({
          username
        }, function (res) {
          that.regMessage($(`.recon${id} .reg-input1 i`), 1)
        }, function (msg) {
          that.regMessage($(`.recon${id} .reg-input1 i`), 0, msg)
        })
      }
    })
    // 快速注册---密码前端验证
    $(document).on("change", ".register-con input.psd", function () {
      var password = $(this).val().trim(),
        id = $(this).parent().parent().parent().attr("data-id");
      if (alpha.validate(password, "password")) {
        that.regMessage($(`.recon${id} .reg-input2 i`), 1)
      } else {
        that.regMessage($(`.recon${id} .reg-input2 i`), 0, "6-12位字母数字组合")
      }
    })
    // 快速注册---点击发送验证码(验证手机号格式)
    $(document).on("click", ".register-con .reg-input .verfiy", function () {
      var _this = $(this),
        id = _this.parent().parent().parent().attr("data-id"),
        phone = _this.prev().val().trim()
      if (alpha.validate(phone, "phone")) {
        _user.sendyanzm({
          phone: phone
        }, function () {
          _this.css("background", "#1add97").html("已发送")
        })
      } else {
        _this.css("background", "#fe5858").html("错误")
        setTimeout(function () {
          _this.css("background", "#5a76d4").html("重新验证")
        }, 3000)
        _this.prev().val("").attr("placeholder", "请输入正确的手机号")
      }
    })
    // 快速注册---验证码前端验证
    $(document).on("change", ".register-con input.code", function () {
      var code = $(this).val().trim(),
        id = $(this).parent().parent().parent().attr("data-id");
      if (alpha.validate(code, "code")) {
        that.regMessage($(`.recon${id} .reg-input4 i`), 1)
      } else {
        that.regMessage($(`.recon${id} .reg-input4 i`), 0, "6位数字")
      }
    })
    //快速注册---点击提交
    $(document).on("click", ".tosignup", function () {
      var _that=$(this)
      _that.addClass('fake-btn').removeClass('tosignup').html('<span class="loading-in-btn"></span>')
      var id = _that.parent().attr("data-id"),code =$.trim($(`.recon${id} input.code`).val()),phone = $.trim($(`.recon${id} input.phone`).val()),username =$.trim($(`.recon${id} input.username`).val()),password = $.trim($(`.recon${id} input.psd`).val()),status = 0,r_top_uid=localStorage.getItem('r_top_uid'),r_uid=localStorage.getItem('r_uid')
      console.log($(`.recon${id} input.psd`))
      var formData = {
        username: username,
        password: password,
        // email: " ",
        phone: phone,
        // real_name: phone,
        region: 2,
        code: code
      }
      console.log(status)

      // 检测前端验证结果
      if (!alpha.validate(formData.username, "username")) {
        that.regMessage($(`.recon${id} .reg-input1 i`), 0, "6-16位字母数字组合")
        status = 0
        _that.addClass('tosignup').removeClass('fake-btn').html('立即注册')
        return
      } 
       if (!alpha.validate(formData.password, "password")) {
        that.regMessage($(`.recon${id} .reg-input2 i`), 0, "6-12位字母数字组合")
        status = 0
        _that.addClass('tosignup').removeClass('fake-btn').html('立即注册')
        return
      } 
      if (!alpha.validate(formData.phone, "phone")) {
        var _this = $(`.recon${id} .reg-input .verfiy`)
        _this.css("background", "#fe5858").html("错误")
        setTimeout(function () {
          _this.css("background", "#5a76d4").html("重新验证")
        }, 3000)
        _this.prev().val("").attr("placeholder", "请输入正确的手机号")
        status = 0
        _that.addClass('tosignup').removeClass('fake-btn').html('立即注册')
        return
      } 
       if (!alpha.validate(formData.code, "code")) {
        that.regMessage($(`.recon${id} .reg-input4 i`), 0, "6位数字")
        status = 0
        _that.addClass('tosignup').removeClass('fake-btn').html('立即注册')
        return
      } 
        status = 1
      
      // 后台验证
      // 先验证手机号和验证码是否匹配
      console.log(status)
      if (status == 1) {
        _user.verify({
          code: code,
          phone: phone
        }, function (res) {
          _user.signUp(formData, function (res) {
            if (r_uid) {
              // 发送被推广请求
              _user.recommendedFromQRCode({
                username: formData.username,
                r_uid: r_uid,
                r_top_uid: r_top_uid
              }, function (res) {
                console.log('推广成功')
                _user.login({
                  username: formData.username,
                  password: formData.password,
                  device: 'mobile'
                }, function (res) {
                  console.log(res)
                  sessionStorage.setItem("alpha_token", res.token)
                  sessionStorage.setItem("alpha_username", res.username)
                  if (res.real_name !== undefined) {
                    sessionStorage.setItem("alpha_real_name", res.real_name)
                  }
                  if (res.verify_time !== undefined) {
                    sessionStorage.setItem("alpha_verify_time", res.verify_time)
                  }
                  sessionStorage.setItem("alpha_home", res.href)
                  setTimeout(function () {
                    window.location.href = 'mobtraderCompetition.html'
                  }, 0)
                })
              })
            } else {
              // 普通注册成功之后直接登录
              _user.login({
                username: formData.username,
                password: formData.password,
                device: 'mobile'
              }, function (res) {
                console.log(res)
                sessionStorage.setItem("alpha_token", res.token)
                sessionStorage.setItem("alpha_username", res.username)
                if (res.real_name !== undefined) {
                  sessionStorage.setItem("alpha_real_name", res.real_name)
                }
                if (res.verify_time !== undefined) {
                  sessionStorage.setItem("alpha_verify_time", res.verify_time)
                }
                sessionStorage.setItem("alpha_home", res.href)
                setTimeout(function () {
                  window.location.href = 'mobtraderCompetition.html'
                }, 0)
              })
            }
          }, function (msg) {
            $(`.recon${id} .reg-input .verfiy`).css("background", "#fe5858").html("错误")
            setTimeout(function () {
              $(`.recon${id} .reg-input .verfiy`).css("background", "#5a76d4").html("重新验证")
            }, 3000)
            $(`.recon${id} input.phone`).val("").attr("placeholder", msg)
            _that.addClass('tosignup').removeClass('fake-btn').html('立即注册')
          })
        }, function (msg) {
          that.regMessage($(`.recon${id} .reg-input4 i`), 0, "验证码错误")
          $(`.recon${id} .reg-input .verfiy`).css("background", "#5a76d4").html("验证")
          _that.addClass('tosignup').removeClass('fake-btn').html('立即注册')
        })
      }
      
    })
    // “我再看看”按钮 关闭弹窗
    $(document).on("click", ".pop .btn-group .btn-wait", function () {
      $(".pop-layout").fadeOut()
      $(".pop").css("margin-top", "-800px")
      localStorage.setItem('username', '')
      localStorage.setItem('ranklist', '')
      $(".hello-info").hide()
      $(".recon1").removeClass('hide')
      that.renderPersonRank()
    })
    $(document).on("click", ".pop .btn-group .btn-login", function () {
      window.location.href = "./moblogin.html"
    })
    // 排名用户名点击
    $(document).on("click", ".rank-con .rank-detail .detail-body .list-item.user,.presonrank-con .detail-body .list-item.user", function () {
      $(this).find('.hovername').fadeIn().delay(800).fadeOut()
    })
    // 总排名点击切换
    $(document).on("click", ".rank-con .rank-category span", function () {
      $(this).addClass('active').siblings().removeClass('active')
      var rankType = $(this).index()
      that.getRank(rankType)
      $('.rank-con .detail-body').animate({
        scrollTop: 0
      }, 1000)
    })
    // 点击出现客服
    $(document).on("click", ".kefu", function (e) {
      e.stopPropagation()
      // 弹出客服微信
      $(this).find(".customerSer-con").fadeToggle()
    })
    $(document).on("click", ".customerSer-con", function (e) {
      e.stopPropagation()
    })
  },
  getRank: function (rankType = 0) {
    var that = this
    switch (rankType) {
      case 0:
        _traderCompetition.weekRanking({}, function (res) {
          that.handleRank(res)
        }, function (msg) {
          console.log(msg)
        })
        break
      case 1:
        _traderCompetition.monthRanking({}, function (res) {
          that.handleRank(res)
        }, function (msg) {
          console.log(msg)
        })
        break;
      case 2:
        _traderCompetition.totalRanking({}, function (res) {
          that.handleRank(res)
        }, function (msg) {
          console.log(msg)
        })
        break;
      default:
        break;
    }
  },
  handleRank: function (res) {
    var html = ''
    if (!res) {
      html = '<p style="text-align: center;margin-top:15px;font-size:14px;color:#fff">暂无排名数据</p>'
    } else {
      res = res.slice(0, 100)
      for (var i in res) {
        if (res[i].rank < 4) {
          medal = `<li class="list-item rank r${res[i].rank}"><span></span></li>`
        } else {
          medal = `<li class="list-item">${res[i].rank}</li>`
        }
        // 处理收益率
        res[i].rate_of_equity = Math.floor(res[i].rate_of_equity * 10000) / 100
        html += `<li>
        <ul class="list-line">
        ${medal}
          <li class="list-item user">
            <div class="avatar"><img src="${source}/${res[i].face}" onerror="javascript:this.src='http://www.alphazone.com.cn/resource/default_avatar.jpg'" alt="头像"></div>
            <div class="username">${res[i].username}</div>
            <div class="hovername">${res[i].username}</div>
          </li>
          <li class="list-item balance">$${res[i].balance}</li>
          <li class="list-item networth">$${res[i].equity}</li>
          <li class="list-item yield">${res[i].rate_of_equity}%</li>
        </ul>
      </li>`
      }
    }
    $(".rank-con .rank-detail .detail-body").html(html)
  },
  // 参赛交易员渲染
  rendertTraders: function () {
    var that = this
    _traderCompetition.seniorMembers({}, function (res) {
      for (var item of res) {
        item.create_time = item.create_time.substr(0, 10)
      }
      var res1 = res.slice(0, 2),
        res2 = res.slice(2, 4),
        res3 = res.slice(4, 6),
        html1 = '',
        html2 = '',
        html3 = '';
      that.option.res = res;
      if (res.length > 6) {
        that.option.traders = res.slice(6)
      } else {
        that.option.traders = res
      }
      for (var item of res1) {
        if (item.face == '') {
          html1 += `<div class="traderitem">
        <div class="leftimg">
          <i class="iconfont">&#xe62a;</i>
        </div>
        <div class="rightinfo">
          <p class="username">${item.username}</p>
          <p>参赛时间:${item.create_time}</p>
          <p>账户余额:$${item.balance}</p>
        </div>
      </div>`
        } else {
          html1 += `<div class="traderitem">
        <div class="leftimg">
        <img src="${source}/${item.face}" alt="">
        </div>
        <div class="rightinfo">
          <p class="username">${item.username}</p>
          <p>参赛时间:${item.create_time}</p>
          <p>账户余额:$${item.balance}</p>
        </div>
      </div>`
        }
      }
      var _html1 = $('.traderitem-row.row1').html(html1)
      $('.trader-list').append(_html1)
      for (var item of res2) {
        if (item.face == '') {
          html2 += `<div class="traderitem">
          <div class="leftimg">
            <i class="iconfont">&#xe62a;</i>
          </div>
          <div class="rightinfo">
            <p class="username">${item.username}</p>
            <p>参赛时间:${item.create_time}</p>
            <p>账户余额:$${item.balance}</p>
          </div>
        </div>`
        } else {
          html2 += `<div class="traderitem">
          <div class="leftimg">
          <img src="${source}/${item.face}" alt="">
          </div>
          <div class="rightinfo">
            <p class="username">${item.username}</p>
            <p>参赛时间:${item.create_time}</p>
            <p>账户余额:$${item.balance}</p>
          </div>
        </div>`
        }
      }
      var _html2 = $('.traderitem-row.row2').html(html2)
      $('.trader-list').append(_html2)
      for (var item of res3) {
        if (item.face == '') {
          html3 += `<div class="traderitem">
            <div class="leftimg">
              <i class="iconfont">&#xe62a;</i>
            </div>
            <div class="rightinfo">
              <p class="username">${item.username}</p>
              <p>参赛时间:${item.create_time}</p>
              <p>账户余额:$${item.balance}</p>
            </div>
          </div>`
        } else {
          html3 += `<div class="traderitem">
            <div class="leftimg">
            <img src="${source}/${item.face}" alt="">
            </div>
            <div class="rightinfo">
              <p class="username">${item.username}</p>
              <p>参赛时间:${item.create_time}</p>
              <p>账户余额:$${item.balance}</p>
            </div>
          </div>`
        }
      }
      var _html3 = $('.traderitem-row.row3').html(html3)
      $('.trader-list').append(_html3)
    }, function (msg) {
      console.log(msg)
    })
  },
  /* 参赛交易员滚动 */
  doscroll: function () {
    var that = this,
      $parent = $('.traders-con .trader-list'),
      $first = $parent.find('.traderitem-row:first-child'),
      height = $first.height(),
      html = '',
      arr = [],
      j;
    if (that.option.i == that.option.traders.length - 1) {
      j = 0
    } else if (that.option.i > that.option.traders.length - 1) {
      that.option.i = 0
      j = that.option.i + 1
    } else {
      j = that.option.i + 1
    }
    arr = [that.option.traders[that.option.i], that.option.traders[j]]
    that.option.i += 2

    $first.animate({
      height: 0
    }, 500, function () { // 动画结束后，把它插到最后，形成无缝
      for (var item of arr) {
        if (item.face == '') {
          html += `<div class="traderitem">
            <div class="leftimg">
              <i class="iconfont">&#xe62a;</i>
            </div>
            <div class="rightinfo">
              <p class="username">${item.username}</p>
              <p>参赛时间:${item.create_time}</p>
              <p>账户余额:$${item.balance}</p>
            </div>
          </div>`
        } else {
          html += `<div class="traderitem">
            <div class="leftimg">
            <img src="${source}/${item.face}" alt="">
            </div>
            <div class="rightinfo">
              <p class="username">${item.username}</p>
              <p>参赛时间:${item.create_time}</p>
              <p>账户余额:$${item.balance}</p>
            </div>
          </div>`
        }
      }
      $first.css('height', height).html(html).appendTo($parent);
    })
  },
  loadProfile: function () {
    var that = this
    if (token) {
      $.ajax({
        type: "POST",
        url: alpha.getServerUrl() + "/alpha/api/v1/getUserProfile",
        data: {
          token
        },
        success: function (res) {
          if (res.status == '401') {
            $(".pop-layout").fadeIn()
            $(".pop").css("margin-top", "25vh")
            $(".hello-info").hide()
            $(".recon1").removeClass('hide')
          } else {
            that.option.isLogin = true
            var name = res.data.real_name || res.data.username
            $(".recon1").addClass('hide')
            $(".hello-info").show()
            $('.hello-info .avatar img').attr('src', source + '/' + res.face)
            $('.hello-info .hello p:last-child').text(name)
          }
        }
      })
      _traderCompetition.personalInfo({
        token: token
      }, function (res) {
        $('.personal-info .initial_funding p:last-child').text('$ ' + res.initial_funding)
        $('.personal-info .balance p:last-child').text('$ ' + res.account_info.AccountBalance)
        $('.personal-info .equity p:last-child').text('$ ' + res.account_info.AccountEquity)
        $('.personal-info .last_week_equity p:last-child').text('$ ' + res.last_week_equity)
        $('.personal-info .last_month_equity p:last-child').text('$ ' + res.last_month_equity)
        $('.personal-info .activity p:last-child').text(res.total_activity)
        $('.personal-info .week_activity p:last-child').text(res.week_activity)
        $('.personal-info .month_activity p:last-child').text(res.month_activity)
      }, function (msg) {
        console.log(msg)
      })
    } else {
      that.option.isLogin = false
      $(".pop-layout").fadeIn()
      $(".pop").css("margin-top", "25vh")
    }
  },
  updateTime: function () {
    var that = this;
    _user.getdate({}, function (res) {
      var a = res.datetime.substr(14, 2)
      if (Number(a) < 5) {
        var stime = new Date(res.datetime.substr(0, 13) + ':05').getTime(),
          b = (stime - 3600000) / 1000,
          c = date.timetostr(b)
        localStorage.setItem('pretime', c.substr(0, 16))
      } else {
        localStorage.setItem('pretime', res.datetime.substr(0, 13) + ':05')
      }
    })
  },
  loadInit: function () {
    var that = this;
    if (!localStorage.getItem('rank') && !localStorage.getItem('pretime')) {
      localStorage.setItem('username', username);
      that.updateTime()
      that.getPersonRank()
    } else {
      _user.getdate({}, function (res) {
        var pretime = localStorage.getItem('pretime'),
          nowtime = res.datetime.substr(0, 16),
          lusername = localStorage.getItem('username')
        if (new Date(nowtime).getTime() - new Date(pretime).getTime() > 3600000 && username == lusername) {
          localStorage.setItem('pretime', nowtime.substr(0, 13) + ":05")
          that.getPersonRank()
        } else if (username != lusername) {
          localStorage.setItem('username', username);
          that.updateTime()
          that.getPersonRank()
        }
      })
    }
    that.loadProfile()
    setTimeout(function () {
      that.renderPersonRank()
    }, 500)
  },
  getPersonRank: function () {
    var that = this
    _traderCompetition.totalRanking({
      token: token
    }, function (res) {
      if (!res) {
        localStorage.setItem("rank", '')
        that.option.isLogin = false
      } else {
        var len = res.length;
        for (var i = 0; i < len; i++) {
          if (res[i].username == username) {
            localStorage.setItem('rank', res[i].rank)
            if (res[i].rank < 10) {
              localStorage.setItem('ranklist', JSON.stringify(res.slice(0, 10)))
            } else if (res[i].rank >= len - 10) {
              localStorage.setItem('ranklist', JSON.stringify(res.slice(len - 10)))
            } else {
              localStorage.setItem('ranklist', JSON.stringify(res.slice(i - 5, i + 5)))
            }
            break;
          } else {
            localStorage.setItem("rank", '')
          }
        }
      }
    }, function (msg) {
      console.log(msg)
    })
  },
  renderPersonRank: function () {
    var pretime = localStorage.getItem('pretime'),
      rank = localStorage.getItem('rank'),
      ranklist = localStorage.getItem('ranklist'),
      that = this,
      html = '';
    $('.rank-con .updateTime').text(pretime)
    if (!that.option.isLogin) {
      $('.presonrank-con .detail-body').html('<p style="text-align: center;margin-top:20px;color:#fff;font-size:14px">暂无个人排名数据</p>')
    } else {
      if (rank == '') {
        $('.presonrank-con .detail-body').html('<p style="text-align: center;margin-top:20px;color:#fff;font-size:14px">已进入赛点，尚未进入总榜前100名，请继续加油！</p>')
        $('.personal-info .rank p:last-child').text('--')
      } else {
        for (var item of JSON.parse(ranklist)) {
          html += `<li class="${item.username==username?'active':''}">
        <ul class="list-line">
          <li class="list-item">${item.rank}</li>
          <li class="list-item user">
            <div class="avatar"><img src="${source}/${item.face}" onerror="javascript:this.src='http://www.alphazone.com.cn/resource/default_avatar.jpg'" alt="头像"></div>
            <div class="username">${item.username}</div>
          </li>
          <li class="list-item balance">$ ${item.balance}</li>
          <li class="list-item networth">$ ${item.equity}</li>
        </ul>
      </li>`
        }
        $('.presonrank-con .detail-body').html(html)
        $('.personal-info .rank p:last-child').text('No.' + rank)
      }
    }
  },
  regMessage: function (dom, status, msg = "") {
    $(dom).fadeIn()
    if (status == 1) {
      $(dom).removeClass("fa-times-circle").removeClass("reg-error").addClass("fa-check-circle").addClass("reg-success")
    } else {
      $(dom).removeClass("fa-check-circle").removeClass("reg-success").addClass(" fa-times-circle").addClass("reg-error")
        .prev().val("").attr("placeholder", msg)
    }
  },
}

mobtraderCompetition.init()