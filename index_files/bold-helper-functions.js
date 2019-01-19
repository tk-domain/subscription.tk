/* ********************************************************************
BOLD HELPER FUNCTIONS
Contains helper tools for integrating Bold Apps with AJAX-based themes

Last modified: 2016-07-25
******************************************************************** */

var BOLD = BOLD || {};
BOLD.language = BOLD.language || {};
BOLD.utils = BOLD.utils || {};

var Bold = BOLD.utils;

BOLD.utils.cleanCart = function(cart){
  /* Make sure we have an object to clean. If the is_clean flag is set, our work is already done and we don't need to re-scrub */
  if(typeof(cart)!=='object' || cart.is_clean) return cart;
  
  /* Hold on to a copy of the base cart, just in case. We don't care about any functions or other extensions stuffed into the object, so stringify/parse is a fast way to deep-clone the object. */
  BOLD.rawCart = JSON.parse(JSON.stringify(cart));
  
  cart.bold_original_total = cart.total_price;
  
  var cart_total = 0, cart_items = 0;
  cart.is_recurring = cart.is_recurring || false; 
  
  /* First pass: Set all the properties on the item object that we can. We will set combo line prices in the second pass */
  for(var item in cart.items){
    /* Set the item's line property */
    cart.items[item].line = parseInt(item) + 1;
    
    /* Some themes add JS functionality to the cart. Only worry about the objects. */
    if(typeof(cart.items[item])!=='object') continue;
    
    /* For consistency, clean all properties first (moving all interesting property fields out of the item.properties object and into an item.Bold object). */
    BOLD.utils.cleanProperties(cart.items[item]);
    
    /* Check to see if we need to set the cart as recurring */
    if(!cart.is_recurring) 
      cart.is_recurring = BOLD.utils.isRecurringItem(cart.items[item]);
    
    /* Check for RO discount. Requires V2 RO to get the discount percentage for Options */
    BOLD.utils.setMultiplier(cart.items[item]);
    
    /* Check for a quantity multiplier. This could come from BTM or Builder.  */
    BOLD.utils.setRatio(cart.items[item]);
    
    /* Apply any discounts */
    BOLD.utils.setPriceSingle(cart.items[item]);
    
    /* Adjust the count of items in the cart appropriately */
    cart_items += BOLD.utils.getDisplayQuantity(cart.items[item]);
    
  }
  
  /* Second pass: Calculate price with options, set the true price */
  for(var item in cart.items){
    cart_total += BOLD.utils.setPriceWithOptions(cart, cart.items[item]);
  }
  
  window['mixed_cart'] = cart.is_recurring;
  cart.total_price = cart_total;
  cart.item_count = cart_items;
  cart.is_clean = true;
  
  BOLD.cart = cart;
  return(cart);
};

BOLD.utils.cleanProperties = function(item){
  /* Move all hidden properties into a Bold sub-object for later reference, then create the formatted properties display */
  item.Bold = item.Bold || {};
  item.formatted_properties = "";
  if(item.properties) {
    for(var property in item.properties){
      if( (property.slice(0,1) == '_' && property.slice(1,2) !='_' ) || property == 'master_builder' || property == 'builder_id' || property == 'builder_info' || property == 'frequency_type' || property == 'frequency_type_text' || property == 'frequency_num' || property == 'group_id' || property == 'discounted_price' || item.properties[property] == ""){
        var clean_prop_name = property;
        if(clean_prop_name.slice(0,1) == '_') clean_prop_name = clean_prop_name.replace('_', '');

        /* Save the property to a Bold object on the item so that we can reference it if we need to, then delete the property. */
        item.Bold[clean_prop_name] = item.properties[property];
        
        /* Was the builder_id/master_builder/builder_info prefixed with an underscore? Take note, in case we need to rebuild the real properties object later */
        if(property === 'builder_id' || property === 'master_builder' || property === 'builder_info'){
          item.builder_id_in_checkout = true;
        }
        
        delete item.properties[property];
      }
    }
    /* Set the formatted variables based on the item's properties */
    item.formatted_properties = BOLD.utils.propertiesDisplay(item.properties);
    item.bold_recurring_desc = BOLD.utils.recurringDisplay(item.Bold);
    item.formatted_recurring_desc = BOLD.utils.recurringFormattedDisplay(item.Bold);

    /* If the item has a builder_id, set up shorthands for our Product Options/Builder properties */
    if(item.Bold.builder_id){
      item.builder_id = item.Bold.builder_id;
      item.builder_type = (item.Bold.master_builder ? 'bold-master' : 'bold-hidden');
      item.is_master = (item.Bold.master_builder ? true : false);
      item.is_hidden = (item.Bold.master_builder ? false : true);
    }
    if(item.Bold.builder_info){
      item.builder_info = item.Bold.builder_info.split('~~');
      item.builder_image_alt = item.builder_info[0];
      item.builder_image_src = item.builder_info[1];
      item.url = '/apps/productbuilder/' + item.builder_info[2];
    }
  }
  
  return item.properties;
};

