(function(wnd){if(wnd.minMaxify||location.href.indexOf("checkout.shopify")!=-1)
return;function now(){return new Date().getTime()}
var mm=wnd.minMaxify={cart:null,cartLoadTryCount:0,feedback:function(msg){},guarded:function(f,pref){return function(){try{var r0=pref&&pref.apply(this,arguments),rv=f.apply(this,arguments);return pref?(rv||r0):rv;}
catch(ex){console.error(ex);}}}};var path=wnd.location.pathname;mm.guarded(function(){var $=wnd.jQuery;var messages={"CART_UPDATE_MSG":"Cart needs to be updated","CART_UPDATE_MSG2":"Cart contents have changed, you must click \"Update cart\" before proceeding.","INTRO_MSG":"Cannot place order, conditions not met: \n\n","MAX_SUBTOTAL_MSG":"Maximum%20%24%7B%7BCartMaxAmount%7D%7D%20per%20customer.","MIN_SUBTOTAL_MSG":"Must have at least {{CartMinAmount}} in total.","NOT_VALID_MSG":"Order not valid","PROD_MAX_MSG":"%7B%7BProductName%7D%7D%3A%3A%20Maximum%20%7B%7BProductMaxQuantity%7D%7D%20per%20customer.%20Please%20update%20cart","PROD_MIN_MSG":"{{ProductName}}: Must have at least {{ProductMinQuantity}} of this item.","PROD_MULT_MSG":"{{ProductName}}: Quantity must be a multiple of {{ProductQuantityMultiple}}.","TOTAL_ITEMS_MAX_MSG":"Must have at most {{CartMaxQuantity}} items total.","TOTAL_ITEMS_MIN_MSG":"Must have at least {{CartMinQuantity}} items total.","TOTAL_ITEMS_MULT_MSG":"Must have a multiple of {{CartQuantityMultiple}} items total.","VERIFYING_MSG":"Verifying"};var checkoutSelector="[name='checkout'], [aria-label='Apple Pay'], [name='goto_pp'], .amazon-payments-pay-button > img, [href='/checkout'], [type=submit][value=Checkout], [onclick='window.location\\=\\'\\/checkout\\''], form[action=\\/checkout] input[type=submit]";var updatableCheckoutBtnSelector='[name="checkout"]';var selCartQtyAdjust='.cart-item-decrease, .cart-item-increase, .js--qty-adjuster, .js-qty__adjust, .minmaxify-quantity-button, .numberUpDown > *, .cart-item button.adjust';var checkoutFrames="div.additional-checkout-buttons, div.additional_checkout_buttons, .paypal-button-context-iframe, .additional-checkout-button--apple-pay, .additional-checkout-button--google-pay";var selMinField=".minmaxify-minfield";var selQantityField="input[name=quantity]";var selCartQtyField='input[name^="updates["], .cart__qty-input';var $checkoutCtrl,eXHR;var limitsJson={"multtotalitems":"","overridesubtotal":"","itemmax":"","lockchange":true,"mintotalitems":"","groupLimits":[],"maxorder":"","weightmin":"","maxtotalitems":"","embedjq":false,"minorder":"","weightmax":"","syncload":false,"productLimits":{"special-olympics-ceramic-mug-2018-edition":{"max":"1","min":"","combine":true,"name":"Special%20Olympics%20Ceramic%20Mug%20-%202018%20edition","multiple":""},"zakk-wylde-signed-2017-valhalla-java-mug":{"max":"1","min":"","combine":true,"name":"Zakk%20Wylde%20Signed%202017%20Valhalla%20Java%20Mug","multiple":""},"valentines-day-mug-set-2018-edition":{"max":"1","min":"","combine":true,"name":"Valentine%27s%20Day%20Mug%20Set%20-%202018%20Edition","multiple":""},"halloween-ceramic-mug-2018-edition":{"max":"5","min":"","combine":true,"name":"Halloween%20Ceramic%20Mug%20-%202018%20edition","multiple":""},"zakk-wylde-ceramic-mug-for-st-judes":{"max":"1","min":"","combine":false,"name":"Zakk%20Wylde%20Ceramic%20Mug%20for%20St.%20Judes","multiple":""},"deep-space-ceramic-mug-2018-edition":{"max":"5","min":"","combine":false,"name":"Deep%20Space%20Ceramic%20Mug%20-%202018%20edition","multiple":""},"frau-perchta-mug-set":{"max":"10","min":"","combine":true,"name":"Frau%20Perchta%20Mug%20Set","multiple":""},"st-patricks-day-mug-2018-edition":{"max":"10","min":"","combine":true,"name":"St.%20Patrick%27s%20Day%20Mug%20-%202018%20Edition","multiple":""}},"skus":[{"filter":"VJCMSG","max":"1","multiple":"","min":""}],"itemmult":"","itemmin":""};var popupCount=0;var limitsShown,isValid,qtyChanged,vstart;var originalSubmitText;var errorMessage=[];mm.showMessage=function(ev){var lines=errorMessage;if(isValid||!lines.length){if(limitsJson){mm.closePopup&&mm.closePopup();return true;}}
++popupCount;mm.prevented=now();if(!mm.showPopup||!mm.showPopup(lines[0],lines.slice(1)))
{var txt='';for(var i=0;i<lines.length;++i)
txt+=lines[i]+'\n';alert(txt);}
return false;}
function formatT(tag,values){var msg=unescape(messages[tag]);if(values){msg=msg.replace(/\{\{(.*?)\}\}/g,function(_,v){try{with(values)
return eval(v);}catch(x){return'"'+x.message+'"';}});}
return msg;}
function reportViolation(message,item){errorMessage.push(message);}
var css='.mfp-bg.minmaxify-popup { transition: opacity 0.3s ease-out; background: #0b0b0b; opacity: .8; z-index: 199999998;}'+
'.minmaxify-popup.mfp-wrap .mfp-content { opacity: 0; transition: all 0.3s ease-out; color: black; background-color: white; padding: 20px; padding-right:36px; max-width: 500px; margin: 20px auto; width: calc(100% - 4rem); }'+
'.minmaxify-popup .minmaxify-btn { display: inline-block; padding: 8px 20px; margin: 0; line-height: 1.42; text-decoration: none; text-align: center; vertical-align: middle; white-space: nowrap; cursor: pointer; border: 1px solid transparent; -webkit-user-select: none; user-select: none; border-radius: 2px; font-family: "Montserrat","HelveticaNeue","Helvetica Neue",sans-serif; font-weight: 400;font-size: 14px;text-transform: uppercase;transition:background-color 0.2s ease-out;background-color:#528ec1;color:#fff;}'+
'.minmaxify-popup.mfp-wrap .mfp-container { background-color: transparent !important; }'+
'.minmaxify-popup .mfp-close { margin:0px;}'+
'.minmaxify-popup ul { padding-left: 2rem; margin-bottom: 2rem; }'+
'.minmaxify-popup button { min-width:unset; }'+
'.minmaxify-popup.mfp-wrap { z-index: 199999999 !important; }'+
'.minmaxify-popup.mfp-wrap.mfp-ready .mfp-content {opacity: 1;}';function initPopups(){var curPopupText;if(!$||mm.shopPopup)
return;if(!$.fn.magnificPopup&&$.ajax){var jqver=$.fn.jquery.split(".");if(jqver[0]>1||jqver[0]==1&&jqver[1]>=7){$("<link/>",{rel:"stylesheet",type:"text/css",href:"https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.1.0/magnific-popup.min.css"}).appendTo("head");$.ajax({cache:true,url:"https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.1.0/jquery.magnific-popup.min.js",success:function(script){var exports={};function require(){return $};eval(script);}});}}
$('<style type="text/css">'+css+'</style>').appendTo("head");mm.showPopup=function(head,lines){if($.fn.magnificPopup){var text=head.replace(new RegExp('\n','g'),'<br/>')+'<ul>';for(var i=0;i<lines.length;++i){var ln=lines[i];if(ln)
text+='<li>'+ln+'</li>';}
text+='</ul><div><button class="minmaxify-btn" style="float:right;margin-right:-1.5em;width:auto" onclick="minMaxify.closePopup()">OK</button><div style="display:table;clear:both;"></div></div>';if($(".minmaxify-popup").length){if(curPopupText==text)
return true;$(".minmaxify-popup").magnificPopup('close');}
curPopupText=text;var mfp=$.magnificPopup;mfp.open({items:{src:'<div>'+text+'</div>',type:'inline',},focus:"nothing",mainClass:'minmaxify-popup'});$(".minmaxify-btn").click(mfp.instance.close.bind(mfp.instance));return true;}}
mm.closePopup=function(){if($.fn.magnificPopup){$.magnificPopup.close();}};}
function formatMoney(v){return v;}
function getSubtotal(){var subtotal=Number(mm.cart.total_price);subtotal=subtotal/100.0;return subtotal;}
function checkSubTotal(){var subtotal=getSubtotal();var minorder=Number(limitsJson.minorder);var maxorder=Number(limitsJson.maxorder);if(subtotal<minorder){reportViolation(formatT("MIN_SUBTOTAL_MSG",{CartMinAmount:formatMoney(minorder)}));return false;}
if((maxorder>0)&&(subtotal>maxorder)){reportViolation(formatT("MAX_SUBTOTAL_MSG",{CartMaxAmount:formatMoney(maxorder)}));return false;}
return true;}
function getWeight(){var weight=Number(mm.cart.total_weight);return weight}
function checkWeight(){var weight=getWeight();var minweight=Number(limitsJson.weightmin);var maxweight=Number(limitsJson.weightmax);if(weight<minweight){reportViolation(formatT("MIN_WEIGHT_MSG",{CartWeight:weight,CartMinWeight:minweight}));return false;}
if((maxweight>0)&&(weight>maxweight)){reportViolation(formatT("MAX_WEIGHT_MSG",{CartWeight:weight,CartMaxWeight:maxweight}));return false;}
return true;}
function checkGenericLimit(title,quantity,line_price,l,refItem){var valid=true;if(quantity<Number(l.min)){valid=reportGenericViolation(refItem,title,"MIN","MinQuantity",l.min);if(refItem)
return false;}
if((Number(l.max)>0)&&(quantity>l.max)){valid=reportGenericViolation(refItem,title,"MAX","MaxQuantity",l.max);if(refItem)
return false;}
if((Number(l.multiple)>1)&&(quantity%Number(l.multiple)>0)){valid=reportGenericViolation(refItem,title,"MULT","QuantityMultiple",l.multiple);if(refItem)
return false;}
var prc=Number(line_price)/100.0;if(prc<Number(l.minAmt||0)){valid=reportGenericViolation(refItem,title,"MIN_SUBTOTAL","MinAmount",formatMoney(l.minAmt));if(refItem)
return false;}
if((Number(l.maxAmt||0)>0)&&(prc>l.maxAmt)){valid=reportGenericViolation(refItem,title,"MAX_SUBTOTAL","MaxAmount",formatMoney(l.maxAmt));if(refItem)
return false;}
return valid;}
function reportGenericViolation(refItem,title,msgName,fldName,fldVal){var params={};if(refItem){params["ProductName"]=title;params["Product"+fldName]=fldVal;msgName="PROD_"+msgName+"_MSG";}else{params["GroupTitle"]=title;params["Group"+fldName]=fldVal;msgName="GROUP_"+msgName+"_MSG";}
var msg=formatT(msgName,params);reportViolation(msg,refItem);return false;}
function collectProductQuantities(){var items=mm.cart.items||[];var products={};for(var i=0;i<items.length;i++){var item=items[i];var handle=item.handle;var prodLimit=limitsJson.productLimits[handle]||{};if(getSkuFilter(item.sku)||!prodLimit.combine){var variant=handle+" "+item['sku'];if(item.sku=="")
variant+=item['variant_id'];products[variant]=$.extend({},item,{title:unescape(item.title),handle:variant});}else{var details=products[handle];if(details===undefined)
details=products[handle]=$.extend({},item,{title:unescape(prodLimit.name||item.title)});else{details.quantity+=Number(item.quantity);details.line_price+=Number(item.line_price);}}}
return products;}
function getSkuFilter(sku){if(sku){var l=limitsJson.productLimits['sku:'+sku];if(l)
return l;var skuFilters=limitsJson.skus;for(var i=0;i<skuFilters.length;++i){l=skuFilters[i];if(sku.indexOf(unescape(l.filter))>-1)
return l;}
}}
function checkItemLimits(){var itemsValid=true;var products=collectProductQuantities();for(var h in products){var item=products[h];if(!checkGenericLimit(item.title,item.quantity,item.line_price,getIndividualLimitsFor(item),item))
itemsValid=false;}
return itemsValid;}
function getIndividualLimitsFor(product){var limits=null;var handle=product.handle||'',variant=product.sku;var index=handle.indexOf(" ");if(index>0){variant=handle.substring(index+1);handle=handle.substring(0,index);}
limits=getSkuFilter(variant);if(!limits)
limits=limitsJson.productLimits[handle];if(limits==null)
limits={min:Number(limitsJson.itemmin),max:Number(limitsJson.itemmax),multiple:Number(limitsJson.itemmult)};return limits;}
function checkTotalItems(){var maxtotalitems=Number(limitsJson.maxtotalitems);var mintotalitems=Number(limitsJson.mintotalitems);var multtotalitems=Number(limitsJson.multtotalitems);var totalItems=0;var totalItemsValid=true;var items=mm.cart.items||[];for(i=0;i<items.length;i++){var item=items[i];var quantity=Number(item['quantity']);totalItems+=quantity;}
if((maxtotalitems!=0)&&(totalItems>maxtotalitems)){totalItemsValid=false;reportViolation(formatT("TOTAL_ITEMS_MAX_MSG",{CartMaxQuantity:maxtotalitems}));}
if(totalItems<mintotalitems){totalItemsValid=false;reportViolation(formatT("TOTAL_ITEMS_MIN_MSG",{CartMinQuantity:mintotalitems}));}
if((multtotalitems>1)&&(totalItems%multtotalitems>0)){totalItemsValid=false;reportViolation(formatT("TOTAL_ITEMS_MULT_MSG",{CartQuantityMultiple:multtotalitems}));}
return totalItemsValid;}
function checkOverride(){var subtotal=getSubtotal();var overridesubtotal=Number(limitsJson['overridesubtotal']);if((overridesubtotal>0)&&(subtotal>overridesubtotal)){return true;}
return false;}
mm.checkLimits=function(){var enable=true;if(!checkOverride()){enable=checkSubTotal();enable=checkItemLimits()&&enable;enable=checkTotalItems()&&enable;enable=checkWeight()&&enable;}
return enable;}
function showLimits(){if(!limitsJson)
return;showLimitsInCart();if(path.indexOf('/products/')!=-1)
$('div.shopify-payment-button').hide();if(location.pathname!=path){path=location.pathname;limitsShown=false;}
if(limitsShown)
return;var ci=getContextItem();if(!ci)
return;var l=getIndividualLimitsFor(ci),$qi=$(selQantityField),ima=$qi.attr('mm-max'),lma=parseInt(l.max)||0,imu=$qi.attr('mm-step'),lmu=l.multiple||1,imi=$qi.attr('mm-min'),lmi=parseInt(l.min)||lmu,val=parseInt($qi.val());if(document.readyState!='loading')
limitsShown=true;if(lmi!=imi){$('.minmaxify-min').text(lmi).parent().show();if(imi?(val==imi):(val==1||!val)){$(selMinField).val(lmi);$qi.val(lmi);}
if(!l.combine)
$qi.attr('min',lmi);else if(imi)
$qi.removeAttr('min');$qi.attr('mm-min',lmi);}
if(lma!=ima){$('.minmaxify-max').text(lma).parent().show();$('.minmaxify-maxfield').val(lma);if(lma)
$qi.attr('max',lma);else if(ima)
$qi.removeAttr('max');$qi.attr('mm-max',lma);}
if(lmu!=imu){$('.minmaxify-multiple').text(lmu).parent().show();$('.minmaxify-multfield').val(lmu);if(!l.combine)
$qi.attr('step',lmu);else if(imu)
$qi.removeAttr('step');$qi.attr('mm-step',lmu);}}
function showLimitsInCart(){var lines=mm.cart&&mm.cart.items;if(!lines)
return;$(selCartQtyField).each(function(){for(var i=0;i<lines.length;++i){var p=lines[i],c=this;if(p.key==c.getAttribute('data-line-id')||c.id&&c.id.search(new RegExp('updates(_large)?_'+p.id,'i'))==0){var l=getIndividualLimitsFor(p);if(l){if(l.min&&!l.combine)
c.min=l.min;if(parseInt(l.max))
c.max=l.max;if(l.multiple&&!l.combine)
c.step=l.multiple;}
break;}}});}
function getContextItem(url){var h=$('#minmaxify-product').text();if(!h){if(!url)
url=decodeURIComponent(path||location.href||'');url=url.split('/');if(url.length>2&&url[url.length-2]=='products')
h=url[url.length-1];else
return;}
var itm={handle:h,sku:''},p;try{p=JSON.parse($('#ProductJson-product-template').text());}
catch(x){}
var meta=(wnd.ShopifyAnalytics||{}).meta;if(!p&&meta)
p=meta.product;if(p){itm.product_description=p.description;itm.product_type=p.type;itm.vendor=p.vendor;itm.price=p.price;itm.product_title=p.title;var vars=p.variants,nvars=vars.length;if(meta&&meta.selectedVariantId||nvars==1){for(var i=0;i<nvars;++i){var v=vars[i];if(nvars==1||v.id==meta.selectedVariantId){itm.variant_title=v.public_title;itm.sku=v.sku;itm.grams=v.weight;if(!itm.product_title)
itm.product_title=v.name;break;}}}}
return itm;}
function setCheckoutMsg(t){var c=$checkoutCtrl;return c?c.val(t):$([]);}
function reportVerifyingProgress(progress){if(progress=='start'){setCheckoutMsg(formatT("VERIFYING_MSG")).addClass('btn--loading');if(!vstart){vstart=now();setTimeout(function(){if(vstart&&(now()-vstart)>19900){if(path=='/cart')
mm.feedback("sv\n"+JSON.stringify(mm.cart));isValid=true;reportVerifyingProgress('stop');}},20000);}}
else if(progress=='stop'){setCheckoutMsg(isValid?originalSubmitText:formatT("NOT_VALID_MSG")).removeClass('btn--loading');vstart=0;if($.fn.magnificPopup&&$(".minmaxify-popup").length)
mm.showMessage();}
else if(progress=='changed'){setCheckoutMsg(formatT("CART_UPDATE_MSG"));}
toggleCheckoutButtons();}
function toggleCheckoutButtons(){$(checkoutFrames).each(function(){var c=this;if(isValid){if(c.mm_hidden){$(c).show();c.mm_hidden=false;}}else{if($(c).is(":visible")){$(c).hide();c.mm_hidden=true;}}});}
mm.onChange=mm.guarded(function(){reportVerifyingProgress('changed');isValid=false;errorMessage=[formatT("CART_UPDATE_MSG2")];toggleCheckoutButtons();});function hookCheckoutBtn(){var $el=$(checkoutSelector);if(!$el.length)
return;$el.removeAttr('disabled');$el.each(function(i){var btn=this;if(!originalSubmitText&&btn.name=='checkout')
originalSubmitText=$(btn).val()||$(btn).text().trim();if(!btn.minmaxifyHooked){var prevOnClick=btn.onclick;if(!prevOnClick)
$(btn).click(mm.guarded(mm.showMessage));else{btn.onclick=mm.guarded(function(e){if(mm.showMessage())
prevOnClick.apply(this,arguments);else
e.preventDefault();})}
btn.minmaxifyHooked=true;}});$checkoutCtrl=$(updatableCheckoutBtnSelector);return $checkoutCtrl;}
function bindOnce(sel,event,f){$(sel).each(function(){if(!this.mmBound){this.mmBound=true;$(this)[event](f);}});}
function hookQtyChangers(){bindOnce(selCartQtyField,'change',mm.onChange);bindOnce(selCartQtyAdjust,'click',mm.onChange);}
function updateVerificationState(forcePopup){if(!$)
return;showLimits();if(!hookCheckoutBtn()&&!forcePopup)
return;hookQtyChangers();isValid=false;reportVerifyingProgress('start');if(mm.cart==null)
reloadCart();else if(limitsJson){errorMessage=[formatT("INTRO_MSG")];isValid=mm.checkLimits();reportVerifyingProgress('stop');if(forcePopup)
mm.showMessage();if(!popupCount&&path=='/cart')
setTimeout(mm.showMessage,100)
}}
wnd.getLimits=updateVerificationState;wnd.mmIsEnabled=function(){return isValid};mm.handleCartUpdate=function(cart,add){if(typeof cart=="string")
cart=JSON.parse(cart);if(add||JSON.stringify(mm.cart)!=JSON.stringify(cart)){if(!add)
mm.cart=cart;else{var item=cart;cart=mm.cart||{total_price:0,total_weight:0,items:[],item_count:0};for(var i=cart.items.length-1;i>=-1;--i){if(i>=0){var prev=cart.items[i];if(prev.id!=item.id)
continue;cart.total_price-=prev.line_price;cart.total_weight-=prev.grams;cart.item_count-=prev.quantity;cart.items.splice(i,1);}
cart.total_price+=item.line_price;cart.total_weight+=item.grams;cart.item_count+=item.quantity;cart.items.push(item);break;}}
qtyChanged=false;updateVerificationState();return 1;}else if(!isValid){updateVerificationState();return 1;}}
function handleCartXHR(xhr,url,method){if(xhr.readyState==4&&xhr.status==200&&url){var t;try{var f;t=xhr.responseText||'';if(url.search(/\/cart(\/update|\/change|)\.js/)==0){if(url.indexOf("callback=")!=-1)
t=t.substring(t.indexOf('{'),t.length-1);f=mm.handleCartUpdate(t);}else if(url.indexOf("/cart/add.js")!=-1){f=mm.handleCartUpdate(t,true);}else if(method=="GET"&&path!='/cart'){updateVerificationState();f=1;}
if(eXHR)
f=eXHR(url,xhr)||f;if(f)
setTimeout(updateVerificationState,500);}catch(ex){if(!t||ex instanceof SyntaxError)
return;console.error(ex);}}}
function reloadCart(){var r=new XMLHttpRequest();r.open('GET','/cart.js?_='+now());r.mmUrl=null;r.onreadystatechange=function(){handleCartXHR(r,'/cart.js');};r.send();setTimeout(function(){if(mm.cart==null&&mm.cartLoadTryCount++<60)
reloadCart();},5000);}
var xhrCls=wnd.XMLHttpRequest.prototype;var xhrOpen=xhrCls.open,xhrSend=xhrCls.send;function hookXHR(){xhrCls.open=function(method,url,async,user,password){this.mmUrl=url;this.mmMethod=method;return xhrOpen.apply(this,arguments);}
xhrCls.send=function(){var r=this;if(r.addEventListener)
r.addEventListener("readystatechange",function(e){handleCartXHR(r,r.mmUrl,r.mmMethod);});else
r.onreadystatechange=mm.guarded(function(){handleCartXHR(r,r.mmUrl)},r.onreadystatechange);return xhrSend.apply(r,arguments);}
var wndFetch=wnd.fetch;if(wndFetch){wnd.fetch=function(url){var p=wndFetch.apply(this,arguments);if(url.indexOf("/cart")==0)
p=p.then(function(r){try{r.ok&&r.clone().text().then(mm.guarded(function(t){r.readyState=4;r.responseText=t;handleCartXHR(r,url,'POST');}));}catch(ex){}
return r;});return p;}}
initPopups();}
function hookUI(){if(!$)
$=wnd.jQuery;if($)
hookCheckoutBtn();if(!$||document.readyState=="loading")
return document.addEventListener("DOMContentLoaded",mm.guarded(hookUI));if(document.getElementById('minmaxify_disable'))
return;errorMessage=[formatT("INTRO_MSG")];updateVerificationState();$('.js-drawer-open-right').click(function(){setTimeout(updateVerificationState,500);});initPopups();mm.initialized=now();if(wnd.trekkie){var oldTrack=trekkie.track;trekkie.track=function(e){if(e=='Viewed Product Variant'){limitsShown=0;setTimeout(mm.guarded(showLimits),0);}
return oldTrack.apply(this,arguments);}}}
if(document.getElementById('minmaxify_disable'))
return;hookXHR();hookUI();})();})(window);