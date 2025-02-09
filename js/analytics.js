(function() {
    const GA_ID = 'G-3BT6HMRW5X'; // 替换为你的 GA ID
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag; // 方便在其他地方调用 gtag
    gtag('js', new Date());
    gtag('config', GA_ID);
})();