BOLD.utils.getTrueProperties = function(item){
/* Returns the combination of the item's Bold object (which contains the hidden properties) and the visible item.properties */
  var trueProperties = JSON.parse(JSON.stringify(item.properties)); // Clone the properties
  for(var hiddenprop in item.Bold){
    var prefix = '_';
    if( (hiddenprop==='master_builder' || hiddenprop==='builder_id' || hiddenprop==='builder_info') && item.builder_id_in_checkout)
      prefix = '';
    trueProperties[prefix + hiddenprop] = item.Bold[hiddenprop];
  }
  return trueProperties;
};

BOLD.utils.isRecurringItem = function(item){
  if(typeof(item.Bold)!=='object') BOLD.utils.cleanProperties(item);
  return (!isNaN(parseInt(item.Bold.frequency_num)))
};

BOLD.utils.setMultiplier = function(item){
  if(typeof(item.Bold)!=='object') BOLD.utils.cleanProperties(item);
  /* Check for RO discount. Requires V2 RO to get the discount percentage for Options */
  var discount_multiplier = 100.00;
  if (item.Bold && item.Bold.ro_discount_percentage){
    discount_multiplier -= parseFloat(item.Bold.ro_discount_percentage);
  }
  item.discount_multiplier = discount_multiplier *= 0.01;
  return item.discount_multiplier;
};

BOLD.utils.setRatio = function(item){
  if(typeof(item.Bold)!=='object') BOLD.utils.cleanProperties(item);
  /* Check for a quantity multiplier. This could come from BTM or Builder */
  item.qty_ratio = item.qty_ratio || 1;
  item.true_qty = item.true_qty || item.quantity;
  
  if(item.Bold && item.Bold.btm_ratio){
    item.qty_ratio *= parseInt(item.Bold.btm_ratio);
    item.is_btm = true;
  }
  if(item.Bold && item.Bold.bold_ratio){
    item.qty_ratio *= parseInt(item.Bold.bold_ratio);
  }
  /* Special case: one-time charges */
  if(item.Bold.options_one_time_charge){
    item.quantity = 1;
    item.true_qty = item.qty_ratio;
    return item.qty_ratio;
  }
  
  if(item.qty_ratio != 1){
    item.quantity = item.true_qty / item.qty_ratio;  
  }
  
  return item.qty_ratio;
};

BOLD.utils.setPriceSingle = function(item){
  if(typeof(item.Bold)!=='object') BOLD.utils.cleanProperties(item);
  item.original_price = item.original_price || item.price;
  item.price = item.original_price; // Make sure we're doing math starting with the right base price
  
  if(item.discount_multiplier && item.discount_multiplier != 1){
    item.price = Math.round(item.price * item.discount_multiplier);
    item.line_price = item.price * item.quantity;
  }
  if(item.qtyRatio && item.qtyRatio != 1){
    item.price = item.price * item.qty_ratio;
  }
  if(item.Bold.bold_priced_option){
    // This is a line added by the Options Validator and should not count against our javascripted total
    item.price = 0;
    item.line_price = 0;
  }
  
  return item.line_price;
};

