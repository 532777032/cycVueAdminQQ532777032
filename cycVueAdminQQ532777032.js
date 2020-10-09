var baseState=1//1打包环境  0调试环境
import axios from 'axios'
import querystring from 'querystring'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
// axios 配置
//axios.defaults.timeout = 20000 // 请求超时，适当修改
//axios.defaults.baseURL = '/api'
// http request 拦截器
axios.interceptors.request.use(config => {
	
  if(localStorage.getItem("token")){
	
	  config.headers.authorization = JSON.parse(localStorage.getItem("token")).token|| ''
  }
  NProgress.start()

  return config
}, error => {
  console.error(error)
  return Promise.reject(error)
})

// http response 拦截器
axios.interceptors.response.use(response => {
  NProgress.done()
  return response
}, error => {
  NProgress.done()
  return Promise.resolve(error.response)
})

/**
 * 封装axios的通用请求
 * @param  {string}   url       请求的接口URL
 * @param  {object}   data      传的参数，没有则传空对象
 * @param  {Function} fn        回调函数 fn(返回的数据,错误信息)
 * @return
 */
let server={ajax:function(url, data, fn,baseUrl,type,isFile){
	fn=fn||function(){}
  NProgress.start()
  let head = 'application/json;charset=utf-8' // 默认走json格式
  if (Object.prototype.toString.call(data) === '[object FormData]') {
    head = 'multiple/form-data' // 上传文件

  } else if (data.contentType === 'application/x-www-form-urlencoded') {

    head = 'application/x-www-form-urlencoded;charset=UTF-8'
    data = querystring.stringify(data)
  } else {

    // 暂不做处理
  }
  baseUrl=baseUrl||'/api'
	
  type=type||'post';
	if(isFile){
		let param = new FormData();
		//  param.append("name", data.file.name);
		//通过append向form对象添加数据
		 param.append("file",  data.file);
		//FormData私有类对象，访问不到，可以通过get判断值是否传进去
		 console.log(param.get("file"));
		 let config = {
        //添加请求头
        headers: { "Content-Type": "multipart/form-data" },
        //添加上传进度监听事件
        onUploadProgress: e => {
          var completeProgress = ((e.loaded / e.total * 100) | 0) + "%";
          this.progress = completeProgress;
        }
     };
		axios.post(baseUrl + url, param, config).then(function (res)
		{
			
			 res = res || {status: 408, statusText: '请求超时！'}
			
			 let newRes={
			   status: res.status,
			   data: {
			     success: false,
			     data: res.data.data,
			     msg: res.data.msg
			   }
			 }

				fn(newRes)
			 	return newRes;
		})
		.catch(function (error) {

		 // fn.call(this, err ? null : res, err);
		 });
		return;
	}
	var axiosOption={
		method:type,
		url: baseUrl + url,
		data: data,
		timeout: 0,
		headers: {'Content-Type': head,
			// responseType:'blob'
		}
	  }
	   if(data.responseType=='blob'){
			 axiosOption.responseType= 'blob'
	   }
	axios(axiosOption).then((res) => {
	
      res = res || {status: 408, statusText: '请求超时！'}
      switch(res.status){
      	case 200:case 304: case 400:
      			return res
      	break;
      	default:
			debugger
      			let newRes={
		          status: res.status,
		          data: {
		            success: false,
		            data: {},
		            msg:(res.data? res.data.message:"")
		          }
		        }
						// debugger
      // 			if(res.status==500){
      // 				newRes.data.msg='网络未连接'
      // 			}
      // 			if(res.status==409){
      // 				newRes.data.msg=res.data.msg
      // 			}
	      		return newRes
      	break;
      }
    }
  ).then(
    (res) => {
      let err

		if (res.data && res.data.code === 401) { // 没有登录，session过期跳转到登录页面
			storage.remove('userInfo')
			// this.$router.push({'path': '/login'})
			return
		} else if (res.data && res.data.code !== 200) {
			err = res.data.msg||res.data.message
			console.log("请求失败："+err+"（"+url+"）")

			if(err){
				this.$message({
					'message': err,
					'type': 'error'
				})
			}

		}
      fn.call(this, err ? null : res, err)
    }
  ).catch(err => {
    console.log('代码有问题：', err)
  })
}
}
var baseUrl={
	debug:{	//开发环境
		"api":'http://192.168.0.12:8084',//
	},
	build:{	//生产环境
		"api":'http://61.160.251.83:8084/',
	},
	test:{	//生产环境
		"api":"http://61.160.251.83:8084" //
	},
	url:function(type){
		var m=this;
		var thisUrl=""
		switch(baseState){
			case 0:
				thisUrl="debug" //本地
			break;
			case 1:
				thisUrl="build"//线上
			break;
			case 2:
				thisUrl="test"//测试
			break;
		}
		return m[thisUrl][type];
	},
}
let comsys={
	staticUrl:'http://static.yootuii.com/',
	apiUrl(thisBaseUrl){
		let m=this;
		thisBaseUrl=thisBaseUrl||"api";
		return baseUrl.url(thisBaseUrl)//开发环境
		// window.location.href="https://www.whyxzm.com"//生产环境
	},
	blobDownload(data,name){
		let m=this;
		var content = data;
		var data = new Blob([content],{type:"application/octet-stream;charset=utf-8"});
		var downloadUrl = window.URL.createObjectURL(data);
		var anchor = document.createElement("a");
		anchor.href = downloadUrl;
		anchor.download = name+".xls";
		anchor.click();
		window.URL.revokeObjectURL(data);
	},
	//获取指定年月份天数的日期区域间
	getDateMonthDay(year,month){ //年月
	    let m=this;
	    var d = new Date(year,month,0);
	    var day=d.getDate()<0?"0"+d.getDate():d.getDate()
		if(month<10){
			month="0"+month
		}
	    var arr=[
	      year+"-"+month+"-"+"01",
	      year+"-"+month+"-"+day,
	    ]
	    return arr
	
	},
  //对象转path格式   id=1&name="2"
  paramsToPath(data) {
    var _result = [];
    
    for (var key in data) {
      var value = data[key];
      if (value.constructor == Array) {
        value.forEach(function(_value) {
          _result.push(key + "=" + _value);
        });
      } else {
        _result.push(key + '=' + value);
      }
    }
    return _result.join('&');
  },
  getPreDate: function(pre,date) {
    var self = this;
    var c = new Date();
    if(date){
        c=new Date(date)
    }
    c.setDate(c.getDate() - pre);
    return self.formatDate(c);
  },
  formatDate: function(d) {
    var self = this;
    return d.getFullYear() + "-" + self.getMonth1(d.getMonth()) + "-" + self.getMonth1(d.getDate(), "getDate")
  },
  getMonth1: function(m,type) {
    var self = this;
    if (type != "getDate") {
      m++;
    }
    if (m < 10)
      return "0" + m.toString();
    return m.toString();
  },
}
export default {
	ajax	:server,
	comsys	:comsys
}