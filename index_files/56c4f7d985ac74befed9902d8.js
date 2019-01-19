(function(){if(!window.$mcSite){$mcSite={};$mcSite.facebookPixel={settings:{pixelId:"140116103309659",enabled:"1"}};}})();
/* eslint-disable */
(function () {
    if (!window.$mcSite.facebookPixel.settings || !!$mcSite.facebookPixel.installed || !window.$mcSite.facebookPixel.settings.enabled) {
        return;
    }

    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','//connect.facebook.net/en_US/fbevents.js');

    fbq('init', $mcSite.facebookPixel.settings.pixelId);
    fbq('track', 'PageView');

    $mcSite.facebookPixel.installed = true;
})();