BOLD.utils.setPriceWithOptions = function(cart, base_item){
  if(!base_item.price) return 0;
  if(typeof(base_item.Bold)!=='object') BOLD.utils.cleanProperties(base_item);
  if(!base_item.original_price) BOLD.utils.setPriceSingle(base_item);
  
  if(base_item.Bold.builder_id && ! base_item.Bold.master_builder)
    return 0;
  
  var total_price = base_item.price, one_time_charges = 0, builder_id = base_item.Bold.builder_id;
  
  if(!isNaN(parseInt(base_item.Bold.priced_options_count))){
    for(i = 0; i < parseInt(base_item.Bold.priced_options_count); i++){
      if(isNaN(parseInt(base_item.Bold['extra_price_' + i]))) 
        continue;

      var extra_price = parseInt(base_item.Bold['extra_price_' + i]);
      var multiplier = parseInt(base_item.Bold['qty_ratio_' + i] || 1);
      var is_onetime = base_item.Bold['one_time_charge_' + i] || false;

      if(is_onetime)
        one_time_charges += extra_price * multiplier;
      else
        total_price += extra_price * multiplier;

    }// End of extra price loop
    
    //Quick run through the cart to set the associated builder_id sub-products to $0
    for(var item in cart.items){
      if(typeof(cart.items[item].Bold)!=='object') BOLD.utils.cleanProperties(cart.items[item]);

      if(cart.items[item].Bold.builder_id == builder_id && !cart.items[item].Bold.master_builder){
        cart.items[item].original_price = cart.items[item].original_price || cart.items[item].price;
        cart.items[item].price = 0;
        cart.items[item].line_price = 0;
      }
    }// End of price reset loop
  }// End of item-with-validation check
  
  else if(base_item.Bold.master_builder && base_item.Bold.builder_id){
    total_price = 0;
    for(var item in cart.items){
      if(typeof(cart.items[item].Bold)!=='object') BOLD.utils.cleanProperties(cart.items[item]);
      
      if(cart.items[item].Bold.builder_id == builder_id){
        if(cart.items[item].Bold.options_one_time_charge)
          one_time_charges += cart.items[item].price * cart.items[item].qty_ratio;
        else
          total_price += cart.items[item].price * cart.items[item].qty_ratio;
      }
      /* Now that the price has been transferred to the base product, remove the price from the linked option */
      if(cart.items[item].Bold.builder_id == base_item.Bold.builder_id && !cart.items[item].Bold.master_builder){
        cart.items[item].price = 0;
        cart.items[item].line_price = 0;
      }
    }
  }
  base_item.one_time_charges = one_time_charges;
  base_item.price = total_price;
  base_item.line_price_without_one_time_charges = base_item.price * base_item.quantity;
  base_item.line_price = base_item.line_price_without_one_time_charges + base_item.one_time_charges;
  base_item.formatted_onetime_desc = BOLD.utils.onetimeDisplay(one_time_charges);
  
  return base_item.line_price;
};

BOLD.utils.getDisplayQuantity = function(item){
  if(typeof(item.Bold)!=='object') BOLD.utils.cleanProperties(item);
  if(typeof(item.qty_ratio)==='undefined') BOLD.utils.setRatio(item);
  
  if(item.builder_type === 'bold-master' || !item.builder_id)
    return item.quantity;
  else
    return 0;
}

