if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
addEventListener('pageshow', () => window.scrollTo({top:0,left:0,behavior:'instant'}));
