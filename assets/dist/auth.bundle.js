!function(){"use strict";var e=Object.freeze({OK:200,NOT_FOUND:404,FORBIDDEN:403,INTERNAL_ERROR:500});function r(e,r){for(var t=0;t<r.length;t++){var s=r[t];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(e,s.key,s)}}var t=new(function(){function t(e){!function(e,r){if(!(e instanceof r))throw new TypeError("Cannot call a class as a function")}(this,t),this._jwtToken=e||null,this._headers=this._createRequestHeaders()}var s,n;return s=t,(n=[{key:"_createRequestHeaders",value:function(){return[["Content-Type","application/json; charset=UTF-8"],["Accept","application/json"],["X-XSRF-TOKEN",this._jwtToken]]}},{key:"_getErrorCodeFromHTTPStatus",value:function(r){return r===e.NOT_FOUND?"B_KOM_NOT_FOUND":r===e.FORBIDDEN?"B_KOM_ACCESS_FORBIDDEN":r===e.INTERNAL_ERROR?"B_KOM_INTERNAL_ERROR":"B_KOM_UNKNOWN_ERROR"}},{key:"_resolveAs",value:function(r,t){var s=this;return new Promise((function(n,o){t?"raw"===r?t.status===e.OK?n(t.responseText):o(s._getErrorCodeFromHTTPStatus(t.status)):"json"===r||"text"===r?t[r]?n(t[r]()):o(s._getErrorCodeFromHTTPStatus(t.status)):o("F_KOM_UNSUPPORTED_TYPE"):o("F_KOM_MISSING_ARGUMENT")}))}},{key:"_resolveAsJSON",value:function(e){return this._resolveAs("json",e)}},{key:"_resolveAsText",value:function(e){return this._resolveAs("text",e)}},{key:"_resolveAsRaw",value:function(e){return this._resolveAs("raw",e)}},{key:"_xhrCall",value:function(e,r,t){var s=this;return new Promise((function(n,o){var a=new XMLHttpRequest;a.open(r,e,!0),a.overrideMimeType("text/plain; charset=x-user-defined"),a.onreadystatechange=function(e){4===e.target.readyState&&s._resolveAsRaw(e.target).then(n).catch(o)},a.onerror=function(){o({code:"F_KOM_XHR_ERROR"})},a.send(t)}))}},{key:"get",value:function(e){var r=this,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this._resolveAsJSON.bind(this);return new Promise((function(s,n){var o={method:"GET",headers:new Headers([r._headers[0]])};fetch(e,o).then(t).then(s).catch(n)}))}},{key:"getText",value:function(e){return this.get(e,this._resolveAsText.bind(this))}},{key:"getRaw",value:function(e){var r=this;return new Promise((function(t,s){r._xhrCall(e,"GET",null).then(t).catch(s)}))}},{key:"post",value:function(e,r){var t=this,s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this._resolveAsJSON.bind(this);return new Promise((function(n,o){var a={method:"POST",headers:new Headers(t._headers),body:JSON.stringify(r)};fetch(e,a).then(s).then(n).catch(o)}))}},{key:"postText",value:function(e,r){return this.post(e,r,this._resolveAsText.bind(this))}},{key:"postRaw",value:function(e,r){var t=this;return new Promise((function(s,n){t._xhrCall(e,"POST",JSON.stringify(r)).then(s).catch(n)}))}},{key:"postForm",value:function(e,r){return new Promise((function(t,s){var n=document.createElement("FORM");for(var o in n.method="POST",n.action=e,r)if(Object.prototype.hasOwnProperty.call(r,o)){var a=document.createElement("INPUT");a.type="hidden",a.name=o,a.value=r[o],n.appendChild(a)}var i=new XMLHttpRequest;i.open("POST",e),i.onreadystatechange=function(e){if(4===e.target.readyState)try{var r=JSON.parse(e.target.response);t(r)}catch(r){s(e.target.response)}},i.onerror=function(){s("F_KOM_XHR_ERROR")};var c=new FormData(n);i.send(c)}))}},{key:"xhr",value:function(e,r,t){return new Promise((function(s,n){var o=new XMLHttpRequest;o.open(e,r,!0),o.onreadystatechange=function(){4===o.readyState&&s(JSON.parse(o.responseText))},o.onerror=function(){n({code:"F_KOM_XHR_ERROR"})},o.send(t)}))}},{key:"jwtToken",get:function(){return this._jwtToken},set:function(e){this._jwtToken=e}}])&&r(s.prototype,n),t}()),s=function(e){for(var r=Object.keys(e),t=0;t<r.length;++t)e[r[t]].classList.remove("error")},n=document.querySelector("#register-submit");if(n){var o={username:document.querySelector("#username"),email:document.querySelector("#email"),code:document.querySelector("#code"),pass1:document.querySelector("#pass1"),pass2:document.querySelector("#pass2"),error:document.querySelector("#error-output"),loading:document.querySelector("#line-loader")},a=function(e){o.loading.style.opacity="0",200===e.status?window.location.href=e.url:(o.error.classList.add("error"),o.error.innerHTML=e.message,"B_INVALID_FIELD"===e.code||"B_MISSING_FIELD"===e.code?(o.username.classList.add("error"),o.email.classList.add("error")):"B_REGISTER_INVALID_FIELD"===e.code?(o.username.classList.add("error"),o.email.classList.add("error"),o.code.classList.add("error"),o.pass1.classList.add("error"),o.pass2.classList.add("error")):"B_REGISTER_EXISTING_USERNAME_AND_EMAIL"===e.code?(o.username.classList.add("error"),o.email.classList.add("error")):"B_REGISTER_EXISTING_USERNAME"===e.code?o.username.classList.add("error"):"B_REGISTER_EXISTING_EMAIL"===e.code?o.email.classList.add("error"):"B_REGISTER_MISSING_FIELD"===e.code?(e.missing.username&&o.username.classList.add("error"),e.missing.email&&o.email.classList.add("error"),e.missing.code&&o.code.classList.add("error"),e.missing.pass1&&o.pass1.classList.add("error"),e.missing.pass2&&o.pass2.classList.add("error")):"B_REGISTER_DIFFERENT_PASSWORDS"===e.code||"B_REGISTER_PASSWORD_TOO_SHORT"===e.code?(o.pass1.classList.add("error"),o.pass2.classList.add("error")):"B_REGISTER_INVALID_CODE"===e.code&&o.code.classList.add("error"))};n.addEventListener("click",(function(e){e.preventDefault();var r=new FormData(document.querySelector("#register-form")),n=Object.fromEntries(r.entries());o.error.innerHTML="",s(o),o.loading.style.opacity="1",t.post("/api/auth/register",n).then(a).catch(a)}))}var i=document.querySelector("#login-submit");if(i){var c={username:document.querySelector("#username"),password:document.querySelector("#password"),error:document.querySelector("#error-output"),loading:document.querySelector("#line-loader")},u=function(e){c.loading.style.opacity="0",200===e.status?window.location.href=e.url:(c.error.classList.add("error"),c.error.innerHTML=e.message,"B_LOGIN_INVALID_FIELD"===e.code?(c.username.classList.add("error"),c.password.classList.add("error")):"B_LOGIN_MISSING_FIELD"===e.code?(e.missing.username&&c.username.classList.add("error"),e.missing.password&&c.password.classList.add("error")):"B_USER_NOT_FOUND"===e.code?c.username.classList.add("error"):"B_LOGIN_INVALID_PASSWORD"===e.code&&c.password.classList.add("error"))};i.addEventListener("click",(function(e){e.preventDefault();var r=new FormData(document.querySelector("#login-form")),n=Object.fromEntries(r.entries());c.loading.style.opacity="1",c.error.innerHTML="",s(c),t.post("/api/auth/login",n).then(u).catch(u)}))}window.UserStack={}.default}();