BOLD.utils.updateQtyBoxes = function(){
  /* First make sure all ratio information is properly set */
  jQuery.each(jQuery('[data-bold-ratio]'), function(index, obj){
    if(parseInt(jQuery(obj).data('bold-ratio')) != 1){
      /* The quantity displayed and the quantity passed to checkout are separate - create a hidden input with the true quantity */
      if(jQuery(obj).find('[name="updates[]"]').length && !jQuery(obj).find('.bold-true-quantity').length){
        jQuery(obj).find('[name="updates[]"]').addClass('bold-display-quantity').removeAttr('name').parent().append('<input type="hidden" name="updates[]" class="bold-true-quantity">');   
      }
    }
  });
  
  /* Now loop through all rows that have nonstandard quantity behaviour and set the correct quantity */
  jQuery.each(jQuery('[data-bold-ratio]:not(.bold-hidden), .bold-master'), function(index, obj){
    var multiplier = parseInt(jQuery(obj).data('bold-ratio')) || 1;

    /* Find the base quantity value that we're basing the update on */
    var baseQty;
    if(jQuery(obj).find('.bold-display-quantity').length){
      baseQty = parseInt(jQuery(obj).find('.bold-display-quantity').val());
    }
    else{
      baseQty = parseInt(jQuery(obj).find('[name^=updates]').val());
    }
    if(isNaN(baseQty)) return; /* Abort this round if there's no base quantity to be found */
    
    /* Loop through all matching builder IDs to update. The name=updates will always hold the true quantity, a display-quantity (if it exists) will hold a 'faked' quantity based on the ratio */
    var components = jQuery(obj).closest('form').find('[data-bold-id=' + jQuery(obj).data('bold-id') + ']');
    if(components.length){
      jQuery.each(jQuery(components), function(cindex, component){
        var multiplier = parseInt(jQuery(component).data('bold-ratio')) || 1;

        if(jQuery(component).hasClass('bold-one-time-charge')){
          jQuery(component).find('[name*="updates"]').val(multiplier);
          jQuery(component).find('.bold-display-quantity').val(1);
        }else{
          jQuery(component).find('[name*="updates"]').val(multiplier * baseQty);
          jQuery(component).find('.bold-display-quantity').val(baseQty);
        }
      });
    }
    else{
      /* No builder ID, so we just have to worry about the multiplier ratio on this line */
      jQuery(obj).find('[name*="updates"]').val(multiplier * baseQty);
      jQuery(obj).find('.bold-display-quantity').val(baseQty);
    }
  });
};

BOLD.utils.removeBuilder = function(builder_id, success_callback, error_callback){
  if(typeof(builder_id) !== 'undefined')
    BOLD.utils.getCart(function(cart){ BOLD.utils.removeItemWithOptions(cart, builder_id, success_callback, error_callback) });
}

BOLD.utils.removeItemWithOptions = function(cart, builder_id, success_callback, error_callback){
  BOLD.utils.updateItemWithOptions(cart, builder_id, 0, success_callback, error_callback);
}

BOLD.utils.upateBuilder = function(builder_id, qty, success_callback, error_callback){
  if(typeof(builder_id) !== 'undefined')
    BOLD.utils.getCart(function(cart){ BOLD.utils.updateItemWithOptions(cart, builder_id, qty, success_callback, error_callback) });
}

