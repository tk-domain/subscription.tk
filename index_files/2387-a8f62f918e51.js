var _at = {}; 
		_at.domain = 'www.deathwishcoffee.com'; 
		_at.owner = 'a8f62f918e51'; 
		_at.idSite = '2387';
		_at.attributes = {}; 
		_at.webpushid = 'web.20.aimtell.com'; 
		_at.manifest = '/apps/aimtell/assets/json/aimtell-manifest.json';
		_at.worker = '/apps/aimtell/assets/js/aimtell-worker.js.php';
		(function() { var u='//s3.amazonaws.com/cdn.aimtell.com/trackpush/';var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'trackpush.min.js'; s.parentNode.insertBefore(g,s); })();
		
		if (window.location.protocol != 'https:' && window.location.href.indexOf('account') < 0) {
		  httpsver = 'https:' + window.location.href.substring(window.location.protocol.length);
		  fetch(httpsver, {mode: 'no-cors'}).then(function(response) {  
		      window.location.href = httpsver; //redirect
		  }).catch(function(err) {  
		    console.log('Could not access https version of site');  
		  });
		}

		
		function _aimtellShopifyCartChecker(){

			//generate call
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {

				//on response      
				if (xhr.readyState == 4) {
					shopifyCartContents = JSON.parse(xhr.responseText);

					//if there are items in cart, loop through each item
					if(shopifyCartContents.item_count > 0){ 

						//record cart information for add to cart features
						if(!_aimtellGetCookie('_aimtellCartToken-'+shopifyCartContents.token)){

					        xmlhttp = new XMLHttpRequest(); 
					        _aimtellShopifyData = {};
					        _aimtellShopifyData.subscriber = _aimtellSubscriberID;
					        _aimtellShopifyData.cart = shopifyCartContents.token
					        _aimtellShopifyData.idSite = _at.idSite;
					        _aimtellShopifyData.owner_uid = _at.owner;
					        _aimtellShopifyData.item_count = shopifyCartContents.item_count;
					        postData = JSON.stringify(_aimtellShopifyData); //format data
					        postURL = _aimtellAPI+'/shopify/cookie'; //prod

					        //fire off call to record data
					        xmlhttp.open('POST', postURL,true);
					        xmlhttp.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
					        xmlhttp.send(postData);

					        //mark token as recorded
							_aimtellSetCookie('_aimtellCartToken-'+shopifyCartContents.token, true, 1)
						}

						
						//track each item as an event
						for (var i = 0; i < shopifyCartContents.items.length; i++) {
						    
						    //only track each item once
						    if(!_aimtellGetCookie('_aimtellAddToCart-'+shopifyCartContents.items[i].id)){
						    	_aimtellTrackEvent('Item', 'Add To Cart', shopifyCartContents.items[i].product_title)
						    	_aimtellSetCookie('_aimtellAddToCart-'+shopifyCartContents.items[i].id, true, 1)
						    }
						    
						    
						}
					}
				}

			}
			xhr.open('GET','/cart.js', true);
			xhr.send(null);
		}

		//run when aimtell is ready
		function _aimtellShopifyReady(){

			//run the function every 2.5 seconds
			//var _aimtellCookieChecker = setInterval(function() {
			//	_aimtellShopifyCartChecker();
			//}, 2500);

			_aimtellShopifyCartChecker();
			
		}