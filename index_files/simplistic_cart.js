function simplisticValidate(ajax) {
    console.log('call simplistic validate');

    if (!ajax) {
        $("#cart-wrap").hide().after("<div id='loading-cart'><center><b>Loading cart ...</b></center></div>");
    }

    $.ajax({
        url: '/cart.js',
        dataType: 'json',
        success: function(data) {

            if (data.item_count > 0) {
                var addExtra        = false;
                var alreadyHasExtra = false;
                var hasSubscription = false;
                $.each(data.items, function(k,item) {
                    if (item.properties && item.properties.subscription_id) {
                        hasSubscription = true;
                    }
                    if (item.properties && item.properties.subscription_id && !alreadyHasExtra) {
                        addExtra = true;
                    }
                    if (item.variant_id == '21876641025') {
                        alreadyHasExtra = true;
                        addExtra        = false;
                    }
                });
            }

            if (addExtra) {
                simplisticValidated = true;

                // add overlay here with loading
                console.log('add extra');

                $.ajax({
                    type: "POST",
                    url:'/cart/add.js',
                    data: {
                        quantity: 1,
                        id: '21876641025'
                    },
                    dataType: 'json',
                    success: function( data ) {
                        if (location.href.indexOf("cart") > 0) {
                            location.reload();
                        } else {
                            simplisticResetLines();
                        }
                    }
                });
            } else if (alreadyHasExtra && !hasSubscription) {
                // add overlay here with loading

                $.ajax({
                    type: "POST",
                    url:'/cart/update.js',
                    data: {
                        updates: {'21876641025': 0}
                    },
                    dataType: 'json',
                    success: function() {
                        if (location.href.indexOf("cart") > 0) {
                            location.reload();
                        }
                    }
                });
            } else {
                if (!ajax) {
                    $("#loading-cart").hide();
                    $("#cart-wrap").show();
                }
            }
        }
    });
}

// This will re-set the data-line atttribute on the client theme because they are
// hidding the kit from the cart template
function simplisticResetLines() {
    $.ajax({
        url: '/cart.js',
        dataType: 'json',
        success: function(data) {
            //console.log(data);
            $.each(data.items, function(k,item) {
                //var parentDiv = $('button[data-id="'+item.variant_id+'"]').parents('div.ajaxcart__product');
                //if (parentDiv.hasClass('hide'))

                $('button[data-id="'+item.variant_id+'"]').data('line', (k+1));
                $('button[data-id="'+item.variant_id+'"]').parents('div.ajaxcart__row').data('line', (k+1));
            });
        }
    });
}
/**
 * Extra product
 */
$(document).ready(function() {
    simplisticValidate(false);
});


/**
 * Customer updated next charge date
 */
$(document).ready(function() {
  function rc_readCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  if(rc_readCookie('success_msg')=='Next charge date updated') {
    if($('#purchase_id').val()!="") {
      $.ajax({
        url: '/a/smpl/custom_dwc_proxy/ajaxCheckFreeProductChargeDate/'+$('#purchase_id').val(),
      });
    }
  }
});