BOLD.utils.updateItemWithOptions = function(cart, builder_id, qty, success_callback, error_callback){
  
  if(cart && !cart.isClean) BOLD.utils.cleanCart(cart);
  
  var datastr = '';
  for(var i in cart.items){
    /* Inspect each cell for any undefined and skip. */
    if(typeof(cart.items[i].quantity)==='undefined') continue;
    
    if(datastr.length > 1) datastr += '&';
    if(builder_id && cart.items[i].properties && (cart.items[i].properties.builder_id == builder_id || cart.items[i].properties._builder_id == builder_id || cart.items[i].builder_id == builder_id) ){
      var line_qty = qty;
      
      if(cart.items[i].options_one_time_charge && qty) line_qty = 1;
      if(cart.items[i].qty_ratio) line_qty *= cart.items[i].qty_ratio;
      
      if(line_qty > 1000000) {
        console.error('Update aborted: Updating quantities would put the product quantity over Shopify\'s 1,000,000 quantity limit.');
        if(typeof(error_callback)==='function') error_callback();
        return false;
      }
      datastr += 'updates[]=' + line_qty;
    }
    else
      if (cart.items[i].true_qty)
        datastr += 'updates[]=' + cart.items[i].true_qty;
      else
        datastr += 'updates[]=' + cart.items[i].quantity;
  }

  var params = { 
    data: datastr, 
    dataType: 'json', 
    url:'/cart/update.js', 
    method:"POST", 
    success: function(data) {
      if(typeof(success_callback)==='function')
        success_callback(data);
      else if(typeof(Shopify.onCartUpdate)==='function')
        Shopify.onCartUpdate(data)
        },
    error: function(t, e) {
      if(typeof(error_callback)==='function')
        error_callback(t, e);
      else if(typeof(Shopify.onError)==='function')
        Shopify.onError(t, e);
    }
  };
  jQuery.ajax(params);
  
}

BOLD.utils.propertiesDisplay = function(properties){
  if(typeof(properties) !== "object")
    return "";
  
  var property_desc = '<div class="bold-properties">';
  for(var key in properties){
    property_desc += '<div class="bold_option_line"><span class="bold_option_title">' + key + '</\span><span class="bold_option_seperator">: </\span><span class="bold_option_value">';
    if(typeof(properties[key]) === 'string' && properties[key].indexOf('/uploads/') > -1)
      property_desc += '<a href="' + properties[key] + '" data-bold-lang="uploaded_file">' + (BOLD.language['uploaded_file'] || 'Uploaded file') + '</a></\span></div>';
    else
      property_desc += properties[key] + '</\span></div>';

  }
  property_desc += '</div>';
  return property_desc;
};

BOLD.utils.recurringDisplay = function(properties){
  if(properties && properties.frequency_num && properties.frequency_type_text){
    return (BOLD.language['recurring_desc_prefix'] || 'Delivered every ') + properties.frequency_num + (BOLD.language['recurring_desc_spacer'] || ' ') + properties.frequency_type_text + (BOLD.language['recurring_desc_suffix'] || '');
  }
  return '';
};

BOLD.utils.recurringFormattedDisplay = function(properties){
  if(properties && properties.frequency_num && properties.frequency_type_text){
    return '<div class = "bold_recurring_desc"><span class="bold_ro_every"  data-bold-lang="recurring_desc_prefix">' + (BOLD.language['recurring_desc_prefix'] || 'Delivered every ') + '</\span><span class="bold_ro_frequency_num">' + properties.frequency_num + '</\span>' + (BOLD.language['recurring_desc_spacer'] ? '<span class="bold_ro_frequency_spacer" data-bold-lang="recurring_desc_spacer">' + BOLD.language['recurring_desc_spacer'] + '</\span>' : ' ') + '<span class="bold_ro_frequency_type_text">' + properties.frequency_type_text + '</span>' + (BOLD.language['recurring_desc_suffix'] ? '<span class="bold_ro_frequency_suffix" data-bold-lang="recurring_desc_suffix">' + BOLD.language['recurring_desc_suffix'] + '</\span>' : '') + '</div>';
  }
  return '';
};

BOLD.utils.onetimeDisplay = function(cost, money_format){
  if(!cost) return '';
  
  if(!money_format) money_format = BOLD.shop.money_format || Shopify.money_format || "$ {{ amount }}";
  return '<div class="bold_onetime_summary"><span class="bold_onetime_prefix" data-bold-lang="onetime_charge_prefix">' + (BOLD.language['onetime_charge_prefix'] || 'Including one-time charge of ') + '</\span><span class="bold_onetime_charge">' + BOLD.utils.formatMoney(cost, money_format) + '</\span><span class="bold_onetime_suffix" data-bold-lang="onetime_charge_suffix">' + (BOLD.language['onetime_charge_suffix'] || '') + '</\span></div>';
}

/* Shopify doesn't let us set objects as cart attributes - this pair of functions lets us stringify data and retrieve it later */
BOLD.utils.setCartAttrObject = function(name, attributes, success_callback, error_callback){
  var data = { attributes: {} };
  data.attributes[name] = encodeURIComponent(JSON.stringify(attributes));
  var params = {
    url: '/cart/update.js',
    type: 'post',
    dataType: 'json',
    data: data,
    success: success_callback || function(c){ console.info(c) },
    error: error_callback || function(a, b){ console.error(a, b)}
  };
  jQuery.ajax(params);
}

BOLD.utils.getCartAttrObj = function(name, cart){
  if(typeof(cart)!=='object'){
    BOLD.utils.getCart(function(c) { BOLD.utils.getCartAttrObj(name, c) });
    return;
  }
  try {
    return BOLD.cart['data_' + name] = JSON.parse(decodeURIComponent(cart.attributes[name]));
  } catch (e) {
    return BOLD.cart['data_' + name] = false;
  }
};

//     Bold: Helper for using Quantity Breaks with Quick-Shop
//    Run on JS function that opens Quickshop. Add data-product-id="" somewhere on the form
BOLD.utils.update_message_quickshop = function(productID){
jQuery("#shappify-qty-msg-" + productID).html(jQuery('[data-product-id="' + productID +'"] #variant_html_' + jQuery('[data-product-id="' + productID +'"] [name="id"]').val()).html());

if(jQuery('[data-product-id="' + productID +'"] [name="id"]:checked').length){
  jQuery("#shappify-qty-msg-" + productID).html(jQuery('#variant_html_' + jQuery("[name='id']:checked").val()).html());
}
  var prds=jQuery(".shapp_qb_prod");
  var i=0;
  for(i=0;i<prds.length;i++){
    var shapp_var_id=jQuery(prds[i]).find("[name='id']").val();
    var shapp_message=jQuery("#variant_html_"+ shapp_var_id).html();
    var shapp_message_container=jQuery(prds[i]).find(".shappify-qty-msg");
    shapp_message_container.html(shapp_message);
  }
}

// Bold: Helper functions for updating BTM quantities and updating old BTM installs with new BTM property fields
BOLD.utils.upgradeBTMFields = function(form){
  var $form = jQuery(form);
  $form.find('.btm_upgrade').remove();  //Remove the BTM upgrade fields (if they exist) before adding new ones
  $form.find('.btm_quantity_input[name="properties[quantity]"]').attr('name', 'properties[_btm_quantity]')
  
  if($form.find('.bold-btm .measurement_div').length){
    var btm_qty = 1;
    
    if($form.find('.btm_quantity_input').length)
      btm_qty = parseInt($form.find('.btm_quantity_input').attr('name', "properties[_btm_quantity]").val());
    else
      $form.prepend('<input type="hidden" class="btm_upgrade btm_qty" name="properties[_btm_quantity]" value=' + btm_qty + '>');

    var true_qty = parseInt($form.find('[name="quantity"]').last().val());
    var btm_ratio = true_qty / btm_qty;
    
    var option_qty_input = '<input type="hidden" class="btm_upgrade btm_options" name="quantity" value=' + btm_qty + '>';
    var btm_ratio_input = '<input type="hidden" class="btm_upgrade btm_ratio" name="properties[_btm_ratio]" value=' + btm_ratio + '>'
    $form.prepend(option_qty_input).prepend(btm_ratio_input);
  }
  
}

BOLD.utils.calcBTMTotal = function(variant, form){ 
  if(!variant.btm || typeof(mathEval)!='function') return variant.price;
  parsedFormula = variant.btm.formula;
  for(var key in variant.btm){
    var field = variant.btm[key];
    var field_value = (jQuery(form).find('[name="properties[' + field + ']"]').val() || 0);
    parsedFormula = parsedFormula.split('{' + field + '}').join(field_value);
  }
  return (Math.ceil(mathEval(parsedFormula)) || 1) * variant.price;
};
BOLD.utils.calcOptionsTotal = function(form){
  var extrasList = jQuery(form).find('.shappify_option_value [data-variant]:selected');
  if(!extrasList.length) return 0;

  var totalExtras = 0;
  extrasList.each(function(index, obj){ totalExtras += jQuery(obj).data('price') * 100; });
  return parseInt(totalExtras);
};
BOLD.utils.calcTotal = function(variant, form){ return BOLD.utils.calcBTMTotal(variant,form) + BOLD.utils.calcOptionsTotal(form); };

/* Functions for integrating Options/Builder/Recurring Orders with Rivets-based themes */
BOLD.utils.rivetsInit = function(){
  jQuery(document).on('cart.ready, cart.requestComplete',BOLD.utils.rivetsUpdate);
};

BOLD.utils.rivetsUpdate = function(){
  CartJS.updateItem = function(line, qty){ BOLD.utils.changeItem(line, qty, function(cart){jQuery(document).trigger('cart.requestComplete', [cart]);})};
  BOLD.utils.getCart(function(cart){
    
    for(var key in CartJS.cart.items){
      if(isNaN(key)){
        //Transfer across all the extra functionality in CartJS
        cart.items[key] = CartJS.cart.items[key];
      }
      else{
        for(var attr in CartJS.cart.items[key]){
          if(typeof(CartJS.cart.items[key][attr]) === 'function' && cart.items[key])
            cart.items[key][attr] = CartJS.cart.items[key][attr];
        }
      }
    }
    for(var key in cart){ 
      CartJS.cart[key]=cart[key];
    }  
  });
};
/*  Shopify API functions that we need but are not guaranteed to pre-exist on the site   */
BOLD.utils.getCart = function(callback, options) {
  jQuery.getJSON("/cart.js", function(cart, n) {
    if(typeof(options)!=='object' || !options.raw)
      BOLD.utils.cleanCart(cart);
    
    if(typeof(callback)==='function')
      callback(cart);
    else if(typeof(Shopify)==='object' && typeof(Shopify.onCartUpdate)==='function')
      Shopify.onCartUpdate(cart);
  });
};

BOLD.utils.addItemFromForm = function(form, success_callback, error_callback, options){		
  var data, contentType, processData;	
  var options = options || {};
  var url = options.endpoint || '/cart/add';
  var dataSelector;		
  /* Some like to pass the ID, some like to pass the actual form. Check what's coming so we can be all-purpose and agnostic */		
  if(typeof(form)==='string')		
    dataSelector = '#' + form;		
  else		
    dataSelector = '#' + $(form).attr('id');		
  if(typeof(FormData)==='function'){		
    /* Using FormData we can replace the AJAX submit with a submit that sends uploaded files */		
    data = new FormData(document.querySelector(dataSelector));		
    contentType = false;		
    processData = false;		
  }		
  else{		
    /* Failsafe conditions for older browsers */		
    if(jQuery(dataSelector).find('input[type="file"]').length){		
      //File inputs exist - do a proper form submit and skip the fancy ajax-ing		
      jQuery(dataSelector).submit();		
      return false;		
    }		
    data = jQuery(dataSelector).serialize();		
    contentType = 'application/x-www-form-urlencoded; charset=UTF-8';		
    processData = 'true';		
  }		
  /* Another IE failsafe - IE 10/11 only have partial FormData support */
  if(typeof(data.getAll)==='undefined'){
    if(jQuery(dataSelector).find('input[type="file"]').length){		
      //File inputs exist - do a proper form submit and skip the fancy ajax-ing		
      jQuery(dataSelector).submit();		
      return false;		
    }	
    data = jQuery(dataSelector).serialize();		
    contentType = 'application/x-www-form-urlencoded; charset=UTF-8';		
    processData = 'true';	
  }
  var params = {		
    url: url,		
    data: data,		
    processData: processData,		
    contentType: contentType,		
    type: 'POST',		
    dataType: 'json',		
    success: function(result){		
      if(typeof(success_callback)==='function')		
        success_callback(result);		
      else if (typeof(Shopify.onItemAdded)==='function')		
        Shopify.onItemAdded(result)		
        },		
    error: function(a, b){		
      if(typeof(error_callback)==='function')		
        success_callback(a, b);		
      else if (typeof(Shopify.onError)==='function')		
        Shopify.onError(a, b)		
        }		
  };		
  $.ajax(params);		
};
BOLD.utils.updateCartFromForm = function(t, e) {
    var n = {
        type: "POST",
        url: "/cart/update.js",
        data: jQuery("#" + t).serialize(),
        dataType: "json",
        success: function(t) {
            "function" == typeof e ? e(BOLD.utils.cleanCart(t)) : Shopify.onCartUpdate(BOLD.utils.cleanCart(t))
        },
        error: function(t, e) {
            Shopify.onError(t, e)
        }
    };
    jQuery.ajax(n)
};
BOLD.utils.changeItem = function(line, qty, success_callback, error_callback){
  var index = line - 1; //Shopify uses 1-based indexing
  //Get the cart to see if the given line item hasa builder ID. If it does, use our code. Otherwise, just update the line normally.
  BOLD.utils.getCart(function(cart){
    if(cart.items[index].builder_id)
      BOLD.utils.updateItemWithOptions(cart, cart.items[index].builder_id, qty, success_callback, error_callback);
    
    else{
      //Make sure that BTM products are correctly updated 
      if(cart.items[index].qty_ratio) qty *= cart.items[index].qty_ratio;
      
      var params = {
        type: "POST",
        url: "/cart/change.js",
        data: "quantity=" + qty + "&line=" + line,
        dataType: "json",
        success: function(data) {
          if(typeof(success_callback)==='function')
            success_callback(data);
          else if(typeof(Shopify.onCartUpdate)==='function')
            Shopify.onCartUpdate(data)
        },
        error: function(t, e) {
          if(typeof(error_callback)==='function')
            error_callback(t, e);
          else if(typeof(Shopify.onError)==='function')
            Shopify.onError(t, e);
        }
      };
      jQuery.ajax(params);
    }
  });
  
};
BOLD.utils.updateProperties = function(line, qty, properties, success_callback, error_callback, options){
  var params = {
    url: '/cart/change.js',
    data: {
      line: line,
      quantity: qty,
      properties: properties
    },
    type: 'post',
    dataType: 'json',
    success: function(data){
      if(typeof(success_callback)==='function') success_callback(BOLD.utils.cleanCart(data));
    },
    error: function(a, b){
      if(typeof(error_callback)==='function') error_callback(a, b);
    }
  }
  
  if(typeof options == 'object' && options.sequential) {
    params.async = false;
  }
  jQuery.ajax(params);
}
BOLD.utils.formatMoney = Shopify.formatMoney || function(t, e) {
    function n(t, e) {
        return "undefined" == typeof t ? e : t
    }
    function r(t, e, r, i) {
        if (e = n(e, 2),
        r = n(r, ","),
        i = n(i, "."),
        isNaN(t) || null == t)
            return 0;
        t = (t / 100).toFixed(e);
        var o = t.split(".")
          , a = o[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + r)
          , s = o[1] ? i + o[1] : "";
        return a + s
    }
    "string" == typeof t && (t = t.replace(".", ""));
    var i = ""
      , o = /\{\{\s*(\w+)\s*\}\}/
      , a = e || this.money_format;
    switch (a.match(o)[1]) {
    case "amount":
        i = r(t, 2);
        break;
    case "amount_no_decimals":
        i = r(t, 0);
        break;
    case "amount_with_comma_separator":
        i = r(t, 2, ".", ",");
        break;
    case "amount_no_decimals_with_comma_separator":
        i = r(t, 0, ".", ",")
    }
    return a.replace(o, i)
};
